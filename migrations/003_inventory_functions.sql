-- 迁移：创建库存操作的原子函数
-- 注意：函数需要 SECURITY DEFINER 来绕过 RLS 策略

-- 1. 扣减库存函数
CREATE OR REPLACE FUNCTION decrement_remaining_quantity(
  p_share_id UUID,
  p_quantity INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  v_new_quantity INTEGER;
BEGIN
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

-- 2. 返还库存函数
CREATE OR REPLACE FUNCTION increment_remaining_quantity(
  p_share_id UUID,
  p_quantity INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  v_new_quantity INTEGER;
BEGIN
  UPDATE bread_shares
  SET remaining_quantity = remaining_quantity + p_quantity
  WHERE id = p_share_id
  RETURNING remaining_quantity INTO v_new_quantity;

  RETURN v_new_quantity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 根据预约记录重新计算库存（修复数据用）
-- 使用方法: SELECT recalculate_remaining_quantity('share_id_here');
CREATE OR REPLACE FUNCTION recalculate_remaining_quantity(p_share_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_total INTEGER;
  v_reserved INTEGER;
  v_new_remaining INTEGER;
BEGIN
  -- 获取总量
  SELECT total_quantity INTO v_total
  FROM bread_shares
  WHERE id = p_share_id;

  -- 计算已预约数量（排除已取消的）
  SELECT COALESCE(SUM(quantity), 0) INTO v_reserved
  FROM reservations
  WHERE share_id = p_share_id
    AND status NOT IN ('cancelled');

  -- 更新剩余数量
  v_new_remaining := v_total - v_reserved;

  UPDATE bread_shares
  SET remaining_quantity = v_new_remaining
  WHERE id = p_share_id;

  RETURN v_new_remaining;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
