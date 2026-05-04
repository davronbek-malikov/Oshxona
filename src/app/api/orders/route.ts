import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { z } from "zod";

const orderItemSchema = z.object({
  menu_item_id: z.string().uuid(),
  quantity: z.number().int().min(1),
  price_at_order: z.number().min(0),
});

const schema = z.object({
  customer_id: z.string().uuid(),
  restaurant_id: z.string().uuid(),
  items: z.array(orderItemSchema).min(1),
  total_krw: z.number().min(0),
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

  const { items, ...orderData } = parsed.data;
  const admin = await createAdminClient();

  // Create order
  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      ...orderData,
      status: "pending_payment",
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
    items.map((item) => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      price_at_order: item.price_at_order,
    }))
  );

  if (itemsError) {
    // Rollback order if items fail
    await admin.from("orders").delete().eq("id", order.id);
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  return NextResponse.json({ id: order.id }, { status: 201 });
}
