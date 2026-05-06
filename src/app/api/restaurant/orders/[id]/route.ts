import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { Database } from "@/types/database";

type OrderStatus = Database["public"]["Tables"]["orders"]["Row"]["status"];

// Valid forward transitions for restaurant owner
const ALLOWED_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending_payment:   ["payment_confirmed", "cancelled"],
  payment_claimed:   ["payment_confirmed", "cancelled"],
  payment_confirmed: ["preparing", "cancelled"],
  preparing:         ["ready", "cancelled"],
  ready:             ["delivered"],
};

const schema = z.object({
  status: z.enum([
    "pending_payment",
    "payment_claimed",
    "payment_confirmed",
    "preparing",
    "ready",
    "delivered",
    "cancelled",
  ]),
});

export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<"/api/restaurant/orders/[id]">
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Avtorizatsiya kerak" }, { status: 401 });
  }

  if (!user.email?.endsWith("@oshxona.internal")) {
    return NextResponse.json({ error: "Noto'g'ri sessiya" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Noto'g'ri status" }, { status: 400 });
  }

  const { id } = await ctx.params;
  const newStatus = parsed.data.status;
  const admin = await createAdminClient();

  // Fetch the order and its restaurant
  const { data: order } = await admin
    .from("orders")
    .select("status, restaurant_id")
    .eq("id", id)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Buyurtma topilmadi" }, { status: 404 });
  }

  // Verify transition is allowed
  const allowed = ALLOWED_TRANSITIONS[order.status as OrderStatus] ?? [];
  if (!allowed.includes(newStatus)) {
    return NextResponse.json(
      { error: `${order.status} → ${newStatus} o'tish mumkin emas` },
      { status: 400 }
    );
  }

  // Verify the caller owns the restaurant
  const phone = "+" + user.email.replace("@oshxona.internal", "");
  const { data: dbUser } = await admin
    .from("users")
    .select("id")
    .eq("phone", phone)
    .single();

  if (!dbUser) {
    return NextResponse.json({ error: "Foydalanuvchi topilmadi" }, { status: 400 });
  }

  const { data: restaurant } = await admin
    .from("restaurants")
    .select("owner_id")
    .eq("id", order.restaurant_id!)
    .single();

  if (!restaurant || restaurant.owner_id !== dbUser.id) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }

  // Apply the update
  const { error } = await admin
    .from("orders")
    .update({ status: newStatus })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, status: newStatus });
}
