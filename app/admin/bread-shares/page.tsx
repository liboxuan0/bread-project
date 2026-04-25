"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import BreadShareForm from "@/components/BreadShareForm";
import { supabase, BreadShare } from "@/lib/supabase";

const statusLabels: Record<string, { text: string; className: string }> = {
  draft: { text: "草稿", className: "bg-gray-100 text-gray-600" },
  published: { text: "已上架", className: "bg-green-100 text-green-700" },
  closed: { text: "已下架", className: "bg-orange-100 text-orange-600" },
};

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${month}-${day} ${hours}:${minutes}`;
}

export default function BreadSharesPage() {
  const [breads, setBreads] = useState<BreadShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBread, setEditingBread] = useState<BreadShare | null>(null);
  const [unpublishTarget, setUnpublishTarget] = useState<BreadShare | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
  };

  const getAccessToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  };

  const fetchBreads = async () => {
    setLoading(true);
    const token = await getAccessToken();
    if (token) {
      const res = await fetch("/api/admin/bread-shares", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setBreads(json.data || []);
    } else {
      const { data } = await supabase
        .from("bread_shares")
        .select("*")
        .order("created_at", { ascending: false });
      setBreads(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBreads();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const validateBeforePublish = (bread: BreadShare): string | null => {
    if (!bread.name?.trim()) return "请填写面包名称";
    if (!bread.total_quantity || bread.total_quantity <= 0) return "请设置总个数";
    if (!bread.remaining_quantity || bread.remaining_quantity <= 0) return "剩余可预约个数必须大于 0";
    if (!bread.limit_per_person || bread.limit_per_person <= 0) return "请设置每人最多预约个数";
    if (!bread.pickup_time) return "请设置领取时间";
    if (!bread.pickup_address?.trim()) return "请设置领取地点";
    if (!bread.booking_deadline) return "请设置预约截止时间";
    return null;
  };

  const handleTogglePublish = async (bread: BreadShare, targetChecked: boolean) => {
    if (targetChecked) {
      // 上架：前端校验
      const validationError = validateBeforePublish(bread);
      if (validationError) {
        showToast(validationError, "error");
        return;
      }

      setProcessingId(bread.id);
      const token = await getAccessToken();
      if (!token) {
        showToast("登录已失效，请重新登录", "error");
        setProcessingId(null);
        return;
      }

      try {
        const res = await fetch(`/api/admin/bread-shares/${bread.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status: "published" }),
        });

        if (!res.ok) {
          const data = await res.json();
          showToast(data.error || "上架失败", "error");
          return;
        }

        showToast("已上架，用户端可预约");
        await fetchBreads();
      } catch {
        showToast("上架失败，请稍后重试", "error");
      } finally {
        setProcessingId(null);
      }
    } else {
      // 下架：弹窗确认
      setUnpublishTarget(bread);
    }
  };

  const handleUnpublishConfirm = async () => {
    if (!unpublishTarget) return;
    const target = unpublishTarget;
    setProcessingId(target.id);
    setUnpublishTarget(null);

    const token = await getAccessToken();
    if (!token) {
      showToast("登录已失效，请重新登录", "error");
      setProcessingId(null);
      return;
    }

    try {
      const res = await fetch(`/api/admin/bread-shares/${target.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "closed" }),
      });

      if (!res.ok) {
        showToast("下架失败，请稍后重试", "error");
        return;
      }

      showToast("已下架，用户端将不再展示");
      await fetchBreads();
    } catch {
      showToast("下架失败，请稍后重试", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteBreadShare = async (bread: BreadShare) => {
    const token = await getAccessToken();
    if (!token) { showToast("登录已失效，请重新登录", "error"); return; }

    try {
      const res = await fetch(`/api/admin/bread-shares/${bread.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "删除失败，请稍后重试", "error");
        return;
      }

      showToast("删除成功");
      await fetchBreads();
    } catch {
      showToast("删除失败，请稍后重试", "error");
    }
  };

  const openCreateForm = () => {
    setEditingBread(null);
    setShowForm(true);
  };

  const openEditForm = (bread: BreadShare) => {
    setEditingBread(bread);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingBread(null);
  };

  const handleFormSuccess = () => {
    closeForm();
    fetchBreads();
  };

  return (
    <AdminLayout currentPage="bread-shares">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">面包分享管理</h1>
        <button
          onClick={openCreateForm}
          className="bg-amber-500 text-white px-5 py-2 rounded-xl hover:bg-amber-600 transition-colors font-medium"
        >
          + 发布新面包
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm ${
          toast.type === "success"
            ? "bg-green-50 border border-green-200 text-green-700"
            : "bg-red-50 border border-red-200 text-red-700"
        }`}>
          {toast.message}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-4 text-left text-sm font-medium text-gray-600">图片</th>
                <th className="px-4 py-4 text-left text-sm font-medium text-gray-600">面包名称</th>
                <th className="px-4 py-4 text-left text-sm font-medium text-gray-600">状态</th>
                <th className="px-4 py-4 text-left text-sm font-medium text-gray-600">上架</th>
                <th className="px-4 py-4 text-left text-sm font-medium text-gray-600">总个数</th>
                <th className="px-4 py-4 text-left text-sm font-medium text-gray-600">剩余个数</th>
                <th className="px-4 py-4 text-left text-sm font-medium text-gray-600">每人限约</th>
                <th className="px-4 py-4 text-left text-sm font-medium text-gray-600">领取时间</th>
                <th className="px-4 py-4 text-left text-sm font-medium text-gray-600">预约截止</th>
                <th className="px-4 py-4 text-left text-sm font-medium text-gray-600">创建时间</th>
                <th className="px-4 py-4 text-left text-sm font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-400">加载中...</td>
                </tr>
              ) : breads.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-400">暂无面包分享</td>
                </tr>
              ) : (
                breads.map((bread) => {
                  const isChecked = bread.status === "published";
                  const switchLabel = isChecked
                    ? "已上架"
                    : bread.status === "closed"
                    ? "已下架"
                    : "未上架";
                  const isProcessing = processingId === bread.id;

                  return (
                    <tr key={bread.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center overflow-hidden">
                          {bread.image_url ? (
                            <img src={bread.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-lg">🥖</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">{bread.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusLabels[bread.status].className}`}>
                          {statusLabels[bread.status].text}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isChecked}
                            disabled={isProcessing}
                            onClick={() => handleTogglePublish(bread, !isChecked)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 disabled:opacity-50 ${
                              isChecked ? "bg-green-500" : "bg-gray-200"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                isChecked ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </button>
                          <span className="text-xs text-gray-500">
                            {isProcessing ? "处理中..." : switchLabel}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{bread.total_quantity}</td>
                      <td className="px-4 py-3">
                        <span className="text-amber-600 font-medium">{bread.remaining_quantity}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{bread.limit_per_person}</td>
                      <td className="px-4 py-3 text-gray-600 text-sm">{formatDateTime(bread.pickup_time)}</td>
                      <td className="px-4 py-3 text-gray-600 text-sm">{formatDateTime(bread.booking_deadline)}</td>
                      <td className="px-4 py-3 text-gray-600 text-sm">{formatDateTime(bread.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditForm(bread)}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("确认删除该面包？\n删除后将不再展示，已有预约记录仍会保留。")) {
                                handleDeleteBreadShare(bread);
                              }
                            }}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 新增/编辑表单弹窗 */}
      {showForm && (
        <BreadShareForm
          bread={editingBread}
          onSuccess={handleFormSuccess}
          onCancel={closeForm}
        />
      )}

      {/* 下架确认弹窗 */}
      {unpublishTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-3">确认下架该面包？</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              下架后，该面包将不再展示在用户端，用户无法继续预约。已产生的预约记录不会被删除，仍可在预约管理中查看和处理。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setUnpublishTarget(null)}
                className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleUnpublishConfirm}
                className="flex-1 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600"
              >
                确认下架
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
