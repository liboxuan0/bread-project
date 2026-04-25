-- 允许管理员上架预约截止时间早于当前时间的数据
-- 上架只校验截止时间字段存在，是否还能预约由用户端预约接口继续判断

CREATE OR REPLACE FUNCTION admin_set_bread_share_status(
  p_share_id UUID,
  p_status bread_share_status
)
RETURNS SETOF bread_shares AS $$
DECLARE
  v_bread bread_shares%ROWTYPE;
BEGIN
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'admin required';
  END IF;

  IF p_status NOT IN ('published', 'closed') THEN
    RAISE EXCEPTION 'invalid status';
  END IF;

  SELECT *
  INTO v_bread
  FROM bread_shares
  WHERE id = p_share_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'bread not found';
  END IF;

  IF p_status = 'published' THEN
    IF NULLIF(BTRIM(v_bread.name), '') IS NULL THEN
      RAISE EXCEPTION 'name required';
    END IF;
    IF v_bread.total_quantity <= 0 THEN
      RAISE EXCEPTION 'invalid total quantity';
    END IF;
    IF v_bread.remaining_quantity <= 0 THEN
      RAISE EXCEPTION 'no remaining quantity';
    END IF;
    IF v_bread.limit_per_person <= 0 THEN
      RAISE EXCEPTION 'invalid limit per person';
    END IF;
    IF v_bread.pickup_time IS NULL THEN
      RAISE EXCEPTION 'pickup time required';
    END IF;
    IF NULLIF(BTRIM(v_bread.pickup_address), '') IS NULL THEN
      RAISE EXCEPTION 'pickup address required';
    END IF;
    IF v_bread.booking_deadline IS NULL THEN
      RAISE EXCEPTION 'booking deadline required';
    END IF;
  END IF;

  UPDATE bread_shares
  SET status = p_status
  WHERE id = p_share_id;

  RETURN QUERY
  SELECT *
  FROM bread_shares
  WHERE id = p_share_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
