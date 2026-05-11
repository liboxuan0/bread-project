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
    <>
      {/* Top banner */}
      <div
        className="relative z-40 w-full leading-[0]"
        style={{ marginTop: "clamp(-28px, -1.25vw, -12px)" }}
      >
        <img
          src="/dingbu.png"
          alt=""
          className="w-full h-auto block"
        />
      </div>

      {/* Nav bar */}
      <header className="sticky top-0 z-50 bg-transparent">
        <div
          className="container mx-auto px-4 py-0 grid grid-cols-3 items-center"
          style={{
            fontFamily: "'Baloo 2', sans-serif",
            fontSize: "clamp(16px, 1.05vw, 20px)",
            lineHeight: 1.5,
          }}
        >
          {/* Left spacer */}
          <div />

          {/* Center nav */}
          <nav className="flex items-center justify-center gap-1 flex-nowrap">
            {loading ? (
              <span className="text-gray-300 px-3">...</span>
            ) : user ? (
              navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-2 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                    isActive(item.match)
                      ? "font-medium text-[#74320F]"
                      : "text-[#6B3A1A] hover:text-[#8B4218] "
                  }`}
                >
                  {item.label}
                  {isActive(item.match) && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full" style={{ backgroundColor: '#F37C72' }} />
                  )}
                </Link>
              ))
            ) : (
              <Link
                href="/"
                className={`relative px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  pathname === "/"
                    ? "font-medium text-[#74320F]"
                    : "text-[#6B3A1A] hover:text-[#8B4218] "
                }`}
              >
                Home
                {pathname === "/" && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full" style={{ backgroundColor: '#F37C72' }} />
                )}
              </Link>
            )}
          </nav>

          {/* Right action */}
          <div className="flex items-center justify-end">
            {!loading && (user ? (
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-gray-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50"
              >
                Logout
              </button>
            ) : (
              <Link
                href={`/login?redirect=${encodeURIComponent(pathname)}`}
                className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all btn-press shadow-sm shadow-amber-500/20"
              >
                Sign In
              </Link>
            ))}
          </div>
        </div>
      </header>
    </>
  );
}
