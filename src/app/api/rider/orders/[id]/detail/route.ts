import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/rider/orders/[id]/detail">
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

  const { data: order } = await adminAny.from("orders").select(`
    id, total_krw, rider_fee_krw, delivery_address, delivery_lat, delivery_lng,
    customer_note, customer_id, created_at, status, rider_status, rider_id,
    restaurants(id, name_uz, address, phone, bank_name, bank_account_number),
    order_items(id, quantity, price_at_order, menu_items(name_uz))
  `).eq("id", id).single();

  if (!order) return NextResponse.json({ error: "Buyurtma topilmadi" }, { status: 404 });

  // Fetch customer phone via admin client (bypasses RLS)
  let customer_phone: string | null = null;
  if (order.customer_id) {
    const { data: cu } = await admin.from("users").select("phone").eq("id", order.customer_id).single();
    customer_phone = cu?.phone ?? null;
  }

  return NextResponse.json({ ...order, customer_phone });
}
