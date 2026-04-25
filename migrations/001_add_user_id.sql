-- 迁移：为 reservations 表增加 user_id 字段

-- 1. 添加 user_id 字段（关联 Supabase Auth 用户）
ALTER TABLE reservations
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. 添加注释
COMMENT ON COLUMN reservations.user_id IS '预约用户ID(关联auth.users)';

-- 3. 删除旧的唯一约束（contact + share_id）
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_contact_share_id_key;

-- 4. 添加新的唯一约束（user_id + share_id）
ALTER TABLE reservations ADD CONSTRAINT reservations_user_share_unique UNIQUE(user_id, share_id);

-- 5. 为 user_id 创建索引
CREATE INDEX idx_reservations_user_id ON reservations(user_id);
