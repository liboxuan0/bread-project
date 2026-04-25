-- 管理员查询所有面包分享（SECURITY DEFINER 绕过 RLS）
CREATE OR REPLACE FUNCTION admin_list_bread_shares()
RETURNS SETOF bread_shares AS $$
BEGIN
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'admin required';
  END IF;

  RETURN QUERY
  SELECT *
  FROM bread_shares
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
