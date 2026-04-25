"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase, Reservation } from "@/lib/supabase";

const statusLabels: Record<string, { text: string; className: string }> = {
  pending: { text: "待确认", className: "bg-yellow-100 text-yellow-700" },
  confirmed: { text: "已确认", className: "bg-blue-100 text-blue-700" },
  picked_up: { text: "已领取", className: "bg-green-100 text-green-700" },
  cancelled: { text: "已取消", className: "bg-gray-100 text-gray-500" },
  no_show: { text: "未领取", className: "bg-red-100 text-red-700" },
};

const statusOptions = [
  { value: "", label: "全部状态" },
  { value: "pending", label: "待确认" },
  { value: "confirmed", label: "已确认" },
  { value: "picked_up", label: "已领取" },
  { value: "cancelled", label: "已取消" },
  { value: "no_show", label: "未领取" },
];

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${month}-${day} ${hours}:${minutes}`;
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [cancelModal, setCancelModal] = useState<{
    reservation: Reservation;
    returnQuota: boolean;
  } | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchReservations();
  }, [statusFilter]);

  const getAccessToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  };

  const fetchReservations = async () => {
    setLoading(true);
    const token = await getAccessToken();

    if (!token) {
      setReservations([]);
      setLoading(false);
      return;
    }

    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);

    const res = await fetch(`/api/admin/reservations?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setReservations(res.ok ? data.data || [] : []);
    setLoading(false);
  };

  const filteredReservations = reservations.filter((r) =>
    searchKeyword ? r.bread_name.includes(searchKeyword) : true
  );

  const handleStatusChange = async (
    reservation: Reservation,
    newStatus: string
  ) => {
    if (newStatus === "cancelled") {
      setCancelModal({ reservation, returnQuota: true });
      return;
    }

    const token = await getAccessToken();
    if (!token) {
      alert("登录已失效，请重新登录");
      return;
    }

    const res = await fetch(`/api/admin/reservations/${reservation.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "修改失败");
      return;
    }

    fetchReservations();
  };

  const handleCancelConfirm = async () => {
    if (!cancelModal) return;

    setProcessing(true);
    const { reservation, returnQuota } = cancelModal;
    const token = await getAccessToken();

    if (!token) {
      alert("登录已失效，请重新登录");
      setProcessing(false);
      return;
    }

    const res = await fetch(`/api/admin/reservations/${reservation.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: "cancelled", returnQuota }),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "取消失败");
      setProcessing(false);
      return;
    }

    setProcessing(false);
    setCancelModal(null);
    fetchReservations();
  };

  const canChangeStatus = (status: string) => {
    return ["pending", "confirmed"].includes(status);
  };

  const getStatusOptions = (status: string) => {
    if (status === "pending") {
      return [
        { value: "confirmed", label: "确认预约" },
        { value: "cancelled", label: "取消预约" },
      ];
    }
    if (status === "confirmed") {
      return [
        { value: "picked_up", label: "标记已领取" },
        { value: "no_show", label: "标记未领取" },
        { value: "cancelled", label: "取消预约" },
      ];
    }
    return [];
  };

  return (
    <AdminLayout currentPage="reservations">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">预约管理</h1>

      {/* 筛选栏 */}
      <div className="mb-4 flex gap-4 flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="搜索面包名称..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 w-64"
        />
      </div>

      {/* 表格 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-4 text-left text-sm font-medium text-gray-600">
                  预约时间
                </th>
                <th className="px-4 py-4 text-left text-sm font-medium text-gray-600">
                  面包名称
                </th>
                <th className="px-4 py-4 text-left text-sm font-medium text-gray-600">
                  份数
                </th>
                <th className="px-4 py-4 text-left text-sm font-medium text-gray-600">
                  姓名
                </th>
                <th className="px-4 py-4 text-left text-sm font-medium text-gray-600">
                  联系方式
                </th>
                <th className="px-4 py-4 text-left text-sm font-medium text-gray-600">
                  备注
                </th>
                <th className="px-4 py-4 text-left text-sm font-medium text-gray-600">
                  状态
                </th>
                <th className="px-4 py-4 text-left text-sm font-medium text-gray-600">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    加载中...
                  </td>
                </tr>
              ) : filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    暂无预约记录
                  </td>
                </tr>
              ) : (
                filteredReservations.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDateTime(r.created_at)}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {r.bread_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.quantity}</td>
                    <td className="px-4 py-3 text-gray-600">{r.customer_name}</td>
                    <td className="px-4 py-3 text-gray-600">{r.contact}</td>
                    <td className="px-4 py-3 text-gray-500 text-sm max-w-32 truncate">
                      {r.remark || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${statusLabels[r.status].className}`}
                      >
                        {statusLabels[r.status].text}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {canChangeStatus(r.status) ? (
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleStatusChange(r, e.target.value);
                            }
                          }}
                          className="text-sm border border-gray-200 rounded px-2 py-1 bg-white"
                        >
                          <option value="">修改状态</option>
                          {getStatusOptions(r.status).map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 取消预约弹窗 */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">取消预约</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">面包名称</span>
                <span className="font-medium">{cancelModal.reservation.bread_name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">预约人</span>
                <span className="font-medium">{cancelModal.reservation.customer_name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">预约份数</span>
                <span className="font-medium">{cancelModal.reservation.quantity} 份</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cancelModal.returnQuota}
                  onChange={(e) =>
                    setCancelModal({
                      ...cancelModal,
                      returnQuota: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded border-gray-300 text-amber-500 focus:ring-amber-400"
                />
                <span className="text-gray-700">返还名额（将份数加回剩余数量）</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCancelModal(null)}
                className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleCancelConfirm}
                disabled={processing}
                className="flex-1 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:bg-red-300"
              >
                {processing ? "处理中..." : "确认取消"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
