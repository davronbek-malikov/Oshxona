import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve") }),
  z.object({ action: z.literal("reject") }),
  z.object({ action: z.literal("block"), reason: z.string().min(1) }),
  z.object({ action: z.literal("unblock") }),
  z.object({ action: z.literal("penalty"), amount: z.number().int().positive(), reason: z.string().optional() }),
]);

export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<"/api/admin/riders/[id]">
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email?.endsWith("@oshxona.internal")) {
    return NextResponse.json({ error: "Avtorizatsiya kerak" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Noto'g'ri so'rov" }, { status: 400 });
  }

  // Any authenticated internal user can manage riders
  const admin = createAdminClient();

  const { id } = await ctx.params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;

  let update: Record<string, unknown> = {};
  const p = parsed.data;

  if (p.action === "approve") {
    update = { is_approved: true, is_blocked: false };
  } else if (p.action === "reject") {
    update = { is_approved: false };
  } else if (p.action === "block") {
    update = { is_blocked: true, block_reason: p.reason, status: "offline" };
  } else if (p.action === "unblock") {
    update = { is_blocked: false, block_reason: null };
  } else if (p.action === "penalty") {
    // Fetch current penalty and add to it
    const { data: rider } = await adminAny.from("delivery_riders").select("penalty_krw").eq("id", id).single();
    const current = rider?.penalty_krw ?? 0;
    update = { penalty_krw: current + p.amount };
  }

  const { error } = await adminAny.from("delivery_riders").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, action: p.action });
}
