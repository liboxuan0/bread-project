-- 插入测试数据：原味贝果
INSERT INTO bread_shares (
  name,
  description,
  image_url,
  total_quantity,
  remaining_quantity,
  limit_per_person,
  pickup_time,
  pickup_address,
  booking_deadline,
  notice,
  status
) VALUES (
  '原味贝果',
  '低糖手作贝果，适合早餐分享',
  NULL,
  20,
  20,
  2,
  '2026-04-25 15:00:00+08',  -- 本周六 15:00
  '待通知',
  CURRENT_TIMESTAMP + INTERVAL '7 days',  -- 7天后截止
  '请准时领取，过时不候',
  'published'
);
