import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";

function createAuthSupabase(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (!auth.success) return auth.response;
  const supabase = createAuthSupabase(auth.token);

  try {
    const { id } = await params;
    const body = await request.json();

    // 状态变更（上架/下架开关）
    if (body.status && !body.name) {
      const allowed = ["published", "closed"];
      if (!allowed.includes(body.status)) {
        return NextResponse.json({ error: "无效状态" }, { status: 400 });
      }

      const { error: rpcError } = await supabase
        .rpc("admin_set_bread_share_status", {
          p_share_id: id,
          p_status: body.status,
        })
        .single();

      if (rpcError) {
        console.error("Toggle status RPC error:", rpcError);
        const message = rpcError.message || "";
        const errorMap: Array<[string, string, number]> = [
          ["bread not found", "面包不存在", 404],
          ["name required", "请填写面包名称", 400],
          ["invalid total quantity", "请设置总个数", 400],
          ["no remaining quantity", "剩余可预约个数必须大于 0", 400],
          ["invalid limit per person", "请设置每人最多预约个数", 400],
          ["pickup address required", "请设置领取地点", 400],
        ];
        const mapped = errorMap.find(([key]) => message.includes(key));
        if (mapped) {
          return NextResponse.json({ error: mapped[1] }, { status: mapped[2] });
        }
        return NextResponse.json({ error: "更新失败" }, { status: 500 });
      }
      revalidatePath("/", "layout");
      return NextResponse.json({ success: true });
    }

    // 完整编辑（不含 status）
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

    const { data, error: updateError } = await supabase
      .rpc("update_bread_share_with_inventory", {
        p_share_id: id,
        p_name: name.trim(),
        p_description: description?.trim() || null,
        p_image_url: image_url?.trim() || null,
        p_total_quantity: total_quantity,
        p_limit_per_person: limit_per_person,
        p_pickup_time: pickup_time,
        p_pickup_address: pickup_address.trim(),
        p_booking_deadline: booking_deadline,
        p_notice: notice?.trim() || null,
        p_status: null,
      })
      .single();

    if (updateError) {
      console.error("Update bread share error:", updateError);
      return NextResponse.json({ error: "更新失败" }, { status: 500 });
    }

    revalidatePath("/", "layout");
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (!auth.success) return auth.response;
  const supabase = createAuthSupabase(auth.token);

  try {
    const { id } = await params;

    // 检查是否有关联预约记录
    const { count, error: countError } = await supabase
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("share_id", id);

    if (countError) {
      return NextResponse.json({ error: "查询失败" }, { status: 500 });
    }

    if (count && count > 0) {
      return NextResponse.json(
        { error: "该面包已有预约记录，无法删除。你可以选择下架，避免用户继续预约。" },
        { status: 400 }
      );
    }

    // 走 SECURITY DEFINER 函数删除（绕过 RLS）
    const { error } = await supabase.rpc("admin_delete_bread_share", { p_share_id: id });
    if (error) {
      return NextResponse.json({ error: "删除失败" }, { status: 500 });
    }

    revalidatePath("/", "layout");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
