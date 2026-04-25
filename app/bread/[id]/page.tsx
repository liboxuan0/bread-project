import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase, BreadShare } from "@/lib/supabase";
import ReservationForm from "@/components/ReservationForm";
import Header from "@/components/Header";

// 禁用缓存，每次请求都获取最新数据
export const dynamic = "force-dynamic";

interface BreadDetailPageProps {
  params: {
    id: string;
  };
}

async function getBread(id: string): Promise<BreadShare | null> {
  const { data, error } = await supabase
    .from("bread_shares")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (error) {
    console.error("Error fetching bread:", error);
    return null;
  }

  return data;
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

export default async function BreadDetailPage({ params }: BreadDetailPageProps) {
  const bread = await getBread(params.id);

  if (!bread) {
    notFound();
  }

  // 额外检查：即使通过旧链接访问，已下架的也不可预约
  if (bread.status !== "published") {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <Header />

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* 返回链接 */}
        <Link
          href="/"
          className="inline-flex items-center text-amber-700 hover:text-amber-800 transition-colors mb-4"
        >
          <span className="mr-2">←</span>
          <span>返回首页</span>
        </Link>
        {/* 面包图片 */}
        <div className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden mb-6">
          <div className="aspect-[16/9] bg-amber-50 relative">
            {bread.image_url ? (
              <img
                src={bread.image_url}
                alt={bread.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-8xl">🥖</span>
              </div>
            )}
          </div>
        </div>

        {/* 面包信息 */}
        <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-3">{bread.name}</h1>

          {bread.description && (
            <p className="text-gray-600 mb-6 leading-relaxed">
              {bread.description}
            </p>
          )}

          <div className="space-y-3 text-gray-600">
            <div className="flex items-start gap-3 py-2 border-b border-gray-100">
              <span className="text-amber-500 text-lg">📦</span>
              <div>
                <div className="text-sm text-gray-400">剩余份数</div>
                <div className="font-medium">
                  {bread.remaining_quantity} / {bread.total_quantity} 份
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 py-2 border-b border-gray-100">
              <span className="text-amber-500 text-lg">👤</span>
              <div>
                <div className="text-sm text-gray-400">每人限约</div>
                <div className="font-medium">{bread.limit_per_person} 份</div>
              </div>
            </div>

            <div className="flex items-start gap-3 py-2 border-b border-gray-100">
              <span className="text-amber-500 text-lg">📅</span>
              <div>
                <div className="text-sm text-gray-400">领取时间</div>
                <div className="font-medium">
                  {formatDateTime(bread.pickup_time)}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 py-2 border-b border-gray-100">
              <span className="text-amber-500 text-lg">📍</span>
              <div>
                <div className="text-sm text-gray-400">领取地点</div>
                <div className="font-medium">{bread.pickup_address}</div>
              </div>
            </div>

            <div className="flex items-start gap-3 py-2 border-b border-gray-100">
              <span className="text-amber-500 text-lg">⏰</span>
              <div>
                <div className="text-sm text-gray-400">预约截止</div>
                <div className="font-medium">
                  {formatDateTime(bread.booking_deadline)}
                </div>
              </div>
            </div>

            {bread.notice && (
              <div className="flex items-start gap-3 py-2">
                <span className="text-amber-500 text-lg">📝</span>
                <div>
                  <div className="text-sm text-gray-400">领取说明</div>
                  <div className="font-medium whitespace-pre-line">
                    {bread.notice}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 预约表单 */}
        <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>✍️</span>
            <span>免费预约</span>
          </h2>
          <ReservationForm bread={bread} />
        </div>
      </div>

      {/* 底部 */}
      <footer className="text-center py-8 text-amber-700/60 text-sm">
        <p>用心烘焙，与你分享 💛</p>
      </footer>
    </main>
  );
}
