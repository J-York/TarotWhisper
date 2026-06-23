/**
 * 安全的随机 ID 生成。
 *
 * crypto.randomUUID() 仅在安全上下文（HTTPS / localhost）可用；
 * 通过局域网 IP 或纯 HTTP 访问时它是 undefined，直接调用会抛错。
 * 这些 ID 只用作 localStorage / 消息的本地标识，非安全敏感，降级方案足够。
 */
export function genId(): string {
  // ponytail: 时间戳 + 8 位随机已足够本地去重；若将来需全局唯一再上 uuid 库
  return globalThis.crypto?.randomUUID?.()
    ?? `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
