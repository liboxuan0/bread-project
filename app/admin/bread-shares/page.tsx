"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import BreadShareForm from "@/components/BreadShareForm";
import { supabase, BreadShare } from "@/lib/supabase";

const statusLabels: Record<string, { text: string; className: string }> = {
  draft: { text: "草稿", className: "bg-gray-100 text-gray-600" },
  published: { text: "已发布", className: "bg-green-100 text-green-700" },
  closed: { text: "已关闭", className: "bg-red-100 text-red-600" },
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

  useEffect(() => {
    fetchBreads();
  }, []);

  const fetchBreads = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("bread_shares")
      .select("*")
      .order("created_at", { ascending: false });
    setBreads(data || []);
    setLoading(false);
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

  const handlePublish = async (id: string) => {
    await supabase.from("bread_shares").update({ status: "published" }).eq("id", id);
    fetchBreads();
  };

  const handleClose = async (id: string) => {
    await supabase.from("bread_shares").update({ status: "closed" }).eq("id", id);
    fetchBreads();
  };

  const handleDelete = async (bread: BreadShare) => {
    if (bread.status === "published") {
      alert("已发布的面包无法删除，请先关闭");
      return;
    }
    if (!confirm(`确定要删除「${bread.name}」吗？`)) return;

    await supabase.from("bread_shares").delete().eq("id", bread.id);
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-4 text-left text-sm font-medium text-gray-600">图片</th>
                <th className="px-4 py-4 text-left text-sm font-medium text-gray-600">名称</th>
                <th className="px-4 py-4 text-left text-sm font-medium text-gray-600">数量</th>
                <th className="px-4 py-4 text-left text-sm font-medium text-gray-600">每人限约</th>
                <th className="px-4 py-4 text-left text-sm font-medium text-gray-600">领取时间</th>
                <th className="px-4 py-4 text-left text-sm font-medium text-gray-600">预约截止</th>
                <th className="px-4 py-4 text-left text-sm font-medium text-gray-600">状态</th>
                <th className="px-4 py-4 text-left text-sm font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    加载中...
                  </td>
                </tr>
              ) : breads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    暂无面包分享
                  </td>
                </tr>
              ) : (
                breads.map((bread) => (
                  <tr key={bread.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center overflow-hidden">
                        {bread.image_url ? (
                          <img src={bread.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl">🥖</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{bread.name}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="text-amber-600 font-medium">{bread.remaining_quantity}</span>
                      <span className="text-gray-400">/{bread.total_quantity}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{bread.limit_per_person}</td>
                    <td className="px-4 py-3 text-gray-600 text-sm">
                      {formatDateTime(bread.pickup_time)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm">
                      {formatDateTime(bread.booking_deadline)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusLabels[bread.status].className}`}>
                        {statusLabels[bread.status].text}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditForm(bread)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          编辑
                        </button>
                        {bread.status === "draft" && (
                          <button
                            onClick={() => handlePublish(bread.id)}
                            className="text-sm text-green-600 hover:text-green-800"
                          >
                            发布
                          </button>
                        )}
                        {bread.status === "published" && (
                          <button
                            onClick={() => handleClose(bread.id)}
                            className="text-sm text-orange-600 hover:text-orange-800"
                          >
                            关闭
                          </button>
                        )}
                        {bread.status !== "published" && (
                          <button
                            onClick={() => handleDelete(bread)}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            删除
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
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
    </AdminLayout>
  );
}
