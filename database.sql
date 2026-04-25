-- 创建枚举类型
CREATE TYPE bread_share_status AS ENUM ('draft', 'published', 'closed');
CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'picked_up', 'cancelled', 'no_show');

-- 创建 bread_shares 表 (面包分享表)
CREATE TABLE bread_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  total_quantity INTEGER NOT NULL CHECK (total_quantity >= 0),
  remaining_quantity INTEGER NOT NULL CHECK (remaining_quantity >= 0),
  limit_per_person INTEGER NOT NULL DEFAULT 1 CHECK (limit_per_person > 0),
  pickup_time TIMESTAMP WITH TIME ZONE NOT NULL,
  pickup_address TEXT NOT NULL,
  booking_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  notice TEXT,
  status bread_share_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE bread_shares IS '面包分享表';
COMMENT ON COLUMN bread_shares.id IS '主键ID';
COMMENT ON COLUMN bread_shares.name IS '面包名称';
COMMENT ON COLUMN bread_shares.description IS '面包描述';
COMMENT ON COLUMN bread_shares.image_url IS '面包图片URL';
COMMENT ON COLUMN bread_shares.total_quantity IS '总数量';
COMMENT ON COLUMN bread_shares.remaining_quantity IS '剩余数量';
COMMENT ON COLUMN bread_shares.limit_per_person IS '每人限领数量';
COMMENT ON COLUMN bread_shares.pickup_time IS '领取时间';
COMMENT ON COLUMN bread_shares.pickup_address IS '领取地址';
COMMENT ON COLUMN bread_shares.booking_deadline IS '预约截止时间';
COMMENT ON COLUMN bread_shares.notice IS '注意事项';
COMMENT ON COLUMN bread_shares.status IS '状态: draft=草稿, published=已发布, closed=已结束';
COMMENT ON COLUMN bread_shares.created_at IS '创建时间';
COMMENT ON COLUMN bread_shares.updated_at IS '更新时间';

-- 创建 reservations 表 (预约记录表)
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id UUID NOT NULL REFERENCES bread_shares(id) ON DELETE CASCADE,
  bread_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  customer_name VARCHAR(255) NOT NULL,
  contact VARCHAR(255) NOT NULL,
  remark TEXT,
  status reservation_status NOT NULL DEFAULT 'pending',
  picked_up_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(contact, share_id)
);

COMMENT ON TABLE reservations IS '预约记录表';
COMMENT ON COLUMN reservations.id IS '主键ID';
COMMENT ON COLUMN reservations.share_id IS '关联的面包分享ID';
COMMENT ON COLUMN reservations.bread_name IS '面包名称(冗余存储)';
COMMENT ON COLUMN reservations.quantity IS '预约数量';
COMMENT ON COLUMN reservations.customer_name IS '预约人姓名';
COMMENT ON COLUMN reservations.contact IS '联系方式(手机号/微信)';
COMMENT ON COLUMN reservations.remark IS '备注';
COMMENT ON COLUMN reservations.status IS '状态: pending=待确认, confirmed=已确认, picked_up=已领取, cancelled=已取消, no_show=未到场';
COMMENT ON COLUMN reservations.picked_up_at IS '实际领取时间';
COMMENT ON COLUMN reservations.created_at IS '创建时间';
COMMENT ON COLUMN reservations.updated_at IS '更新时间';

-- 创建 admin_users 表 (管理员表)
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE admin_users IS '管理员表';
COMMENT ON COLUMN admin_users.id IS '主键ID';
COMMENT ON COLUMN admin_users.email IS '管理员邮箱(用于Supabase Auth登录)';
COMMENT ON COLUMN admin_users.role IS '角色: admin=管理员';
COMMENT ON COLUMN admin_users.created_at IS '创建时间';

-- 创建索引以提升查询性能
CREATE INDEX idx_bread_shares_status ON bread_shares(status);
CREATE INDEX idx_bread_shares_pickup_time ON bread_shares(pickup_time);
CREATE INDEX idx_reservations_share_id ON reservations(share_id);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_created_at ON reservations(created_at);
CREATE INDEX idx_admin_users_email ON admin_users(email);

-- 创建更新 updated_at 的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 bread_shares 表创建触发器
CREATE TRIGGER update_bread_shares_updated_at
BEFORE UPDATE ON bread_shares
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 为 reservations 表创建触发器
CREATE TRIGGER update_reservations_updated_at
BEFORE UPDATE ON reservations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
