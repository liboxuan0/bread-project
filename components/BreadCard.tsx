import Link from "next/link";
import { BreadShare } from "@/lib/supabase";

interface BreadCardProps {
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

function getBookingStatus(bread: BreadShare): {
  label: string;
  canBook: boolean;
  className: string;
} {
  if (bread.remaining_quantity <= 0) {
    return {
      label: "已约满",
      canBook: false,
      className: "bg-gray-300 text-gray-500 cursor-not-allowed",
    };
  }

  if (new Date() > new Date(bread.booking_deadline)) {
    return {
      label: "已截止",
      canBook: false,
      className: "bg-gray-300 text-gray-500 cursor-not-allowed",
    };
  }

  return {
    label: "免费预约",
    canBook: true,
    className: "bg-amber-500 hover:bg-amber-600 text-white",
  };
}

export default function BreadCard({ bread }: BreadCardProps) {
  const status = getBookingStatus(bread);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden hover:shadow-md transition-shadow">
      {/* 图片区域 */}
      <div className="aspect-[4/3] bg-amber-50 relative overflow-hidden">
        {bread.image_url ? (
          <img
            src={bread.image_url}
            alt={bread.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl">🥖</span>
          </div>
        )}
        {/* 剩余个数标签 */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-amber-700">
          剩余 {bread.remaining_quantity} 个
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-5">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{bread.name}</h3>

        {bread.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {bread.description}
          </p>
        )}

        <div className="space-y-2 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-amber-500">📅</span>
            <span>领取时间：{formatDateTime(bread.pickup_time)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-500">⏰</span>
            <span>截止预约：{formatDateTime(bread.booking_deadline)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-500">👤</span>
            <span>每人限约 {bread.limit_per_person} 个</span>
          </div>
        </div>

        {/* 预约按钮 */}
        {status.canBook ? (
          <Link
            href={`/bread/${bread.id}`}
            className={`block w-full text-center py-3 rounded-xl font-medium transition-colors ${status.className}`}
          >
            {status.label}
          </Link>
        ) : (
          <button
            disabled
            className={`w-full py-3 rounded-xl font-medium ${status.className}`}
          >
            {status.label}
          </button>
        )}
      </div>
    </div>
  );
}
