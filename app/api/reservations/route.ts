import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { share_id, quantity, customer_name, contact, remark } = body;

    // 1. 必填校验
    if (!share_id) {
      return NextResponse.json(
        { error: "share_id 必填" },
        { status: 400 }
      );
    }
    if (!customer_name?.trim()) {
      return NextResponse.json(
        { error: "customer_name 必填" },
        { status: 400 }
      );
    }
    if (!contact?.trim()) {
      return NextResponse.json(
        { error: "contact 必填" },
        { status: 400 }
      );
    }
    if (quantity === undefined || quantity === null) {
      return NextResponse.json(
        { error: "quantity 必填" },
        { status: 400 }
      );
    }

    // 2. 查询面包分享
    const { data: bread, error: breadError } = await supabase
      .from("bread_shares")
      .select("*")
      .eq("id", share_id)
      .single();

    // 3. 面包不存在
    if (breadError || !bread) {
      return NextResponse.json(
        { error: "面包不存在" },
        { status: 404 }
      );
    }

    // 4. 状态不是 published
    if (bread.status !== "published") {
      return NextResponse.json(
        { error: "该面包暂不可预约" },
        { status: 400 }
      );
    }

    // 5. 超过预约截止时间
    if (new Date() > new Date(bread.booking_deadline)) {
      return NextResponse.json(
        { error: "该面包已截止预约" },
        { status: 400 }
      );
    }

    // 6. 预约份数不正确
    if (quantity <= 0) {
      return NextResponse.json(
        { error: "预约份数不正确" },
        { status: 400 }
      );
    }

    // 7. 超过每人最多可预约份数
    if (quantity > bread.limit_per_person) {
      return NextResponse.json(
        { error: "超过每人最多可预约份数" },
        { status: 400 }
      );
    }

    // 8. 剩余名额不足
    if (bread.remaining_quantity < quantity) {
      return NextResponse.json(
        { error: "剩余名额不足" },
        { status: 400 }
      );
    }

    // 9. 检查是否已预约过（同一联系方式 + 同一分享，排除已取消的预约）
    const { data: existing } = await supabase
      .from("reservations")
      .select("id")
      .eq("share_id", share_id)
      .eq("contact", contact.trim())
      .neq("status", "cancelled")
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "你已预约过该面包" },
        { status: 400 }
      );
    }

    // 10. 创建预约记录
    const { data: reservation, error: insertError } = await supabase
      .from("reservations")
      .insert({
        share_id,
        bread_name: bread.name,
        quantity,
        customer_name: customer_name.trim(),
        contact: contact.trim(),
        remark: remark?.trim() || null,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "你已预约过该面包" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "预约失败，请稍后重试" },
        { status: 500 }
      );
    }

    // 11. 扣减剩余数量
    const { error: updateError } = await supabase
      .from("bread_shares")
      .update({ remaining_quantity: bread.remaining_quantity - quantity })
      .eq("id", share_id);

    if (updateError) {
      console.error("Update remaining_quantity error:", updateError);
    }

    // 12. 返回预约成功信息
    return NextResponse.json({
      success: true,
      message: "预约成功",
      data: {
        id: reservation.id,
        bread_name: reservation.bread_name,
        quantity: reservation.quantity,
        customer_name: reservation.customer_name,
        status: reservation.status,
        created_at: reservation.created_at,
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}
