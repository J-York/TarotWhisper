/**
 * 端点安全校验 · 防止服务端被当作 SSRF 跳板
 *
 * 用户可自定义 endpoint，服务端会代其发起请求（/api/interpret、/api/models）。
 * 若不校验，任何访问者都能让服务器去请求内网服务或云元数据接口。
 *
 * 校验分两级：
 * 1. 云元数据地址（169.254.169.254 等）始终拒绝，环境变量也不能放行
 * 2. 其余私有网段默认拒绝；设置 ALLOW_PRIVATE_ENDPOINTS=true 可放行，
 *    供本地模型（Ollama / LM Studio）使用
 *
 * 已知边界：只看字面 IP，不做 DNS 解析。
 * 攻击者仍可用一个解析到 127.0.0.1 的域名绕过。
 * 若部署在公网且开放了后备 Key，应改为在发请求前解析 DNS 并对结果复检。
 */

/** 云厂商元数据服务地址 · 无论何种配置都拒绝 */
const METADATA_ADDRESSES = new Set([
  '169.254.169.254', // AWS / GCP / Azure / OpenStack
  '169.254.170.2',   // AWS ECS task metadata
  '100.100.100.200', // 阿里云
  'fd00:ec2::254',   // AWS IPv6
]);

/** 直接指向本机的主机名 */
const LOOPBACK_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'ip6-localhost',
  'ip6-loopback',
]);

/** 内部域名后缀 · 解析到这些后缀的地址不应由公网用户触发请求 */
const INTERNAL_SUFFIXES = ['.localhost', '.local', '.internal', '.home.arpa'];

function normalizeHost(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/^\[|\]$/g, '');
}

/** 判断是否为 IPv4 字面量（四段十进制） */
function isIPv4Literal(host: string): boolean {
  const parts = host.split('.');
  if (parts.length !== 4) return false;
  return parts.every((p) => /^\d{1,3}$/.test(p) && Number(p) <= 255);
}

/** 私有 / 保留网段的 IPv4 */
function isPrivateIPv4(host: string): boolean {
  const [a, b] = host.split('.').map(Number);
  if (a === 0) return true;                            // 0.0.0.0/8
  if (a === 10) return true;                           // 10.0.0.0/8
  if (a === 127) return true;                          // 环回
  if (a === 169 && b === 254) return true;             // 链路本地
  if (a === 172 && b >= 16 && b <= 31) return true;    // 172.16.0.0/12
  if (a === 192 && b === 168) return true;             // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true;   // 运营商级 NAT
  if (a >= 224) return true;                           // 组播 / 保留 / 广播
  return false;
}

/** 私有 / 保留的 IPv6（含 IPv4 映射形式） */
function isPrivateIPv6(host: string): boolean {
  if (host === '::' || host === '::1') return true;

  // IPv4 映射地址。URL 会把 ::ffff:127.0.0.1 规范化成 ::ffff:7f00:1，
  // 因此这里要处理十六进制形式，而不是点分十进制
  const mapped = host.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (mapped) {
    const high = parseInt(mapped[1], 16);
    const low = parseInt(mapped[2], 16);
    const ipv4 = `${high >> 8}.${high & 0xff}.${low >> 8}.${low & 0xff}`;
    return isPrivateIPv4(ipv4);
  }

  if (host.startsWith('fe80')) return true;            // 链路本地
  if (host.startsWith('fc') || host.startsWith('fd')) return true; // 唯一本地地址
  return false;
}

export interface EndpointCheckResult {
  ok: boolean;
  /** 面向用户的中文说明，仅在 ok=false 时有值 */
  error?: string;
}

/** 是否显式允许私有网段（本地模型场景） */
function allowPrivateEndpoints(): boolean {
  return process.env.ALLOW_PRIVATE_ENDPOINTS === 'true';
}

/**
 * 校验一个将要在服务端发起请求的端点。
 * 只做字面判断，不发网络请求。
 */
export function checkEndpoint(rawEndpoint: string): EndpointCheckResult {
  let url: URL;
  try {
    url = new URL(rawEndpoint);
  } catch {
    return { ok: false, error: 'API 端点不是有效的网址' };
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return { ok: false, error: 'API 端点必须以 http:// 或 https:// 开头' };
  }

  const host = normalizeHost(url.hostname);

  // 1. 云元数据地址 · 始终拒绝
  if (METADATA_ADDRESSES.has(host)) {
    return { ok: false, error: '该地址被拒绝：指向云服务器元数据服务' };
  }

  // 2. 判断是否落在私有网段
  const isPrivate =
    LOOPBACK_HOSTNAMES.has(host) ||
    INTERNAL_SUFFIXES.some((suffix) => host.endsWith(suffix)) ||
    (isIPv4Literal(host) && isPrivateIPv4(host)) ||
    (host.includes(':') && isPrivateIPv6(host));

  if (isPrivate && !allowPrivateEndpoints()) {
    return {
      ok: false,
      error: 'API 端点不能指向内网或本机地址。若确实要连接本地模型，请设置环境变量 ALLOW_PRIVATE_ENDPOINTS=true',
    };
  }

  return { ok: true };
}
