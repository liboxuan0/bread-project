-- 管理员上下架专用 RPC：只改 status，不影响编辑字段和库存

CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM admin_users
    WHERE email = auth.jwt() ->> 'email'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
    IF NULLIF(BTRIM(v_bread.pickup_address), '') IS NULL THEN
      RAISE EXCEPTION 'pickup address required';
    END IF;
    IF v_bread.booking_deadline <= NOW() THEN
      RAISE EXCEPTION 'booking deadline expired';
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

CREATE OR REPLACE FUNCTION update_bread_share_with_inventory(
  p_share_id UUID,
  p_name TEXT,
  p_description TEXT,
  p_image_url TEXT,
  p_total_quantity INTEGER,
  p_limit_per_person INTEGER,
  p_pickup_time TIMESTAMPTZ,
  p_pickup_address TEXT,
  p_booking_deadline TIMESTAMPTZ,
  p_notice TEXT,
  p_status bread_share_status DEFAULT NULL
)
RETURNS SETOF bread_shares AS $$
DECLARE
  v_reserved INTEGER;
BEGIN
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'admin required';
  END IF;

  IF p_share_id IS NULL THEN
    RAISE EXCEPTION 'share_id required';
  END IF;

  IF NULLIF(BTRIM(p_name), '') IS NULL THEN
    RAISE EXCEPTION 'name required';
  END IF;

  IF p_total_quantity IS NULL OR p_total_quantity <= 0 THEN
    RAISE EXCEPTION 'invalid total quantity';
  END IF;

  IF p_limit_per_person IS NULL OR p_limit_per_person <= 0 THEN
    RAISE EXCEPTION 'invalid limit per person';
  END IF;

  IF NULLIF(BTRIM(p_pickup_address), '') IS NULL THEN
    RAISE EXCEPTION 'pickup address required';
  END IF;

  SELECT COALESCE(SUM(quantity), 0) INTO v_reserved
  FROM reservations
  WHERE share_id = p_share_id
    AND status <> 'cancelled';

  UPDATE bread_shares
  SET
    name = BTRIM(p_name),
    description = NULLIF(BTRIM(COALESCE(p_description, '')), ''),
    image_url = NULLIF(BTRIM(COALESCE(p_image_url, '')), ''),
    total_quantity = p_total_quantity,
    remaining_quantity = GREATEST(0, LEAST(p_total_quantity, p_total_quantity - v_reserved)),
    limit_per_person = p_limit_per_person,
    pickup_time = p_pickup_time,
    pickup_address = BTRIM(p_pickup_address),
    booking_deadline = p_booking_deadline,
    notice = NULLIF(BTRIM(COALESCE(p_notice, '')), ''),
    status = COALESCE(p_status, status)
  WHERE id = p_share_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'bread not found';
  END IF;

  RETURN QUERY
  SELECT *
  FROM bread_shares
  WHERE id = p_share_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
