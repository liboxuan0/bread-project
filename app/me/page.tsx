"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, UserProfile } from "@/lib/supabase";
import Header from "@/components/Header";

export default function MePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { data: profileData } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (profileData) {
      setProfile(profileData as UserProfile);
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-amber-600">加载中...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <Header />

      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* 用户信息卡片 */}
        <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-6 mb-6 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-amber-100 overflow-hidden mb-3">
            <img
              src={profile?.avatar_url || "/avatars/default-1.png"}
              alt="头像"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='35' r='25' fill='%23f59e0b'/%3E%3Ccircle cx='50' cy='100' r='40' fill='%23f59e0b'/%3E%3C/svg%3E";
              }}
            />
          </div>
          <div className="font-bold text-gray-800 text-lg">{profile?.nickname || "用户"}</div>
          <div className="text-sm text-gray-500">{profile?.email}</div>
        </div>

        {/* 菜单列表 */}
        <div className="bg-white rounded-xl shadow-sm border border-amber-100 overflow-hidden mb-6">
          <Link
            href="/me/reservations"
            className="flex items-center justify-between px-5 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">📋</span>
              <span className="font-medium text-gray-800">我的预约</span>
            </div>
            <span className="text-gray-400">›</span>
          </Link>

          <Link
            href="/me/profile"
            className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">👤</span>
              <span className="font-medium text-gray-800">个人信息</span>
            </div>
            <span className="text-gray-400">›</span>
          </Link>
        </div>

        {/* 退出登录 */}
        <button
          onClick={handleLogout}
          className="w-full py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
        >
          退出登录
        </button>
      </div>
    </main>
  );
}
