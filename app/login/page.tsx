"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

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
      {/* Back link */}
      <div className="mb-6 animate-fade-in">
        <Link
          href="/"
          className="inline-flex items-center text-amber-700 hover:text-amber-800 transition-colors"
        >
          <span className="mr-2">←</span>
          <span>返回首页</span>
        </Link>
      </div>

      {/* Card */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl shadow-amber-900/5 border border-amber-100/60 p-8 animate-slide-up-lg">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3 animate-float">🍞</div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isRegister ? "注册账号" : "欢迎回来"}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {isRegister ? "创建账号参与面包预约" : "登录后即可预约面包"}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm animate-shake">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm animate-fade-in">
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              邮箱
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-shadow"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              密码
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isRegister ? "至少 6 位" : "请输入密码"}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-shadow"
            />
          </div>

          {isRegister && (
            <div className="animate-fade-in">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                确认密码
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入密码"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-shadow"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all disabled:from-amber-300 disabled:to-orange-300 disabled:cursor-not-allowed btn-press shadow-lg shadow-amber-500/20"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                处理中...
              </span>
            ) : (
              isRegister ? "注册" : "登录"
            )}
          </button>
        </form>

        {/* Toggle */}
        <div className="mt-6 text-center text-sm text-gray-400">
          {isRegister ? (
            <>
              已有账号？
              <button
                onClick={() => {
                  setIsRegister(false);
                  setError("");
                  setSuccess("");
                }}
                className="text-amber-600 hover:text-amber-700 font-medium ml-1 transition-colors"
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
                className="text-amber-600 hover:text-amber-700 font-medium ml-1 transition-colors"
              >
                注册新账号
              </button>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-amber-600/40 text-sm mt-6 animate-fade-in delay-300">
        用心烘焙，温暖分享
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <Suspense fallback={<div className="text-amber-600">加载中...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
