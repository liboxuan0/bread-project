"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";

type ReservationWithBread = {
  id: string;
  bread_name: string;
  quantity: number;
  status: string;
  created_at: string;
  remark: string | null;
  bread_shares: {
    pickup_time: string;
    pickup_address: string;
    booking_deadline: string;
  } | null;
};

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: "待确认", color: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "已确认", color: "bg-blue-100 text-blue-700" },
  picked_up: { label: "已领取", color: "bg-green-100 text-green-700" },
  cancelled: { label: "已取消", color: "bg-gray-100 text-gray-500" },
  no_show: { label: "未领取", color: "bg-red-100 text-red-700" },
};

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

export default function MyReservationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<ReservationWithBread[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("reservations")
      .select(`
        id,
        bread_name,
        quantity,
        status,
        created_at,
        remark,
        bread_shares:share_id (
          pickup_time,
          pickup_address,
          booking_deadline
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reservations:", error);
    } else {
      setReservations(data as unknown as ReservationWithBread[]);
    }

    setLoading(false);
  };

  const canCancel = (reservation: ReservationWithBread) => {
    if (!["pending", "confirmed"].includes(reservation.status)) return false;
    if (!reservation.bread_shares) return false;
    return new Date() <= new Date(reservation.bread_shares.booking_deadline);
  };

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    setConfirmId(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(`/api/reservations/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (res.ok) {
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r))
      );
    } else {
      const data = await res.json();
      alert(data.error || "撤销失败");
    }

    setCancellingId(null);
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

      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-amber-800 mb-6">我的预约</h1>
        {reservations.length > 0 ? (
          <div className="space-y-4">
            {reservations.map((reservation) => (
              <div
                key={reservation.id}
                className="bg-white rounded-xl shadow-sm border border-amber-100 p-5"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="font-bold text-gray-800 text-lg">
                    {reservation.bread_name}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      statusMap[reservation.status]?.color || "bg-gray-100"
                    }`}
                  >
                    {statusMap[reservation.status]?.label || reservation.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-16">份数</span>
                    <span className="text-gray-800">{reservation.quantity} 份</span>
                  </div>

                  {reservation.bread_shares && (
                    <>
                      <div className="flex gap-2">
                        <span className="text-gray-400 w-16">领取时间</span>
                        <span className="text-gray-800">
                          {formatDateTime(reservation.bread_shares.pickup_time)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-gray-400 w-16">领取地点</span>
                        <span className="text-gray-800">
                          {reservation.bread_shares.pickup_address}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="flex gap-2">
                    <span className="text-gray-400 w-16">预约时间</span>
                    <span className="text-gray-500">
                      {formatDateTime(reservation.created_at)}
                    </span>
                  </div>

                  {reservation.remark && (
                    <div className="flex gap-2">
                      <span className="text-gray-400 w-16">备注</span>
                      <span className="text-gray-600">{reservation.remark}</span>
                    </div>
                  )}
                </div>

                {/* 撤销按钮 */}
                {canCancel(reservation) && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    {confirmId === reservation.id ? (
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">确定撤销？</span>
                        <button
                          onClick={() => handleCancel(reservation.id)}
                          disabled={cancellingId === reservation.id}
                          className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-red-300"
                        >
                          {cancellingId === reservation.id ? "撤销中..." : "确定"}
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          className="px-3 py-1 text-sm bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmId(reservation.id)}
                        className="text-sm text-red-500 hover:text-red-600"
                      >
                        撤销预约
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">暂无预约记录</p>
            <Link
              href="/"
              className="inline-block mt-6 px-6 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors"
            >
              去预约面包
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
