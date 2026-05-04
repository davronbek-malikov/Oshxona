"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Order = Database["public"]["Tables"]["orders"]["Row"];

interface OrderWithItems extends Order {
  order_items: Array<{
    id: string;
    quantity: number;
    price_at_order: number;
    menu_item_id: string | null;
    menu_items: { name_uz: string } | null;
  }>;
}

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "To'lov kutilmoqda",
  payment_claimed: "To'lov da'vo qilindi",
  payment_confirmed: "To'lov tasdiqlandi",
  preparing: "Tayyorlanmoqda",
  ready: "Tayyor",
  delivered: "Yetkazildi",
  cancelled: "Bekor qilindi",
};

const STATUS_COLORS: Record<string, string> = {
  pending_payment: "bg-yellow-100 text-yellow-700",
  payment_claimed: "bg-blue-100 text-blue-700",
  payment_confirmed: "bg-green-100 text-green-700",
  preparing: "bg-orange-100 text-orange-700",
  ready: "bg-primary/10 text-primary",
  delivered: "bg-gray-100 text-gray-500",
  cancelled: "bg-red-100 text-red-700",
};

export default function RestaurantOrdersPage() {
  const { user } = useCurrentUser();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const supabase = createClient();
      const { data: r } = await supabase
        .from("restaurants")
        .select("id")
        .eq("owner_id", user!.id)
        .single();

      if (!r) { setLoading(false); return; }
      setRestaurantId(r.id);

      const { data: o } = await supabase
        .from("orders")
        .select(`*, order_items(id, quantity, price_at_order, menu_item_id, menu_items(name_uz))`)
        .eq("restaurant_id", r.id)
        .order("created_at", { ascending: false })
        .limit(50);

      setOrders((o ?? []) as OrderWithItems[]);
      setLoading(false);
    }
    load();
  }, [user]);

  async function updateStatus(orderId: string, newStatus: string) {
    setUpdating(orderId);
    const supabase = createClient();
    await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: newStatus as Order["status"] } : o
      )
    );
    setUpdating(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Yuklanmoqda...</p>
      </div>
    );
  }

  if (!restaurantId) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Restoran topilmadi.</p>
      </div>
    );
  }

  const active = orders.filter(
    (o) => !["delivered", "cancelled"].includes(o.status)
  );
  const history = orders.filter((o) =>
    ["delivered", "cancelled"].includes(o.status)
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Buyurtmalar</h1>

      {active.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center">
          <span className="text-5xl">📭</span>
          <p className="font-semibold mt-3">Hozircha buyurtma yo'q</p>
          <p className="text-muted-foreground text-sm mt-1">
            Yangi buyurtmalar shu yerda ko'rinadi
          </p>
        </div>
      )}

      {active.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          updating={updating === order.id}
          onUpdateStatus={(s) => updateStatus(order.id, s)}
        />
      ))}

      {history.length > 0 && (
        <>
          <h2 className="font-semibold text-muted-foreground mt-4">
            Tarix ({history.length})
          </h2>
          {history.slice(0, 10).map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              updating={updating === order.id}
              onUpdateStatus={(s) => updateStatus(order.id, s)}
            />
          ))}
        </>
      )}
    </div>
  );
}

function OrderCard({
  order,
  updating,
  onUpdateStatus,
}: {
  order: OrderWithItems;
  updating: boolean;
  onUpdateStatus: (status: string) => void;
}) {
  const label = STATUS_LABELS[order.status] ?? order.status;
  const color = STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600";

  return (
    <div className="bg-white rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-bold">#{order.id.slice(-6).toUpperCase()}</p>
        <span className={`text-xs rounded-full px-3 py-1 font-medium ${color}`}>
          {label}
        </span>
      </div>

      <div className="text-sm space-y-1">
        {order.order_items.map((item) => (
          <p key={item.id} className="flex justify-between">
            <span>
              {item.menu_items?.name_uz ?? "Mahsulot"} × {item.quantity}
            </span>
            <span className="font-medium">
              ₩{(item.price_at_order * item.quantity).toLocaleString()}
            </span>
          </p>
        ))}
      </div>

      <div className="flex items-center justify-between border-t pt-2">
        <span className="text-muted-foreground text-sm">
          {new Date(order.created_at).toLocaleString("uz-UZ", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <span className="font-bold text-primary text-lg">
          ₩{order.total_krw.toLocaleString()}
        </span>
      </div>

      {/* Action buttons */}
      {!["delivered", "cancelled"].includes(order.status) && (
        <div className="flex gap-2 pt-1">
          {order.status === "payment_claimed" && (
            <button
              onClick={() => onUpdateStatus("payment_confirmed")}
              disabled={updating}
              className="flex-1 h-10 bg-green-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
            >
              ✓ To'lovni tasdiqlash
            </button>
          )}
          {order.status === "payment_confirmed" && (
            <button
              onClick={() => onUpdateStatus("preparing")}
              disabled={updating}
              className="flex-1 h-10 bg-orange-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
            >
              🍳 Tayyorlashni boshlash
            </button>
          )}
          {order.status === "preparing" && (
            <button
              onClick={() => onUpdateStatus("ready")}
              disabled={updating}
              className="flex-1 h-10 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50"
            >
              ✅ Tayyor
            </button>
          )}
          {order.status === "ready" && (
            <button
              onClick={() => onUpdateStatus("delivered")}
              disabled={updating}
              className="flex-1 h-10 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50"
            >
              🛵 Yetkazildi
            </button>
          )}
          {order.status !== "cancelled" && (
            <button
              onClick={() => {
                if (confirm("Buyurtmani bekor qilasizmi?")) {
                  onUpdateStatus("cancelled");
                }
              }}
              disabled={updating}
              className="h-10 px-4 border border-destructive text-destructive rounded-xl text-sm font-semibold disabled:opacity-50"
            >
              Bekor
            </button>
          )}
        </div>
      )}
    </div>
  );
}
