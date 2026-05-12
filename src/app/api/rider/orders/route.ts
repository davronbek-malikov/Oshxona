import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email?.endsWith("@oshxona.internal")) {
    return NextResponse.json({ error: "Avtorizatsiya kerak" }, { status: 401 });
  }

  const phone = "+" + user.email.replace("@oshxona.internal", "");
  const admin = createAdminClient();
  const { data: dbUser } = await admin.from("users").select("id").eq("phone", phone).single();
  if (!dbUser) return NextResponse.json({ error: "Foydalanuvchi topilmadi" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;

  const { data: rider } = await adminAny.from("delivery_riders")
    .select("id, status, is_approved, is_blocked, block_reason, name, phone, vehicle, payment_method, bank_name, bank_account_number, total_earnings_krw, orders_completed, penalty_krw")
    .eq("user_id", dbUser.id).single();

  if (!rider) return NextResponse.json({ error: "Rider topilmadi" }, { status: 404 });

  if (!rider.is_approved) {
    return NextResponse.json({ error: "Pending approval", pending: true }, { status: 403 });
  }

  if (rider.is_blocked) {
    return NextResponse.json({ error: "Bloklangan", blocked: true, reason: rider.block_reason }, { status: 403 });
  }

  const type = req.nextUrl.searchParams.get("type") ?? "available";

  if (type === "available") {
    // Available delivery orders: ready, delivery type, no rider assigned
    const { data: orders } = await adminAny
      .from("orders")
      .select(`
        id, total_krw, rider_fee_krw, delivery_address, delivery_lat, delivery_lng,
        customer_note, created_at, status, rider_status,
        restaurants(id, name_uz, address, phone, bank_name, bank_account_number, bank_account_holder),
        order_items(id, quantity, price_at_order, menu_items(name_uz))
      `)
      .eq("status", "ready")
      .eq("delivery_type", "delivery")
      .is("rider_id", null)
      .order("created_at", { ascending: true })
      .limit(20);
    return NextResponse.json({ orders: orders ?? [], rider });
  }

  if (type === "mine") {
    const { data: orders } = await adminAny
      .from("orders")
      .select(`
        id, total_krw, rider_fee_krw, delivery_address, created_at, status, rider_status,
        restaurants(id, name_uz, address, phone),
        order_items(id, quantity, price_at_order, menu_items(name_uz))
      `)
      .eq("rider_id", rider.id)
      .in("rider_status", ["accepted", "picked_up"])
      .order("created_at", { ascending: false });
    return NextResponse.json({ orders: orders ?? [], rider });
  }

  if (type === "done") {
    const { data: orders } = await adminAny
      .from("orders")
      .select(`id, total_krw, rider_fee_krw, delivery_address, created_at, status, rider_status, restaurants(name_uz)`)
      .eq("rider_id", rider.id)
      .eq("rider_status", "delivered")
      .order("created_at", { ascending: false })
      .limit(30);
    return NextResponse.json({ orders: orders ?? [], rider });
  }

  return NextResponse.json({ orders: [], rider });
}
