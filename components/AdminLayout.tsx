"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPage?: "bread-shares" | "reservations";
}

export default function AdminLayout({
  children,
  currentPage,
}: AdminLayoutProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [logoutError, setLogoutError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !user.email) {
        router.replace("/admin/login");
        return;
      }

      const { data: adminUser } = await supabase
        .from("admin_users")
        .select("id")
        .eq("email", user.email)
        .maybeSingle();

      if (!adminUser) {
        await supabase.auth.signOut();
        router.replace("/admin/login");
        return;
      }

      setEmail(user.email);
      setLoading(false);
    } catch {
      router.replace("/admin/login");
    }
  };

  const handleLogout = async () => {
    setLogoutError("");
    setLoggingOut(true);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setLogoutError("退出登录失败，请重试");
        setLoggingOut(false);
        return;
      }
      router.replace("/admin/login");
    } catch {
      setLogoutError("退出登录失败，请重试");
      setLoggingOut(false);
    }
  };

  const navItems = [
    { label: "面包分享", href: "/admin/bread-shares", key: "bread-shares" },
    { label: "预约管理", href: "/admin/reservations", key: "reservations" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🍞</div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 退出登录错误提示 */}
      {logoutError && (
        <div className="fixed top-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm z-50">
          {logoutError}
        </div>
      )}

      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🍞</span>
              <h1 className="text-lg font-bold text-gray-800">面包分享后台</h1>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{email}</span>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="text-sm text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
              >
                {loggingOut ? "退出中..." : "退出登录"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 二级导航 */}
      <nav className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex gap-6">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                  currentPage === item.key
                    ? "border-amber-500 text-amber-600"
                    : "border-transparent text-gray-600 hover:text-gray-800"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
