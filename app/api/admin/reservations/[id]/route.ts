import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";

const allowedStatuses = ["confirmed", "picked_up", "no_show", "cancelled"] as const;
type TargetStatus = (typeof allowedStatuses)[number];

function isTargetStatus(status: unknown): status is TargetStatus {
  return typeof status === "string" && allowedStatuses.includes(status as TargetStatus);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (!auth.success) return auth.response;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${auth.token}` } } }
  );

  try {
    const { id } = await params;
    const body = await request.json();
    const { status, returnQuota } = body;

    if (!isTargetStatus(status)) {
      return NextResponse.json({ error: "不支持的预约状态" }, { status: 400 });
    }

    if (status === "cancelled") {
      const { data, error } = await supabase
        .rpc("cancel_reservation_with_inventory", {
          p_reservation_id: id,
          p_return_quota: returnQuota !== false,
        })
        .single();

      if (error) {
        console.error("Admin cancel reservation error:", error);
        if ((error.message || "").includes("reservation not cancellable")) {
          return NextResponse.json({ error: "当前状态不可取消" }, { status: 400 });
        }
        return NextResponse.json({ error: "取消失败" }, { status: 500 });
      }

      return NextResponse.json({ success: true, data });
    }

    const { data, error } = await supabase
      .rpc("admin_update_reservation_status", {
        p_reservation_id: id,
        p_status: status,
      })
      .single();

    if (error) {
      console.error("Admin update reservation error:", error);
      if ((error.message || "").includes("transition not allowed")) {
        return NextResponse.json({ error: "当前状态不允许该操作" }, { status: 400 });
      }
      return NextResponse.json({ error: "修改失败" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Admin reservation API error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
