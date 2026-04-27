"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase, BreadShare } from "@/lib/supabase";

interface ReservationFormProps {
  bread: BreadShare;
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const weekday = weekdays[date.getDay()];
  return `${month}月${day}日 ${weekday} ${hours}:${minutes}`;
}

function Confetti() {
  const colors = ["#fbbf24", "#f59e0b", "#d97706", "#10b981", "#34d399"];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: `${8 + Math.random() * 84}%`,
            top: "-4px",
            backgroundColor: colors[i % colors.length],
            animation: `confetti-fall ${0.8 + Math.random() * 0.6}s ${Math.random() * 0.3}s ease-out forwards`,
          }}
        />
      ))}
    </div>
  );
}

export default function ReservationForm({ bread }: ReservationFormProps) {
  const pathname = usePathname();
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [contact, setContact] = useState("");
  const [remark, setRemark] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [bookedQuantity, setBookedQuantity] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [remainingQuantity, setRemainingQuantity] = useState(bread.remaining_quantity);

  useEffect(() => {
    loadUserProfile();
    fetchRemainingQuantity();
  }, []);

  const fetchRemainingQuantity = async () => {
    const { data } = await supabase
      .from("bread_shares")
      .select("remaining_quantity")
      .eq("id", bread.id)
      .single();

    if (data) {
      setRemainingQuantity(data.remaining_quantity);
    }
  };

  const loadUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsLoggedIn(!!user);

    if (user) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("pickup_name, phone, wechat_id")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        if (profile.pickup_name) {
          setCustomerName(profile.pickup_name);
        }
        if (profile.phone) {
          setContact(profile.phone);
        } else if (profile.wechat_id) {
          setContact(profile.wechat_id);
        }
      }
    }
  };

  const isExpired = new Date() > new Date(bread.booking_deadline);
  const isSoldOut = remainingQuantity <= 0;
  const canBook = !isExpired && !isSoldOut;
  const maxQuantity = Math.min(bread.limit_per_person, remainingQuantity);

  const validate = (): string | null => {
    if (!customerName.trim()) {
      return "请输入姓名";
    }
    if (!contact.trim()) {
      return "请输入联系方式";
    }
    if (quantity <= 0) {
      return "预约个数必须大于 0";
    }
    if (quantity > bread.limit_per_person) {
      return `每人限约 ${bread.limit_per_person} 个`;
    }
    if (quantity > remainingQuantity) {
      return `剩余个数不足，当前仅剩 ${remainingQuantity} 个`;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError("请先登录后再预约");
      return;
    }

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          share_id: bread.id,
          quantity,
          customer_name: customerName.trim(),
          contact: contact.trim(),
          remark: remark.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setError("请先登录后再预约");
        } else {
          setError(data.error || "预约失败，请稍后重试");
        }
        return;
      }

      setBookedQuantity(quantity);
      setSuccess(true);
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="relative bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border border-green-200 rounded-2xl overflow-hidden animate-scale-in">
        <Confetti />

        {/* Success header */}
        <div className="relative bg-gradient-to-r from-green-500 to-emerald-500 text-white text-center py-5">
          <div className="text-4xl mb-1 animate-slide-up">✓</div>
          <h3 className="text-xl font-bold animate-fade-in delay-150">预约成功</h3>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4 animate-slide-up delay-150">
          <div className="flex items-center gap-3 pb-4 border-b border-green-100">
            <span className="text-2xl">🥖</span>
            <div>
              <div className="text-sm text-gray-500">面包名称</div>
              <div className="text-lg font-bold text-gray-800">{bread.name}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 pb-4 border-b border-green-100">
            <span className="text-2xl">📦</span>
            <div>
              <div className="text-sm text-gray-500">预约个数</div>
              <div className="text-lg font-bold text-gray-800">{bookedQuantity} 个</div>
            </div>
          </div>

          <div className="flex items-center gap-3 pb-4 border-b border-green-100">
            <span className="text-2xl">📅</span>
            <div>
              <div className="text-sm text-gray-500">领取时间</div>
              <div className="text-lg font-bold text-gray-800">
                {formatDateTime(bread.pickup_time)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pb-4 border-b border-green-100">
            <span className="text-2xl">📍</span>
            <div>
              <div className="text-sm text-gray-500">领取地点</div>
              <div className="text-lg font-bold text-gray-800">{bread.pickup_address}</div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <span className="text-amber-500">💡</span>
              <div className="text-sm text-amber-800">
                <div className="font-medium mb-1">温馨提示</div>
                <ul className="space-y-1 text-amber-700">
                  <li>• 请在指定时间前往领取</li>
                  <li>• 领取时请出示预约人姓名</li>
                  <li>• 如无法到场请提前取消预约</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 space-y-3 animate-slide-up delay-225">
          <Link
            href="/me/reservations"
            className="block w-full text-center py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all btn-press shadow-md shadow-green-500/20"
          >
            查看我的预约
          </Link>
          <Link
            href="/"
            className="block w-full text-center py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  if (!canBook) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center animate-fade-in">
        <div className="text-5xl mb-4 animate-float">{isSoldOut ? "😢" : "⏰"}</div>
        <h3 className="text-xl font-bold text-gray-600 mb-2">
          {isSoldOut ? "已约满" : "预约已截止"}
        </h3>
        <p className="text-gray-500">
          {isSoldOut ? "这批面包已被预约完啦" : "预约时间已过，请关注下次分享"}
        </p>
        <a
          href="/"
          className="inline-block mt-6 px-6 py-2 bg-gray-300 text-gray-600 rounded-xl hover:bg-gray-400 transition-colors btn-press"
        >
          返回首页
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Login prompt */}
      {isLoggedIn === false && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 animate-fade-in">
          <p className="text-amber-800 text-sm mb-3">请先登录后再预约</p>
          <Link
            href={`/login?redirect=${encodeURIComponent(pathname)}`}
            className="inline-block px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all btn-press"
          >
            立即登录
          </Link>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm animate-shake">
          {error}
        </div>
      )}

      {/* Quantity selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          预约个数 <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 font-bold hover:bg-amber-200 active:scale-90 transition-all"
          >
            -
          </button>
          <span className="text-2xl font-bold text-gray-800 w-12 text-center tabular-nums">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() =>
              setQuantity(Math.min(maxQuantity, quantity + 1))
            }
            className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 font-bold hover:bg-amber-200 active:scale-90 transition-all"
          >
            +
          </button>
          <span className="text-sm text-gray-500 ml-2">
            每人限约 {bread.limit_per_person} 个
          </span>
        </div>
      </div>

      {/* Name */}
      <div>
        <label
          htmlFor="customerName"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          姓名 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="customerName"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="领取时需出示"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-shadow"
        />
      </div>

      {/* Contact */}
      <div>
        <label
          htmlFor="contact"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          联系方式 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="contact"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="手机号或微信号"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-shadow"
        />
      </div>

      {/* Remark */}
      <div>
        <label
          htmlFor="remark"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          备注
        </label>
        <textarea
          id="remark"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="如有特殊需求可备注"
          rows={3}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none transition-shadow"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all disabled:from-amber-300 disabled:to-orange-300 disabled:cursor-not-allowed btn-press shadow-lg shadow-amber-500/20"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            提交中...
          </span>
        ) : (
          "确认预约"
        )}
      </button>
    </form>
  );
}
