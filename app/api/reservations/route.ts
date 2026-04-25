import { NextRequest, NextResponse } from "next/server";
import { supabase, Reservation } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    // 从请求头获取 Authorization token
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "请先登录" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];

    // 使用 token 创建认证客户端
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // 获取当前用户
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "请先登录" },
        { status: 401 }
      );
    }

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

    // 2. 预约份数不正确
    if (quantity <= 0) {
      return NextResponse.json(
        { error: "预约份数不正确" },
        { status: 400 }
      );
    }

    // 3. 在数据库事务内创建预约并扣减库存，避免创建失败但库存已扣
    const { data: reservation, error: reservationError } = await supabase
      .rpc("create_reservation_with_inventory", {
        p_share_id: share_id,
        p_user_id: user.id,
        p_quantity: quantity,
        p_customer_name: customer_name.trim(),
        p_contact: contact.trim(),
        p_remark: remark?.trim() || null,
      })
      .single();

    if (reservationError) {
      console.error("Create reservation error:", reservationError);
      const message = reservationError.message || "";
      const errorMap: Array<[string, string, number]> = [
        ["bread not found", "面包不存在", 404],
        ["bread not bookable", "该面包暂不可预约", 400],
        ["booking closed", "该面包已截止预约", 400],
        ["invalid quantity", "预约份数不正确", 400],
        ["over limit per person", "超过每人最多可预约份数", 400],
        ["insufficient quantity", "剩余名额不足", 400],
        ["reservation exists", "你已预约过该面包", 400],
        ["duplicate key", "你已预约过该面包", 400],
      ];
      const mapped = errorMap.find(([key]) => message.includes(key));
      if (mapped) {
        return NextResponse.json({ error: mapped[1] }, { status: mapped[2] });
      }
      return NextResponse.json(
        { error: "预约失败，请稍后重试" },
        { status: 500 }
      );
    }

    // 4. 返回预约成功信息
    return NextResponse.json({
      success: true,
      message: "预约成功",
      data: {
        id: (reservation as Reservation).id,
        bread_name: (reservation as Reservation).bread_name,
        quantity: (reservation as Reservation).quantity,
        customer_name: (reservation as Reservation).customer_name,
        status: (reservation as Reservation).status,
        created_at: (reservation as Reservation).created_at,
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
