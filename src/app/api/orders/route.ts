import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { z } from "zod";

const orderItemSchema = z.object({
  menu_item_id: z.string().uuid(),
  quantity: z.number().int().min(1),
});

const schema = z.object({
  restaurant_id: z.string().uuid(),
  items: z.array(orderItemSchema).min(1),
  delivery_type: z.enum(["pickup", "delivery"]).default("pickup"),
  delivery_address: z.string().optional().nullable(),
  delivery_lat: z.number().optional().nullable(),
  delivery_lng: z.number().optional().nullable(),
  customer_note: z.string().optional().nullable(),
  payment_receipt_url: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Avtorizatsiya kerak" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ma'lumotlar noto'g'ri", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { items, delivery_type, delivery_address, ...rest } = parsed.data;

  // Enforce delivery_address when delivery_type === "delivery"
  if (delivery_type === "delivery" && !delivery_address?.trim()) {
    return NextResponse.json({ error: "Yetkazib berish manzilini kiriting" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Derive customer_id server-side from the authenticated session
  const phone = "+" + user.email!.replace("@oshxona.internal", "");
  const { data: dbUser } = await admin
    .from("users")
    .select("id")
    .eq("phone", phone)
    .single();

  if (!dbUser) {
    return NextResponse.json({ error: "Foydalanuvchi topilmadi" }, { status: 400 });
  }

  // Fetch authoritative prices server-side — never trust client-supplied prices
  const itemIds = items.map((i) => i.menu_item_id);
  const { data: menuItems, error: menuError } = await admin
    .from("menu_items")
    .select("id, price_krw, is_available, sold_out_today, restaurant_id")
    .in("id", itemIds);

  if (menuError || !menuItems) {
    return NextResponse.json({ error: "Menu ma'lumotlari topilmadi" }, { status: 400 });
  }

  // Verify all items belong to the requested restaurant
  const wrongRestaurant = menuItems.some((m) => m.restaurant_id !== parsed.data.restaurant_id);
  if (wrongRestaurant) {
    return NextResponse.json({ error: "Noto'g'ri restoran" }, { status: 400 });
  }

  // Check availability
  const unavailable = menuItems.filter((m) => !m.is_available || m.sold_out_today);
  if (unavailable.length > 0) {
    return NextResponse.json({ error: "Ba'zi mahsulotlar mavjud emas" }, { status: 400 });
  }

  // Build price map and compute total server-side
  const priceMap = new Map(menuItems.map((m) => [m.id, m.price_krw]));
  let total_krw = 0;
  const orderItems = items.map((item) => {
    const price = priceMap.get(item.menu_item_id) ?? 0;
    total_krw += price * item.quantity;
    return {
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      price_at_order: price,
    };
  });

  // Calculate distance-based rider fee for delivery orders
  let rider_fee_krw = 3000; // default
  if (delivery_type === "delivery" && parsed.data.delivery_lat && parsed.data.delivery_lng) {
    // Get restaurant location
    const { data: rest } = await admin
      .from("restaurants").select("location").eq("id", parsed.data.restaurant_id).single();
    if (rest?.location) {
      // Haversine distance (approximate)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const loc = rest.location as any;
      const [rLng, rLat] = loc.coordinates ?? [0, 0];
      const R = 6371;
      const dLat = ((parsed.data.delivery_lat - rLat) * Math.PI) / 180;
      const dLng = ((parsed.data.delivery_lng - rLng) * Math.PI) / 180;
      const a = Math.sin(dLat / 2) ** 2 +
        Math.cos((rLat * Math.PI) / 180) * Math.cos((parsed.data.delivery_lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
      const distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      // ₩2,000 base + ₩500/km, rounded to nearest ₩500, min ₩3,000 max ₩15,000
      rider_fee_krw = Math.min(15000, Math.max(3000, Math.round((2000 + distanceKm * 500) / 500) * 500));
    }
  }

  // Create order
  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      ...rest,
      delivery_type,
      delivery_address: delivery_address ?? null,
      customer_id: dbUser.id,
      total_krw,
      status: "pending_payment",
      ...(delivery_type === "delivery" ? { rider_fee_krw } : {}),
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: orderError?.message ?? "Order yaratib bo'lmadi" },
      { status: 500 }
    );
  }

  // Create order items
  const { error: itemsError } = await admin.from("order_items").insert(
    orderItems.map((item) => ({ order_id: order.id, ...item }))
  );

  if (itemsError) {
    await admin.from("orders").delete().eq("id", order.id);
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  return NextResponse.json({ id: order.id }, { status: 201 });
}
