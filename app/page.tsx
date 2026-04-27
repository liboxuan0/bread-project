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
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50/30 to-white">
      <Header />

      {/* Hero section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 border-b border-amber-200/50">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, #92400e 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="container mx-auto px-4 py-14 text-center relative">
          <div className="text-5xl mb-4 animate-float">🍞</div>
          <h1 className="text-3xl md:text-4xl font-bold text-amber-900 mb-3 tracking-tight">
            免费面包分享预约
          </h1>
          <p className="text-amber-700/70 text-lg font-light">
            手作面包，温暖分享
          </p>
        </div>
      </div>

      {/* Bread list */}
      <div className="container mx-auto px-4 py-8">
        {breads.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {breads.map((bread, i) => (
              <BreadCard key={bread.id} bread={bread} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-7xl mb-6 animate-float">🥐</div>
            <p className="text-gray-400 text-lg mb-2">暂无可预约的面包</p>
            <p className="text-gray-300 text-sm">请稍后再来看看～</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-8 text-amber-600/40 text-sm">
        用心烘焙，与你分享
      </footer>
    </main>
  );
}
