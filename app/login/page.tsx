"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 验证 redirect 参数，只允许站内路径
  const rawRedirect = searchParams.get("redirect") || "/";
  const redirect = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : "/";

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("请输入邮箱");
      return;
    }
    if (!password) {
      setError("请输入密码");
      return;
    }
    if (isRegister) {
      if (password.length < 6) {
        setError("密码至少 6 位");
        return;
      }
      if (password !== confirmPassword) {
        setError("两次密码不一致");
        return;
      }
    }

    setLoading(true);

    try {
      if (isRegister) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (signUpError) {
          if (signUpError.message.includes("already registered")) {
            setError("该邮箱已注册，请直接登录");
          } else {
            setError(signUpError.message);
          }
          setLoading(false);
          return;
        }

        router.push(redirect);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) {
          setError("邮箱或密码错误");
          setLoading(false);
          return;
        }

        router.push(redirect);
      }
    } catch {
      setError("操作失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
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
          <h1 className="text-2xl font-bold text-gray-800">
            {isRegister ? "注册账号" : "用户登录"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isRegister ? "创建账号参与面包预约" : "登录后可预约面包"}
          </p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* 成功提示 */}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
            {success}
          </div>
        )}

        {/* 表单 */}
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
              placeholder="请输入邮箱"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
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
              placeholder={isRegister ? "至少 6 位" : "请输入密码"}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
          </div>

          {isRegister && (
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                确认密码
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入密码"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors disabled:bg-amber-300 disabled:cursor-not-allowed"
          >
            {loading ? "处理中..." : isRegister ? "注册" : "登录"}
          </button>
        </form>

        {/* 切换登录/注册 */}
        <div className="mt-6 text-center text-sm text-gray-500">
          {isRegister ? (
            <>
              已有账号？
              <button
                onClick={() => {
                  setIsRegister(false);
                  setError("");
                  setSuccess("");
                }}
                className="text-amber-600 hover:text-amber-700 font-medium ml-1"
              >
                立即登录
              </button>
            </>
          ) : (
            <>
              还没有账号？
              <button
                onClick={() => {
                  setIsRegister(true);
                  setError("");
                  setSuccess("");
                }}
                className="text-amber-600 hover:text-amber-700 font-medium ml-1"
              >
                注册新账号
              </button>
            </>
          )}
        </div>
      </div>

      {/* 底部提示 */}
      <p className="text-center text-amber-700/60 text-sm mt-6">
        手作面包，温暖分享 🍞
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
      <Suspense fallback={<div className="text-amber-600">加载中...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
