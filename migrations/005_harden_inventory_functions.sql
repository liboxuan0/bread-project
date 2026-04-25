-- 加固库存函数：防止库存返还超过总份数，并让重算结果始终可展示

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
  SET remaining_quantity = remaining_quantity - p_quantity
  WHERE id = p_share_id
    AND remaining_quantity >= p_quantity
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

  v_new_remaining := GREATEST(0, v_total - v_reserved);

  UPDATE bread_shares
  SET remaining_quantity = v_new_remaining
  WHERE id = p_share_id;

  RETURN v_new_remaining;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
