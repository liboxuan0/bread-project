import Link from "next/link";
import { BreadShare } from "@/lib/supabase";

interface BreadCardProps {
  bread: BreadShare;
  index?: number;
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
      className: "bg-gray-200 text-gray-400 cursor-not-allowed",
    };
  }

  if (new Date() > new Date(bread.booking_deadline)) {
    return {
      label: "已截止",
      canBook: false,
      className: "bg-gray-200 text-gray-400 cursor-not-allowed",
    };
  }

  return {
    label: "免费预约",
    canBook: true,
    className: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-amber-500/20",
  };
}

const delayClasses = [
  "", "delay-75", "delay-150", "delay-225",
  "delay-300", "delay-375", "delay-450",
];

export default function BreadCard({ bread, index = 0 }: BreadCardProps) {
  const status = getBookingStatus(bread);
  const isLowStock = bread.remaining_quantity > 0 && bread.remaining_quantity <= 5;

  return (
    <div
      className={`animate-slide-up ${delayClasses[index % delayClasses.length]} bg-white rounded-2xl shadow-sm border border-amber-100/80 overflow-hidden card-lift`}
    >
      {/* Image */}
      <div className="aspect-[4/3] bg-gradient-to-br from-amber-50 to-orange-50 relative overflow-hidden">
        {bread.image_url ? (
          <img
            src={bread.image_url}
            alt={bread.name}
            className="w-full h-full object-cover img-zoom"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl animate-float">🥖</span>
          </div>
        )}
        {/* Remaining badge */}
        <div
          className={`absolute top-3 right-3 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold shadow-sm ${
            isLowStock
              ? "bg-red-500/90 text-white animate-badge-pulse"
              : "bg-white/90 text-amber-700"
          }`}
        >
          {isLowStock ? "仅剩" : "剩余"} {bread.remaining_quantity} 个
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{bread.name}</h3>

        {bread.description && (
          <p className="text-gray-500 text-sm mb-4 line-clamp-2 leading-relaxed">
            {bread.description}
          </p>
        )}

        <div className="space-y-2 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-amber-400">📅</span>
            <span>领取时间：{formatDateTime(bread.pickup_time)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-400">⏰</span>
            <span>截止预约：{formatDateTime(bread.booking_deadline)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-400">👤</span>
            <span>每人限约 {bread.limit_per_person} 个</span>
          </div>
        </div>

        {/* Booking button */}
        {status.canBook ? (
          <Link
            href={`/bread/${bread.id}`}
            className={`block w-full text-center py-3 rounded-xl font-medium transition-all duration-200 btn-press ${status.className}`}
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
