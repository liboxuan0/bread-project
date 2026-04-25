-- 创建面包图片存储桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bread-images',
  'bread-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- 已登录用户可上传（管理员身份由 API 层校验）
CREATE POLICY "Authenticated can upload images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'bread-images'
    AND auth.role() = 'authenticated'
  );

-- 已登录用户可删除
CREATE POLICY "Authenticated can delete images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'bread-images'
    AND auth.role() = 'authenticated'
  );

-- 公开读取
CREATE POLICY "Public can view images" ON storage.objects
  FOR SELECT USING (bucket_id = 'bread-images');
