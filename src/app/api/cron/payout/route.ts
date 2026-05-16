import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// Vercel cron calls this at 08:00 KST daily (23:00 UTC prev day)
// Marks all unpaid delivered orders as platform_paid_at = now
// In production: trigger actual bank transfer API here (Toss Payments etc.)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  // Mark all delivered, unpaid orders as paid
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from("orders")
    .update({ platform_paid_at: now })
    .eq("status", "delivered")
    .is("platform_paid_at", null)
    .select("id, restaurant_id, total_krw, rider_fee_krw, delivery_type");

  if (error) {
    console.error("[cron/payout] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const orders = data ?? [];
  const COMMISSION = parseFloat(process.env.PLATFORM_COMMISSION_RATE ?? "0.05");

  // Aggregate by restaurant
  const byRestaurant: Record<string, number> = {};
  const byRider: Record<string, number> = {};

  for (const o of orders) {
    const commission = Math.round(o.total_krw * COMMISSION);
    const riderFee   = o.delivery_type === "delivery" ? (o.rider_fee_krw ?? 3000) : 0;
    const restaurantShare = o.total_krw - commission - riderFee;
    byRestaurant[o.restaurant_id] = (byRestaurant[o.restaurant_id] ?? 0) + restaurantShare;
    if (riderFee > 0) {
      // rider_id lookup would be needed for real payouts
      byRider[o.id] = riderFee;
    }
  }

  console.log(`[cron/payout] Processed ${orders.length} orders.`);
  console.log("[cron/payout] Restaurant payouts:", byRestaurant);
  console.log("[cron/payout] Rider fees:", byRider);

  // TODO: Call Toss Payments or KakaoPay API here to initiate real transfers
  // For now, marking orders as paid in DB is sufficient for earnings display

  return NextResponse.json({
    processed: orders.length,
    restaurantCount: Object.keys(byRestaurant).length,
    paidAt: now,
  });
}
