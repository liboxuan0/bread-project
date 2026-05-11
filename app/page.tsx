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

function formatDateTime(dateString?: string): string {
  if (!dateString) return "待定";

  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

  return `${month}月${day}日 ${weekdays[date.getDay()]} ${hours}:${minutes}`;
}

export default async function Home() {
  const breads = await getPublishedBreads();
  const featuredBread = breads.find((bread) => bread.image_url) ?? breads[0];
  const heroButtonStyle = {
    fontSize: "clamp(18px, calc(18px + (100vw - 900px) * 0.005), 22px)",
    lineHeight: "clamp(22px, calc(22px + (100vw - 900px) * 0.01), 30px)",
    padding:
      "clamp(14px, calc(14px + (100vw - 900px) * 0.0025), 16px) clamp(24px, calc(24px + (100vw - 900px) * 0.01), 32px)",
  };

  return (
    <main className="min-h-screen">
      {/* Grid 叠层：Banner 和 Header 共享同一格子，消除负 margin */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr" }}>
        {/* Banner — 格子第一层，撑开高度 */}
        <div
          className="w-full relative overflow-hidden"
          style={{
            gridRow: 1,
            gridColumn: 1,
            zIndex: 20,
            height: "clamp(480px, calc(480px + (100vw - 900px) * 0.2222), 640px)",
            backgroundColor: "#FDEDD7",
            WebkitMaskImage: "linear-gradient(to bottom, black 75%, transparent 100%)",
            maskImage: "linear-gradient(to bottom, black 75%, transparent 100%)",
          }}
        >
          {/* 左侧图片：固定高度，紧贴左边缘，不随宽度变形 */}
          <img
            src="/zuoce.png"
            alt=""
            className="absolute bottom-0 left-0 w-auto block"
            style={{ height: "clamp(480px, calc(480px + (100vw - 900px) * 0.2222), 640px)" }}
          />

          <div
            className="absolute z-10 -translate-y-1/2 text-left"
            style={{
              left: "clamp(16%, calc(16% + (100vw - 900px) * 0.09), 20%)",
              top: "clamp(52%, calc(52% + (100vw - 900px) * 0.0444), 50%)",
            }}
          >
            {/* 帽子：标题左上角 */}
            <img
              src="/maozi.png"
              alt=""
              className="absolute block pointer-events-none"
              style={{
                width:
                  "clamp(56px, calc(56px + (100vw - 900px) * 0.0333), 88px)",
                height: "auto",
                top: "clamp(-56px, calc(-44px - (100vw - 900px) * 0.0167), -44px)",
                left: "clamp(-100px, calc(-60px - (100vw - 900px) * 0.0556), -60px)",
                transform: "rotate(-12deg)",
              }}
            />
            <h1
              style={{
                position: "relative",
                display: "inline-block",
                fontFamily: "'Baloo 2', sans-serif",
                fontSize: "clamp(40px, calc(40px + (100vw - 900px) * 0.025), 60px)",
                fontWeight: 700,
                lineHeight: 1.08,
                color: "var(--color-text-title)",
              }}
            >
              <span className="block whitespace-nowrap">Today&apos;s Bread</span>
              <span className="block whitespace-nowrap">Made for Friends</span>
              {/* 大星星：标题右上角 */}
              <img
                src="/xingxing1.png"
                alt=""
                aria-hidden
                className="absolute block pointer-events-none"
                style={{
                  top: "clamp(-44px, calc(-32px - (100vw - 900px) * 0.0167), -32px)",
                  right: "clamp(-10px, calc(-28px - (100vw - 900px) * 0.0278), -28px)",
                  width:
                    "clamp(40px, calc(40px + (100vw - 900px) * 0.0389), 68px)",
                  height: "auto",
                  transform: "rotate(12deg)",
                }}
              />
            </h1>
            <p
              className="mt-2"
              style={{
                width: "clamp(340px, 40vw, 1000px)",
                fontFamily: "'Baloo 2', sans-serif",
                fontSize: "clamp(16px, calc(16px + (100vw - 900px) * 0.0025), 20px)",
                fontWeight: 500,
                lineHeight: 1.32,
                color: "var(--color-text-title)",
              }}
            >
              Freshly baked in small batches and shared with friends. Reserve
              ahead, then pick up when it&apos;s ready.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-2">
              <a href="#bread-list" className="btn-primary" style={heroButtonStyle}>
                View Bread
              </a>
              <a href="/me/reservations" className="btn-coral" style={heroButtonStyle}>
                My Reservations
              </a>
            </div>
          </div>

          {/* 右侧图片：固定高度，紧贴右边缘，不随宽度变形 */}
          <img
            src="/youce.png"
            alt=""
            className="absolute top-0 right-0 w-auto block"
            style={{ height: "clamp(480px, calc(480px + (100vw - 900px) * 0.2222), 640px)" }}
          />

          {/* 徽章：叠加在右侧图片上层 */}
          <img
            src="/huizhang.png"
            alt=""
            className="absolute block pointer-events-none"
            style={{
              top: "clamp(310px, calc(310px + (100vw - 900px) * 0.0788), 440px)",
              right: "clamp(278px, calc(278px + (100vw - 900px) * 0.28), 900px)",
              width: "clamp(144px, calc(144px + (100vw - 900px) * 0.1), 240px)",
              height: "auto",
              zIndex: 5,
            }}
          />

          {/* 小星星：右侧图片上层装饰 */}
          <img
            src="/xingxing2.png"
            alt=""
            className="absolute block pointer-events-none"
            style={{

              top: "clamp(70px, calc(70px + (100vw - 900px) * 0.0156), 88px)",
              right: "clamp(290px, calc(290px + (100vw - 900px) * 0.1389), 360px)",
              width: "clamp(30px, calc(30px + (100vw - 900px) * 0.0389), 36px)",
              height: "auto",
              zIndex: 6,
            }}
          />
        </div>

        {/* Header — 格子第二层，覆盖在 Banner 上方 */}
        <div style={{ gridRow: 1, gridColumn: 1, zIndex: 30, alignSelf: "start" }}>
          <Header />
        </div>
      </div>

      {/* 下一模块标题 */}
      <div className="flex justify-center pt-2 pb-2">
        <img
          src="/biaoti1.png"
          alt="This Week's Bread Share"
          style={{
            display: "block",
            height:
              "clamp(64px, calc(64px + (100vw - 900px) * 0.02), 272px)",
            width: "auto",
          }}
        />
      </div>

      <div className="featured-bread-section">
        <div className="featured-bread-frame">
          <div className="featured-bread-tape">
            <img src="/jiaodai.png" alt="" />
          </div>
          <div className="featured-bread-frame-shadow">
            <div className="featured-bread-frame-border">
              <div className="featured-bread-frame-inner">
                <div className="featured-bread-image-wrap">
                  {featuredBread?.image_url ? (
                    <img
                      src={featuredBread.image_url}
                      alt={featuredBread.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="text-5xl">🥖</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="featured-bread-copy">
          <h2 className="featured-bread-title">
            {featuredBread?.name ?? "Fresh Bread"}
          </h2>
          <div className="food-tag-list">
            {["你好", "Fresh Baked", "Small Batch"].map((tag) => (
              <span key={tag} className="food-tag">
                {tag}
              </span>
            ))}
          </div>
          <p className="featured-bread-description">
            {featuredBread?.description ??
              "Freshly baked and ready to share. Reserve your favorite bread before it runs out."}
          </p>
          <div className="featured-reservation-info">
            <div className="featured-reservation-row">
              <span className="featured-reservation-label">剩余名额</span>
              <span className="featured-reservation-value">
                {featuredBread ? `${featuredBread.remaining_quantity}个` : "待定"}
              </span>
            </div>
            <div className="featured-reservation-row">
              <span className="featured-reservation-label">每人限约</span>
              <span className="featured-reservation-value">
                {featuredBread ? `${featuredBread.limit_per_person}个` : "待定"}
              </span>
            </div>
            <div className="featured-reservation-row">
              <span className="featured-reservation-label">领取时间</span>
              <span className="featured-reservation-value">
                {formatDateTime(featuredBread?.pickup_time)}
              </span>
            </div>
            <div className="featured-reservation-row">
              <span className="featured-reservation-label">预约截止</span>
              <span className="featured-reservation-value">
                {formatDateTime(featuredBread?.booking_deadline)}
              </span>
            </div>
          </div>
          <div className="featured-reservation-action">
            <a
              href={featuredBread ? `/bread/${featuredBread.id}` : "#bread-list"}
              className="btn-coral btn--m featured-reservation-button"
            >
              Reserve Now
            </a>
            <img
              src="/zhuangshi.png"
              alt=""
              className="featured-reservation-decoration"
            />
          </div>
        </div>
      </div>

      {/* Bread list */}
      <div id="bread-list" className="container mx-auto px-4 py-8">
        <div className="past-bread-title">
          <img src="/bread1.png" alt="" className="past-bread-title-icon" />
          <h2>Past Bread Drops</h2>
        </div>
        {breads.length > 0 ? (
          <div className="bread-list-grid">
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
