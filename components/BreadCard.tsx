import Link from "next/link";
import { BreadShare } from "@/lib/supabase";

interface BreadCardProps {
  bread: BreadShare;
  index?: number;
}

function getBookingStatus(bread: BreadShare): {
  canBook: boolean;
  statusLabel: string;
} {
  if (bread.remaining_quantity <= 0) {
    return {
      canBook: false,
      statusLabel: "已下架",
    };
  }

  if (new Date() > new Date(bread.booking_deadline)) {
    return {
      canBook: false,
      statusLabel: "已下架",
    };
  }

  return {
    canBook: true,
    statusLabel: "可预约",
  };
}

export default function BreadCard({ bread }: BreadCardProps) {
  const status = getBookingStatus(bread);
  const placeholderTags = ["食物标签", "食物标签"];

  return (
    <article className="bread-list-card">
      <div className="bread-list-card-media">
        {bread.image_url ? (
          <img
            src={bread.image_url}
            alt={bread.name}
            className="bread-list-card-image"
          />
        ) : (
          <div className="bread-list-card-placeholder">
            <span>🥖</span>
          </div>
        )}
      </div>

      <div
        className={`bread-list-card-status ${
          status.canBook
            ? "bread-list-card-status--available"
            : "bread-list-card-status--closed"
        }`}
      >
        {status.statusLabel}
      </div>

      <div className="bread-list-card-body">
        <h3 className="bread-list-card-title">{bread.name}</h3>

        <div className="bread-list-card-tags">
          {placeholderTags.map((tag, index) => (
            <span key={`${tag}-${index}`} className="bread-list-card-tag">
              {tag}
            </span>
          ))}
        </div>

        <p className="bread-list-card-description">
          {bread.description ?? "今日现做，免费分享，数量有限"}
        </p>

        <div className="bread-list-card-footer">
          <div className="bread-list-card-likes" aria-label="点赞数">
            <img
              src="/实心桃心.svg"
              alt=""
              className="bread-list-card-heart"
              aria-hidden
            />
            <span className="bread-list-card-like-count">124</span>
          </div>

          {status.canBook ? (
            <Link
              href={`/bread/${bread.id}`}
              className="btn-coral btn--s btn--s-cjk bread-list-card-action"
            >
              立即预约
            </Link>
          ) : (
            <Link
              href={`/bread/${bread.id}`}
              className="btn-secondary btn--s btn--s-cjk bread-list-card-action"
            >
              查看详情
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
