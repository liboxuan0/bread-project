"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. 邮箱密码登录
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (authError || !authData.user) {
        setError("账号或密码错误，请检查后重试");
        setLoading(false);
        return;
      }

      // 2. 检查是否在 admin_users 表中
      const { data: adminUser, error: adminError } = await supabase
        .from("admin_users")
        .select("id")
        .eq("email", authData.user.email)
        .maybeSingle();

      if (adminError || !adminUser) {
        // 无权限，退出登录
        await supabase.auth.signOut();
        setError("当前账号无后台访问权限");
        setLoading(false);
        return;
      }

      // 3. 登录成功，跳转到管理页面
      router.push("/admin/bread-shares");
    } catch {
      setError("登录失败，请稍后重试");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="w-full max-w-md px-4">
        {/* 返回首页 */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-amber-700 hover:text-amber-800 transition-colors"
          >
            <span className="mr-2">←</span>
            <span>返回首页</span>
          </Link>
        </div>

        {/* 登录卡片 */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🍞</div>
            <h1 className="text-2xl font-bold text-gray-800">管理员登录</h1>
            <p className="text-gray-500 text-sm mt-1">面包分享后台管理</p>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* 登录表单 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                邮箱
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="请输入邮箱"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-shadow"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                密码
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="请输入密码"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-shadow"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors disabled:bg-amber-300 disabled:cursor-not-allowed"
            >
              {loading ? "登录中..." : "登录"}
            </button>
          </form>
        </div>

        {/* 底部提示 */}
        <p className="text-center text-amber-700/60 text-sm mt-6">
          仅限管理员使用
        </p>
      </div>
    </main>
  );
}
