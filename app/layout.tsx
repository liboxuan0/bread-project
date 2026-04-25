import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "免费面包分享预约",
  description: "共享面包，一起分享面包的美味",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}
