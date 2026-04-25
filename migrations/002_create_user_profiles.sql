-- 迁移：创建 user_profiles 表

-- 1. 创建 user_profiles 表
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nickname TEXT NOT NULL,
  avatar_url TEXT,
  pickup_name TEXT,
  phone TEXT,
  wechat_id TEXT,
  preference_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 添加字段注释
COMMENT ON TABLE user_profiles IS '用户业务资料表';
COMMENT ON COLUMN user_profiles.user_id IS '关联 auth.users.id';
COMMENT ON COLUMN user_profiles.email IS '登录邮箱（只读）';
COMMENT ON COLUMN user_profiles.nickname IS '用户昵称';
COMMENT ON COLUMN user_profiles.avatar_url IS '头像地址';
COMMENT ON COLUMN user_profiles.pickup_name IS '默认领取人姓名';
COMMENT ON COLUMN user_profiles.phone IS '手机号';
COMMENT ON COLUMN user_profiles.wechat_id IS '微信号';
COMMENT ON COLUMN user_profiles.preference_note IS '偏好备注';

-- 3. 创建 updated_at 自动更新触发器
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- 4. 创建索引
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);

-- 5. 启用 RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 6. RLS 策略：用户只能查看自己的资料
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- 7. RLS 策略：用户只能更新自己的资料
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- 8. RLS 策略：用户可以插入自己的资料
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 9. 注册时自动创建 user_profiles 的触发器
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, nickname, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    '面包朋友' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
    '/avatars/default-1.png'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
