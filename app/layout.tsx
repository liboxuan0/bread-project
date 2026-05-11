import type { Metadata, Viewport } from "next";
import "./tokens.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "免费面包分享预约",
  description: "共享面包，一起分享面包的美味",
};

// 不限制 viewport 宽度，小屏幕出现横向滚动条而不是缩放适配
export const viewport: Viewport = {
  width: "900",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body style={{ backgroundColor: 'var(--color-bg-page)', minWidth: '900px' }}>{children}</body>
    </html>
  );
}
