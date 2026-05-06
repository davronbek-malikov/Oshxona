import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  action: z.enum(["approve", "reject"]),
});

export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<"/api/admin/restaurants/[id]">
) {
  // Verify caller is admin
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const phone = "+" + authUser.email.replace("@oshxona.internal", "");
  const admin = await createAdminClient();

  const { data: caller } = await admin
    .from("users")
    .select("role")
    .eq("phone", phone)
    .single();

  if (caller?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { action } = parsed.data;

  const { error } = await admin
    .from("restaurants")
    .update(
      action === "approve"
        ? { is_approved: true, is_active: true }
        : { is_approved: false, is_active: false }
    )
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
