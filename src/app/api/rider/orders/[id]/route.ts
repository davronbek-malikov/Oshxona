import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  action: z.enum(["accept", "pickup", "deliver"]),
});

export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<"/api/rider/orders/[id]">
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email?.endsWith("@oshxona.internal")) {
    return NextResponse.json({ error: "Avtorizatsiya kerak" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Noto'g'ri harakat" }, { status: 400 });

  const { id } = await ctx.params;
  const phone = "+" + user.email.replace("@oshxona.internal", "");
  const admin = createAdminClient();
  const { data: dbUser } = await admin.from("users").select("id").eq("phone", phone).single();
  if (!dbUser) return NextResponse.json({ error: "Foydalanuvchi topilmadi" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;

  const { data: rider } = await adminAny.from("delivery_riders")
    .select("id, status, is_blocked, total_earnings_krw, orders_completed").eq("user_id", dbUser.id).single();
  if (!rider) return NextResponse.json({ error: "Rider topilmadi" }, { status: 404 });
  if (rider.is_blocked) return NextResponse.json({ error: "Hisobingiz bloklangan" }, { status: 403 });

  const { data: order } = await adminAny.from("orders")
    .select("id, status, rider_id, rider_status, delivery_type, rider_fee_krw")
    .eq("id", id).single();
  if (!order) return NextResponse.json({ error: "Buyurtma topilmadi" }, { status: 404 });

  const { action } = parsed.data;

  if (action === "accept") {
    // Only accept available orders
    if (order.rider_id) return NextResponse.json({ error: "Bu buyurtma band" }, { status: 409 });
    if (order.status !== "ready") return NextResponse.json({ error: "Buyurtma hali tayyor emas" }, { status: 400 });

    const { error } = await adminAny.from("orders").update({
      rider_id: rider.id,
      rider_status: "accepted",
    }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Mark rider as busy
    await adminAny.from("delivery_riders").update({ status: "busy" }).eq("id", rider.id);
  }

  else if (action === "pickup") {
    if (order.rider_id !== rider.id) return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
    const { error } = await adminAny.from("orders").update({ rider_status: "picked_up" }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  else if (action === "deliver") {
    if (order.rider_id !== rider.id) return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });

    const { error } = await adminAny.from("orders").update({
      rider_status: "delivered",
      status: "delivered",
    }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Increment earnings + order count
    const fee = order.rider_fee_krw ?? 3000;
    await Promise.all([
      adminAny.from("delivery_riders").update({
        total_earnings_krw: (rider.total_earnings_krw ?? 0) + fee,
        orders_completed: (rider.orders_completed ?? 0) + 1,
        status: "online",
      }).eq("id", rider.id),
      // Record earnings breakdown entry
      adminAny.from("rider_deliveries").insert({
        rider_id: rider.id,
        order_id: id,
        fee_krw: fee,
      }),
    ]);
  }

  return NextResponse.json({ success: true });
}
