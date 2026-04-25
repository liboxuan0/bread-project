-- 管理员删除面包分享（SECURITY DEFINER 绕过 RLS）
CREATE OR REPLACE FUNCTION admin_delete_bread_share(p_share_id UUID)
RETURNS void AS $$
BEGIN
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'admin required';
  END IF;

  -- 检查预约记录
  IF EXISTS (SELECT 1 FROM reservations WHERE share_id = p_share_id) THEN
    RAISE EXCEPTION 'has reservations';
  END IF;

  DELETE FROM bread_shares WHERE id = p_share_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
