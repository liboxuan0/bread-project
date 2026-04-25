-- 预约和库存事务函数：把业务库存变更收敛到数据库原子操作

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bread_shares_remaining_quantity_lte_total'
  ) THEN
    ALTER TABLE bread_shares
    ADD CONSTRAINT bread_shares_remaining_quantity_lte_total
    CHECK (remaining_quantity <= total_quantity) NOT VALID;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_remaining_quantity(
  p_share_id UUID,
  p_quantity INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  v_new_quantity INTEGER;
BEGIN
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be positive';
  END IF;

  UPDATE bread_shares
  SET remaining_quantity = LEAST(total_quantity, remaining_quantity) - p_quantity
  WHERE id = p_share_id
    AND LEAST(total_quantity, remaining_quantity) >= p_quantity
  RETURNING remaining_quantity INTO v_new_quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient quantity';
  END IF;

  RETURN v_new_quantity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_remaining_quantity(
  p_share_id UUID,
  p_quantity INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  v_new_quantity INTEGER;
BEGIN
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be positive';
  END IF;

  UPDATE bread_shares
  SET remaining_quantity = LEAST(total_quantity, remaining_quantity + p_quantity)
  WHERE id = p_share_id
  RETURNING remaining_quantity INTO v_new_quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bread share not found';
  END IF;

  RETURN v_new_quantity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION recalculate_remaining_quantity(p_share_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_total INTEGER;
  v_reserved INTEGER;
  v_new_remaining INTEGER;
BEGIN
  SELECT total_quantity INTO v_total
  FROM bread_shares
  WHERE id = p_share_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bread share not found';
  END IF;

  SELECT COALESCE(SUM(quantity), 0) INTO v_reserved
  FROM reservations
  WHERE share_id = p_share_id
    AND status <> 'cancelled';

  v_new_remaining := GREATEST(0, LEAST(v_total, v_total - v_reserved));

  UPDATE bread_shares
  SET remaining_quantity = v_new_remaining
  WHERE id = p_share_id;

  RETURN v_new_remaining;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_reservation_with_inventory(
  p_share_id UUID,
  p_user_id UUID,
  p_quantity INTEGER,
  p_customer_name TEXT,
  p_contact TEXT,
  p_remark TEXT DEFAULT NULL
)
RETURNS SETOF reservations AS $$
DECLARE
  v_bread bread_shares%ROWTYPE;
  v_reservation_id UUID;
BEGIN
  IF p_share_id IS NULL THEN
    RAISE EXCEPTION 'share_id required';
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id required';
  END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'invalid quantity';
  END IF;

  IF NULLIF(BTRIM(p_customer_name), '') IS NULL THEN
    RAISE EXCEPTION 'customer_name required';
  END IF;

  IF NULLIF(BTRIM(p_contact), '') IS NULL THEN
    RAISE EXCEPTION 'contact required';
  END IF;

  SELECT *
  INTO v_bread
  FROM bread_shares
  WHERE id = p_share_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'bread not found';
  END IF;

  IF v_bread.status <> 'published' THEN
    RAISE EXCEPTION 'bread not bookable';
  END IF;

  IF NOW() > v_bread.booking_deadline THEN
    RAISE EXCEPTION 'booking closed';
  END IF;

  IF p_quantity > v_bread.limit_per_person THEN
    RAISE EXCEPTION 'over limit per person';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM reservations
    WHERE share_id = p_share_id
      AND user_id = p_user_id
      AND status <> 'cancelled'
  ) THEN
    RAISE EXCEPTION 'reservation exists';
  END IF;

  INSERT INTO reservations (
    share_id,
    user_id,
    bread_name,
    quantity,
    customer_name,
    contact,
    remark,
    status
  )
  VALUES (
    p_share_id,
    p_user_id,
    v_bread.name,
    p_quantity,
    BTRIM(p_customer_name),
    BTRIM(p_contact),
    NULLIF(BTRIM(COALESCE(p_remark, '')), ''),
    'pending'
  )
  RETURNING id INTO v_reservation_id;

  UPDATE bread_shares
  SET remaining_quantity = LEAST(total_quantity, remaining_quantity) - p_quantity
  WHERE id = p_share_id
    AND LEAST(total_quantity, remaining_quantity) >= p_quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'insufficient quantity';
  END IF;

  RETURN QUERY
  SELECT *
  FROM reservations
  WHERE id = v_reservation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cancel_reservation_with_inventory(
  p_reservation_id UUID,
  p_return_quota BOOLEAN DEFAULT TRUE
)
RETURNS SETOF reservations AS $$
DECLARE
  v_reservation reservations%ROWTYPE;
BEGIN
  IF p_reservation_id IS NULL THEN
    RAISE EXCEPTION 'reservation_id required';
  END IF;

  UPDATE reservations
  SET
    status = 'cancelled',
    cancelled_at = NOW()
  WHERE id = p_reservation_id
    AND status IN ('pending', 'confirmed')
  RETURNING * INTO v_reservation;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'reservation not cancellable';
  END IF;

  IF COALESCE(p_return_quota, TRUE) THEN
    UPDATE bread_shares
    SET remaining_quantity = LEAST(total_quantity, remaining_quantity + v_reservation.quantity)
    WHERE id = v_reservation.share_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'bread not found';
    END IF;
  END IF;

  RETURN QUERY
  SELECT *
  FROM reservations
  WHERE id = p_reservation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
