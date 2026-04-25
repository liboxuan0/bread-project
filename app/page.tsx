import { supabase, BreadShare } from "@/lib/supabase";
import BreadCard from "@/components/BreadCard";
import Header from "@/components/Header";

// 禁用缓存，每次请求都获取最新数据
export const dynamic = "force-dynamic";

async function getPublishedBreads(): Promise<BreadShare[]> {
  const { data, error } = await supabase
    .from("bread_shares")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching breads:", error);
    return [];
  }

  return data || [];
}

export default async function Home() {
  const breads = await getPublishedBreads();

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <Header />
      {/* 顶部装饰 */}
      <div className="bg-amber-100/50 border-b border-amber-200">
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="text-5xl mb-4">🍞</div>
          <h1 className="text-3xl md:text-4xl font-bold text-amber-800 mb-3">
            免费面包分享预约
          </h1>
          <p className="text-amber-700/80 text-lg">
            手作面包，温暖分享
          </p>
        </div>
      </div>

      {/* 面包列表 */}
      <div className="container mx-auto px-4 py-8">
        {breads.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {breads.map((bread) => (
              <BreadCard key={bread.id} bread={bread} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🥐</div>
            <p className="text-gray-500 text-lg">暂无可预约的面包</p>
            <p className="text-gray-400 text-sm mt-2">请稍后再来看看～</p>
          </div>
        )}
      </div>

      {/* 底部 */}
      <footer className="text-center py-8 text-amber-700/60 text-sm">
        <p>用心烘焙，与你分享 💛</p>
      </footer>
    </main>
  );
}
