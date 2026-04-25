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

    // 创建面包分享
    const { data, error } = await supabase
      .from("bread_shares")
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        image_url: image_url?.trim() || null,
        total_quantity,
        remaining_quantity: total_quantity,
        limit_per_person: limit_per_person || 1,
        pickup_time,
        pickup_address: pickup_address?.trim() || "",
        booking_deadline,
        notice: notice?.trim() || null,
        status: "draft",
      })
      .select()
      .single();

    if (error) {
      console.error("Create bread share error:", error);
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
