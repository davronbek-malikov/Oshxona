import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  order_id:      z.string().uuid(),
  restaurant_id: z.string().uuid(),
  stars:         z.number().int().min(1).max(5),
  comment:       z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const phone = "+" + user.email!.replace("@oshxona.internal", "");
  const admin = createAdminClient();

  const { data: caller } = await admin
    .from("users").select("id").eq("phone", phone).single();
  if (!caller) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { order_id, restaurant_id, stars, comment } = parsed.data;

  // Verify the order belongs to this customer and is delivered
  const { data: order } = await admin
    .from("orders")
    .select("customer_id, status")
    .eq("id", order_id)
    .single();

  if (!order || order.customer_id !== caller.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (order.status !== "delivered") {
    return NextResponse.json({ error: "Can only rate delivered orders" }, { status: 400 });
  }

  const { error } = await admin.from("ratings").upsert(
    { order_id, customer_id: caller.id, restaurant_id, stars, comment: comment ?? null },
    { onConflict: "order_id" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
