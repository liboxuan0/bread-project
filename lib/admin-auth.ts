import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type AdminAuthResult =
  | { success: true; userId: string; email: string; token: string }
  | { success: false; response: NextResponse };

/**
 * 后台 API 通用管理员权限校验
 *
 * 用法：
 * ```
 * const auth = await requireAdmin(request);
 * if (!auth.success) return auth.response;
 * // auth.userId 和 auth.email 可用
 * ```
 */
export async function requireAdmin(request: NextRequest): Promise<AdminAuthResult> {
  // 1. 检查 Authorization header
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      success: false,
      response: NextResponse.json({ error: "未登录" }, { status: 401 }),
    };
  }

  const token = authHeader.split(" ")[1];

  // 2. 验证 token 获取用户
  const supabaseAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();

  if (userError || !user || !user.email) {
    return {
      success: false,
      response: NextResponse.json({ error: "未登录" }, { status: 401 }),
    };
  }

  // 3. 检查是否是管理员
  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("id")
    .eq("email", user.email)
    .maybeSingle();

  if (!adminUser) {
    return {
      success: false,
      response: NextResponse.json({ error: "无后台访问权限" }, { status: 403 }),
    };
  }

  return {
    success: true,
    userId: user.id,
    email: user.email,
    token,
  };
}
