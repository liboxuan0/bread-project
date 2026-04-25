"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-amber-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-amber-700 font-bold">
          <span className="text-xl">🍞</span>
          <span>面包分享</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          {loading ? (
            <span className="text-gray-400">...</span>
          ) : user ? (
            <>
              <Link
                href="/me/reservations"
                className={`hover:text-amber-600 transition-colors ${
                  pathname === "/me/reservations" ? "text-amber-600 font-medium" : "text-gray-600"
                }`}
              >
                我的预约
              </Link>
              <Link
                href="/me/profile"
                className={`hover:text-amber-600 transition-colors ${
                  pathname === "/me/profile" ? "text-amber-600 font-medium" : "text-gray-600"
                }`}
              >
                个人信息
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                退出
              </button>
            </>
          ) : (
            <Link
              href={`/login?redirect=${encodeURIComponent(pathname)}`}
              className="px-4 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              登录
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
