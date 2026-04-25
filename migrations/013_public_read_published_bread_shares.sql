-- 允许前台公开读取已上架面包
-- 首页和详情页使用 anon key，只能看到 status = 'published' 的数据

ALTER TABLE bread_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published bread shares" ON bread_shares;

CREATE POLICY "Public can view published bread shares"
ON bread_shares
FOR SELECT
USING (status = 'published');
