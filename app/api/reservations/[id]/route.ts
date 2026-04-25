import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 验证登录
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    // 查询预约（关联 bread_shares 获取 booking_deadline）
    const { data: reservation, error: fetchError } = await supabase
      .from("reservations")
      .select(`
        id,
        user_id,
        share_id,
        quantity,
        status,
        bread_shares:share_id (
          booking_deadline
        )
      `)
      .eq("id", id)
      .single();

    if (fetchError || !reservation) {
      return NextResponse.json({ error: "预约不存在" }, { status: 404 });
    }

    // 只能撤销自己的预约
    if (reservation.user_id !== user.id) {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    // 只有 pending 和 confirmed 可以撤销
    if (!["pending", "confirmed"].includes(reservation.status)) {
      return NextResponse.json({ error: "当前状态不可撤销" }, { status: 400 });
    }

    // 超过 booking_deadline 不可撤销
    const breadShare = reservation.bread_shares as unknown as { booking_deadline: string } | null;
    if (breadShare && new Date() > new Date(breadShare.booking_deadline)) {
      return NextResponse.json({ error: "已超过预约截止时间，无法撤销" }, { status: 400 });
    }

    // 数据库事务内取消预约并默认返还库存
    const { error: cancelError } = await supabase
      .rpc("cancel_reservation_with_inventory", {
        p_reservation_id: id,
        p_return_quota: true,
      })
      .single();

    if (cancelError) {
      console.error("Cancel reservation error:", cancelError);
      if ((cancelError.message || "").includes("reservation not cancellable")) {
        return NextResponse.json({ error: "当前状态不可撤销" }, { status: 400 });
      }
      return NextResponse.json({ error: "撤销失败" }, { status: 500 });
    }

    revalidatePath("/", "layout");

    return NextResponse.json({ success: true, message: "撤销成功" });
  } catch (error) {
    console.error("Cancel reservation error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
