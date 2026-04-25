"use client";

import { useState, useEffect } from "react";
import { supabase, BreadShare } from "@/lib/supabase";

interface BreadShareFormProps {
  bread?: BreadShare | null;
  onSuccess: () => void;
  onCancel: () => void;
}

type FormData = {
  name: string;
  description: string;
  image_url: string;
  total_quantity: number;
  limit_per_person: number;
  pickup_time: string;
  pickup_address: string;
  booking_deadline: string;
  notice: string;
  status: "draft" | "published" | "closed";
};

const defaultForm: FormData = {
  name: "",
  description: "",
  image_url: "",
  total_quantity: 10,
  limit_per_person: 1,
  pickup_time: "",
  pickup_address: "",
  booking_deadline: "",
  notice: "",
  status: "draft",
};

function toLocalDateTimeValue(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function BreadShareForm({
  bread,
  onSuccess,
  onCancel,
}: BreadShareFormProps) {
  const isEditing = !!bread;
  const [form, setForm] = useState<FormData>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");

  // 已预约数量 = 总份数 - 剩余份数
  const bookedQuantity = bread
    ? bread.total_quantity - bread.remaining_quantity
    : 0;

  useEffect(() => {
    if (bread) {
      setForm({
        name: bread.name,
        description: bread.description || "",
        image_url: bread.image_url || "",
        total_quantity: bread.total_quantity,
        limit_per_person: bread.limit_per_person,
        pickup_time: toLocalDateTimeValue(bread.pickup_time),
        pickup_address: bread.pickup_address,
        booking_deadline: toLocalDateTimeValue(bread.booking_deadline),
        notice: bread.notice || "",
        status: bread.status,
      });
    } else {
      setForm(defaultForm);
    }
  }, [bread]);

  // 监控 total_quantity 变化，检查是否小于已预约数量
  useEffect(() => {
    if (isEditing && form.total_quantity < bookedQuantity) {
      setWarning(
        `总份数（${form.total_quantity}）小于已预约数量（${bookedQuantity}），可能导致超卖风险`
      );
    } else {
      setWarning("");
    }
  }, [form.total_quantity, bookedQuantity, isEditing]);

  const validate = (): string | null => {
    if (!form.name.trim()) {
      return "请输入面包名称";
    }
    if (form.total_quantity <= 0) {
      return "总份数必须大于 0";
    }
    if (form.limit_per_person <= 0) {
      return "每人限约必须大于 0";
    }
    if (!form.pickup_time) {
      return "请选择领取时间";
    }
    if (!form.pickup_address.trim()) {
      return "请输入领取地点";
    }
    if (!form.booking_deadline) {
      return "请选择预约截止时间";
    }
    // 预约截止时间应该在领取时间之前
    if (new Date(form.booking_deadline) > new Date(form.pickup_time)) {
      return "预约截止时间应该在领取时间之前";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    // 如果有风险警告，需要用户确认
    if (warning && !confirm(warning + "\n\n确定要继续保存吗？")) {
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        image_url: form.image_url.trim() || null,
        total_quantity: form.total_quantity,
        limit_per_person: form.limit_per_person,
        pickup_time: new Date(form.pickup_time).toISOString(),
        pickup_address: form.pickup_address.trim(),
        booking_deadline: new Date(form.booking_deadline).toISOString(),
        notice: form.notice.trim() || null,
        status: form.status,
      };

      if (isEditing && bread) {
        // 编辑模式：计算新的剩余份数
        const quantityDiff = form.total_quantity - bread.total_quantity;
        const newRemaining = Math.max(0, bread.remaining_quantity + quantityDiff);

        const { error: updateError } = await supabase
          .from("bread_shares")
          .update({
            ...payload,
            remaining_quantity: newRemaining,
          })
          .eq("id", bread.id);

        if (updateError) {
          setError("更新失败：" + updateError.message);
          setSubmitting(false);
          return;
        }
      } else {
        // 新增模式：remaining_quantity 等于 total_quantity
        const { error: insertError } = await supabase
          .from("bread_shares")
          .insert({
            ...payload,
            remaining_quantity: form.total_quantity,
          });

        if (insertError) {
          setError("创建失败：" + insertError.message);
          setSubmitting(false);
          return;
        }
      }

      onSuccess();
    } catch (err) {
      setError("操作失败，请重试");
      setSubmitting(false);
    }
  };

  const handleChange = (
    field: keyof FormData,
    value: string | number
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* 标题栏 */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">
            {isEditing ? "编辑面包分享" : "新增面包分享"}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 错误提示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* 风险警告 */}
          {warning && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl text-sm">
              ⚠️ {warning}
            </div>
          )}

          {/* 面包名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              面包名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              placeholder="如：原味贝果"
            />
          </div>

          {/* 图片地址 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              图片地址
            </label>
            <input
              type="url"
              value={form.image_url}
              onChange={(e) => handleChange("image_url", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              placeholder="https://..."
            />
            {form.image_url && (
              <div className="mt-2 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={form.image_url}
                  alt="预览"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          {/* 面包介绍 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              面包介绍
            </label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none"
              placeholder="简单介绍一下这批面包"
            />
          </div>

          {/* 份数设置 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                总份数 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={form.total_quantity}
                onChange={(e) =>
                  handleChange("total_quantity", parseInt(e.target.value) || 1)
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
              {isEditing && (
                <p className="text-xs text-gray-500 mt-1">
                  已预约 {bookedQuantity} 份，剩余 {bread?.remaining_quantity} 份
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                每人限约 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={form.limit_per_person}
                onChange={(e) =>
                  handleChange("limit_per_person", parseInt(e.target.value) || 1)
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
            </div>
          </div>

          {/* 领取时间 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              领取时间 <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={form.pickup_time}
              onChange={(e) => handleChange("pickup_time", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
          </div>

          {/* 领取地点 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              领取地点 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.pickup_address}
              onChange={(e) => handleChange("pickup_address", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              placeholder="如：xx小区门口"
            />
          </div>

          {/* 预约截止时间 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              预约截止时间 <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={form.booking_deadline}
              onChange={(e) => handleChange("booking_deadline", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
          </div>

          {/* 领取说明 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              领取说明
            </label>
            <textarea
              value={form.notice}
              onChange={(e) => handleChange("notice", e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none"
              placeholder="如：请准时领取，过时不候"
            />
          </div>

          {/* 状态（仅编辑时显示） */}
          {isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                状态
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  handleChange("status", e.target.value as FormData["status"])
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
              >
                <option value="draft">草稿</option>
                <option value="published">已发布</option>
                <option value="closed">已关闭</option>
              </select>
            </div>
          )}

          {/* 按钮 */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors disabled:bg-amber-300 disabled:cursor-not-allowed font-medium"
            >
              {submitting ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
