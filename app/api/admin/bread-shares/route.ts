import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";

function createRequestSupabase(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

/**
 * 创建面包分享（管理员接口）
 */
export async function POST(request: NextRequest) {
  // 权限校验
  const auth = await requireAdmin(request);
  if (!auth.success) return auth.response;
  const supabase = createRequestSupabase(auth.token);

  try {
    const body = await request.json();
    const {
      name,
      description,
      image_url,
      total_quantity,
      limit_per_person,
      pickup_time,
      pickup_address,
      booking_deadline,
      notice,
    } = body;

    // 基本校验
    if (!name?.trim()) {
      return NextResponse.json({ error: "名称必填" }, { status: 400 });
    }
    if (!total_quantity || total_quantity <= 0) {
      return NextResponse.json({ error: "总数量必须大于0" }, { status: 400 });
    }
    if (!limit_per_person || limit_per_person <= 0) {
      return NextResponse.json({ error: "每人限约必须大于0" }, { status: 400 });
    }
    if (!pickup_time || !pickup_address?.trim() || !booking_deadline) {
      return NextResponse.json({ error: "领取信息不完整" }, { status: 400 });
    }

    // 创建面包分享
    const { data, error } = await supabase.rpc("admin_create_bread_share", {
      p_name: name.trim(),
      p_description: description?.trim() || null,
      p_image_url: image_url?.trim() || null,
      p_total_quantity: total_quantity,
      p_remaining_quantity: total_quantity,
      p_limit_per_person: limit_per_person || 1,
      p_pickup_time: pickup_time,
      p_pickup_address: pickup_address?.trim() || "",
      p_booking_deadline: booking_deadline,
      p_notice: notice?.trim() || null,
    });

    if (error) {
      console.error("Create bread share error:", error);
      const message = error.message || "";
      const errorMap: Array<[string, string, number]> = [
        ["admin required", "无后台访问权限", 403],
        ["name required", "名称必填", 400],
        ["invalid total quantity", "总个数必须大于0", 400],
        ["invalid remaining quantity", "剩余个数必须在 0 到总个数之间", 400],
        ["invalid limit per person", "每人限约必须大于0", 400],
        ["pickup time required", "请选择领取时间", 400],
        ["pickup address required", "请输入领取地点", 400],
        ["booking deadline required", "请选择预约截止时间", 400],
        ["function public.admin_create_bread_share", "数据库缺少创建面包的 RPC，请先执行最新 migration", 500],
      ];
      const mapped = errorMap.find(([key]) => message.includes(key));
      if (mapped) {
        return NextResponse.json({ error: mapped[1] }, { status: mapped[2] });
      }
      return NextResponse.json({ error: "创建失败" }, { status: 500 });
    }

    revalidatePath("/", "layout");

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

/**
 * 获取面包分享列表（管理员接口）
 */
export async function GET(request: NextRequest) {
  // 权限校验
  const auth = await requireAdmin(request);
  if (!auth.success) return auth.response;
  const supabase = createRequestSupabase(auth.token);

  try {
    const { data, error } = await supabase
      .rpc("admin_list_bread_shares");

    if (error) {
      return NextResponse.json({ error: "查询失败" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
