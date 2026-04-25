-- 管理员创建面包分享 RPC：统一在数据库内做管理员校验和字段约束

CREATE OR REPLACE FUNCTION admin_create_bread_share(
  p_name TEXT,
  p_description TEXT,
  p_image_url TEXT,
  p_total_quantity INTEGER,
  p_remaining_quantity INTEGER,
  p_limit_per_person INTEGER,
  p_pickup_time TIMESTAMPTZ,
  p_pickup_address TEXT,
  p_booking_deadline TIMESTAMPTZ,
  p_notice TEXT
)
RETURNS SETOF bread_shares AS $$
DECLARE
  v_share_id UUID;
BEGIN
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'admin required';
  END IF;

  IF NULLIF(BTRIM(p_name), '') IS NULL THEN
    RAISE EXCEPTION 'name required';
  END IF;

  IF p_total_quantity IS NULL OR p_total_quantity <= 0 THEN
    RAISE EXCEPTION 'invalid total quantity';
  END IF;

  IF p_remaining_quantity IS NULL OR p_remaining_quantity < 0 OR p_remaining_quantity > p_total_quantity THEN
    RAISE EXCEPTION 'invalid remaining quantity';
  END IF;

  IF p_limit_per_person IS NULL OR p_limit_per_person <= 0 THEN
    RAISE EXCEPTION 'invalid limit per person';
  END IF;

  IF p_pickup_time IS NULL THEN
    RAISE EXCEPTION 'pickup time required';
  END IF;

  IF NULLIF(BTRIM(p_pickup_address), '') IS NULL THEN
    RAISE EXCEPTION 'pickup address required';
  END IF;

  IF p_booking_deadline IS NULL THEN
    RAISE EXCEPTION 'booking deadline required';
  END IF;

  INSERT INTO bread_shares (
    name,
    description,
    image_url,
    total_quantity,
    remaining_quantity,
    limit_per_person,
    pickup_time,
    pickup_address,
    booking_deadline,
    notice,
    status
  )
  VALUES (
    BTRIM(p_name),
    NULLIF(BTRIM(COALESCE(p_description, '')), ''),
    NULLIF(BTRIM(COALESCE(p_image_url, '')), ''),
    p_total_quantity,
    p_remaining_quantity,
    p_limit_per_person,
    p_pickup_time,
    BTRIM(p_pickup_address),
    p_booking_deadline,
    NULLIF(BTRIM(COALESCE(p_notice, '')), ''),
    'draft'
  )
  RETURNING id INTO v_share_id;

  RETURN QUERY
  SELECT *
  FROM bread_shares
  WHERE id = v_share_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
