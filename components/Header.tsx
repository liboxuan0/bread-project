"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const navItems = [
  { href: "/", label: "Home", match: "/" },
  { href: "/me/reservations", label: "My Bookings", match: "/me/reservations" },
  { href: "/me/profile", label: "Profile", match: "/me/profile" },
];

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

  const isActive = (match: string) =>
    match === "/" ? pathname === "/" : pathname.startsWith(match);

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-amber-100/60 sticky top-0 z-50 transition-shadow">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-amber-700 font-bold group"
        >
          <span className="text-xl transition-transform duration-300 group-hover:rotate-12">🍞</span>
          <span className="transition-colors group-hover:text-amber-800">面包分享</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          {loading ? (
            <span className="text-gray-300 px-3">...</span>
          ) : user ? (
            <>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-3 py-1.5 rounded-lg transition-colors ${
                    isActive(item.match)
                      ? "text-amber-600 font-medium bg-amber-50"
                      : "text-gray-500 hover:text-amber-600 hover:bg-amber-50/50"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="ml-2 text-gray-400 hover:text-gray-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/"
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  pathname === "/"
                    ? "text-amber-600 font-medium bg-amber-50"
                    : "text-gray-500 hover:text-amber-600 hover:bg-amber-50/50"
                }`}
              >
                Home
              </Link>
              <Link
                href={`/login?redirect=${encodeURIComponent(pathname)}`}
                className="ml-2 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all btn-press shadow-sm shadow-amber-500/20"
              >
                Sign In
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
