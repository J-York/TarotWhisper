import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 开发浮标会盖住移动端底部导航的第一项
  devIndicators: false,
  // 神谕对话与亲手抽牌已合并到首页，旧链接继续可用
  async redirects() {
    return [
      { source: "/agent", destination: "/", permanent: false },
      { source: "/reading", destination: "/?mode=self", permanent: false },
    ];
  },
};

export default nextConfig;
