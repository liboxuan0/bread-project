import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    "缺少环境变量 NEXT_PUBLIC_SUPABASE_URL，请在 .env.local 中配置"
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    "缺少环境变量 NEXT_PUBLIC_SUPABASE_ANON_KEY，请在 .env.local 中配置"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type BreadShare = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  total_quantity: number;
  remaining_quantity: number;
  limit_per_person: number;
  pickup_time: string;
  pickup_address: string;
  booking_deadline: string;
  notice: string | null;
  status: "draft" | "published" | "closed";
  created_at: string;
  updated_at: string;
};

export type Reservation = {
  id: string;
  share_id: string;
  bread_name: string;
  quantity: number;
  customer_name: string;
  contact: string;
  remark: string | null;
  status: "pending" | "confirmed" | "picked_up" | "cancelled" | "no_show";
  picked_up_at: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * 获取已发布且有剩余的面包分享列表
 * - status = 'published'
 * - remaining_quantity > 0
 * - 按 pickup_time 正序排列
 */
export async function getAvailableBreadShares() {
  const { data, error } = await supabase
    .from("bread_shares")
    .select("*")
    .eq("status", "published")
    .gt("remaining_quantity", 0)
    .order("pickup_time", { ascending: true });

  return { data: data as BreadShare[] | null, error };
}

/**
 * 根据 ID 获取面包分享详情
 */
export async function getBreadShareById(id: string) {
  const { data, error } = await supabase
    .from("bread_shares")
    .select("*")
    .eq("id", id)
    .single();

  return { data: data as BreadShare | null, error };
}

/**
 * 提交预约
 */
export async function createReservation(reservation: {
  share_id: string;
  bread_name: string;
  quantity: number;
  customer_name: string;
  contact: string;
  remark?: string | null;
}) {
  const { data, error } = await supabase
    .from("reservations")
    .insert({
      ...reservation,
      status: "pending",
    })
    .select()
    .single();

  return { data: data as Reservation | null, error };
}

/**
 * 测试 Supabase 连接
 */
export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from("bread_shares")
      .select("count")
      .limit(1);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, message: "Supabase 连接成功" };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "未知错误",
    };
  }
}
