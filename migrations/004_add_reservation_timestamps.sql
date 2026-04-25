-- 添加预约状态时间戳字段
-- confirmed_at: 管理员确认预约的时间
-- cancelled_at: 预约被取消的时间

-- 添加 confirmed_at 字段
ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

-- 添加 cancelled_at 字段
ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- 添加注释
COMMENT ON COLUMN reservations.confirmed_at IS '管理员确认预约的时间';
COMMENT ON COLUMN reservations.cancelled_at IS '预约被取消的时间';
