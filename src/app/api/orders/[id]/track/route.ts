import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/orders/[id]/track">
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email?.endsWith("@oshxona.internal")) {
    return NextResponse.json({ error: "Avtorizatsiya kerak" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;

  const { data: order } = await adminAny.from("orders")
    .select("id, status, rider_status, rider_id, delivery_lat, delivery_lng, delivery_address, restaurant_id")
    .eq("id", id).single();

  if (!order) return NextResponse.json({ error: "Buyurtma topilmadi" }, { status: 404 });

  let rider = null;
  if (order.rider_id) {
    const { data: riderData } = await adminAny.from("delivery_riders")
      .select("id, name, phone, vehicle, current_lat, current_lng, status")
      .eq("id", order.rider_id).single();
    rider = riderData;
  }

  const { data: restaurant } = await admin.from("restaurants")
    .select("name_uz, address, location").eq("id", order.restaurant_id!).single();

  return NextResponse.json({ order, rider, restaurant });
}
