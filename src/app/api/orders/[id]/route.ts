import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<"/api/orders/[id]">
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const { status } = await req.json();

  // Customers may only cancel their own pending_payment orders
  if (status !== "cancelled") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("customer_id, status")
    .eq("id", id)
    .single();

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const phone = "+" + user.email!.replace("@oshxona.internal", "");
  const { data: caller } = await admin.from("users").select("id").eq("phone", phone).single();

  if (order.customer_id !== caller?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (order.status !== "pending_payment") {
    return NextResponse.json(
      { error: "Can only cancel orders awaiting payment" },
      { status: 400 }
    );
  }

  await admin.from("orders").update({ status: "cancelled" }).eq("id", id);
  return NextResponse.json({ success: true });
}
