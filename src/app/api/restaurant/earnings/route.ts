import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const COMMISSION_RATE = parseFloat(process.env.PLATFORM_COMMISSION_RATE ?? "0.05"); // 5%

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email?.endsWith("@oshxona.internal")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const phone = "+" + user.email.replace("@oshxona.internal", "");
  const admin = createAdminClient();

  const { data: dbUser } = await admin.from("users").select("id, role").eq("phone", phone).single();
  if (!dbUser || dbUser.role !== "restaurant") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: restaurant } = await admin
    .from("restaurants")
    .select("id")
    .eq("owner_id", dbUser.id)
    .single();

  if (!restaurant) return NextResponse.json({ error: "No restaurant" }, { status: 404 });

  // All delivered orders
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: orders } = await (admin as any)
    .from("orders")
    .select("id, total_krw, rider_fee_krw, delivery_type, created_at, platform_paid_at")
    .eq("restaurant_id", restaurant.id)
    .eq("status", "delivered")
    .order("created_at", { ascending: false });

  const allOrders = orders ?? [];

  // Split into pending payout vs already paid
  const pending = allOrders.filter((o: { platform_paid_at: string | null }) => !o.platform_paid_at);
  const paid    = allOrders.filter((o: { platform_paid_at: string | null }) => !!o.platform_paid_at);

  const calcRestaurantShare = (o: { total_krw: number; rider_fee_krw?: number; delivery_type: string }) => {
    const commission = Math.round(o.total_krw * COMMISSION_RATE);
    const riderFee   = o.delivery_type === "delivery" ? (o.rider_fee_krw ?? 3000) : 0;
    return o.total_krw - commission - riderFee;
  };

  const pendingTotal = pending.reduce(
    (sum: number, o: { total_krw: number; rider_fee_krw?: number; delivery_type: string }) =>
      sum + calcRestaurantShare(o), 0
  );
  const paidTotal = paid.reduce(
    (sum: number, o: { total_krw: number; rider_fee_krw?: number; delivery_type: string }) =>
      sum + calcRestaurantShare(o), 0
  );

  // Today's sales
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todaySales = allOrders
    .filter((o: { created_at: string }) => new Date(o.created_at) >= todayStart)
    .reduce((sum: number, o: { total_krw: number }) => sum + o.total_krw, 0);

  return NextResponse.json({
    pendingPayoutKrw: pendingTotal,
    paidTotalKrw: paidTotal,
    todaySalesKrw: todaySales,
    totalOrdersDelivered: allOrders.length,
    commissionRate: COMMISSION_RATE,
    nextPayoutAt: "08:00 AM daily",
    recentOrders: allOrders.slice(0, 20).map((o: {
      id: string; total_krw: number; rider_fee_krw?: number;
      delivery_type: string; created_at: string; platform_paid_at: string | null;
    }) => ({
      id: o.id,
      total_krw: o.total_krw,
      restaurant_share: calcRestaurantShare(o),
      commission_krw: Math.round(o.total_krw * COMMISSION_RATE),
      created_at: o.created_at,
      paid: !!o.platform_paid_at,
    })),
  });
}
