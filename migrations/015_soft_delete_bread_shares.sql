-- 假删除：给 bread_share_status 枚举加上 'deleted' 值
-- 改写 admin_delete_bread_share 改为标记 status 而非真删
-- 改写 admin_list_bread_shares 排除 deleted 记录

ALTER TYPE bread_share_status ADD VALUE IF NOT EXISTS 'deleted';

CREATE OR REPLACE FUNCTION admin_delete_bread_share(p_share_id UUID)
RETURNS void AS $$
BEGIN
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'admin required';
  END IF;

  UPDATE bread_shares
  SET status = 'deleted'
  WHERE id = p_share_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'bread not found';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_list_bread_shares()
RETURNS SETOF bread_shares AS $$
BEGIN
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'admin required';
  END IF;

  RETURN QUERY
  SELECT *
  FROM bread_shares
  WHERE status <> 'deleted'
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
