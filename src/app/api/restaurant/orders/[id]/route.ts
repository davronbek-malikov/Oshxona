import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { Database } from "@/types/database";
import { sendOrderStatusPush } from "@/lib/push";

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
  self_delivery: z.boolean().optional(),
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
  const selfDelivery = parsed.data.self_delivery;
  const admin = createAdminClient();

  // Fetch the order and its restaurant
  const { data: order } = await admin
    .from("orders")
    .select("status, restaurant_id, customer_id, delivery_type")
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

  // Build update payload
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatePayload: Record<string, any> = { status: newStatus };
  if (newStatus === "ready" && selfDelivery !== undefined) {
    updatePayload.self_delivery = selfDelivery;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any).from("orders").update(updatePayload).eq("id", id);

  // When delivery order becomes ready via platform rider → mark it available for riders
  if (!error && newStatus === "ready" && order.delivery_type === "delivery" && !selfDelivery) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from("orders").update({ rider_status: "waiting" }).eq("id", id);
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fire-and-forget: push to customer + notify riders if delivery order is ready
  Promise.resolve().then(async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const adminAny = admin as any;
      const { data: restaurantData } = await admin
        .from("restaurants").select("name_uz").eq("id", order.restaurant_id!).single();
      const restName = restaurantData?.name_uz ?? "Restoran";

      // Push to customer
      const { data: custSubs } = await adminAny
        .from("push_subscriptions").select("endpoint, p256dh, auth").eq("user_id", order.customer_id!);
      if (custSubs?.length) {
        await sendOrderStatusPush(custSubs, id, restName, newStatus);
      }

      // Push to all online riders when delivery order becomes available
      if (newStatus === "ready" && order.delivery_type === "delivery") {
        const { data: onlineRiders } = await adminAny
          .from("delivery_riders")
          .select("user_id")
          .eq("status", "online")
          .eq("is_approved", true)
          .eq("is_blocked", false);
        if (onlineRiders?.length) {
          const userIds = onlineRiders.map((r: { user_id: string }) => r.user_id);
          const { data: riderSubs } = await adminAny
            .from("push_subscriptions").select("endpoint, p256dh, auth").in("user_id", userIds);
          if (riderSubs?.length) {
            await sendOrderStatusPush(riderSubs, id, restName, "ready");
          }
        }
      }
    } catch { /* ignore push errors */ }
  });

  return NextResponse.json({ success: true, status: newStatus });
}
