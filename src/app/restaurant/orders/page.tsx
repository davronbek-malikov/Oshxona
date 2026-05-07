"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { createClient } from "@/lib/supabase/client";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
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
  pending_payment:   "Waiting for payment",
  payment_claimed:   "Payment submitted",
  payment_confirmed: "Payment confirmed",
  preparing:         "Preparing",
  ready:             "Ready",
  delivered:         "Delivered",
  cancelled:         "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  pending_payment:   "bg-yellow-100 text-yellow-700",
  payment_claimed:   "bg-blue-100 text-blue-700",
  payment_confirmed: "bg-green-100 text-green-700",
  preparing:         "bg-orange-100 text-orange-700",
  ready:             "bg-primary/10 text-primary",
  delivered:         "bg-gray-100 text-gray-500",
  cancelled:         "bg-red-100 text-red-700",
};

function playAlert() {
  try {
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.connect(ctx.destination);
    [0, 0.15, 0.3].forEach((t) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime + t);
      osc.connect(gain);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.12);
    });
  } catch {
    // AudioContext not available (e.g. no user gesture yet) — silent fail
  }
}

export default function RestaurantOrdersPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const [paymentAlert, setPaymentAlert] = useState<string | null>(null);

  // Step 1: load restaurant + initial orders
  useEffect(() => {
    if (userLoading) return;
    if (!user) { setLoading(false); return; }
    const supabase = createClient();

    async function load() {
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

      setOrders((o ?? []) as unknown as OrderWithItems[]);
      setLoading(false);
    }
    load();
  }, [user, userLoading]);

  // Step 2: set up Realtime once restaurantId is known
  useEffect(() => {
    if (!restaurantId) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`restaurant-orders-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        async () => {
          playAlert();
          setNewOrderAlert(true);
          const { data } = await supabase
            .from("orders")
            .select(`*, order_items(id, quantity, price_at_order, menu_item_id, menu_items(name_uz))`)
            .eq("restaurant_id", restaurantId)
            .order("created_at", { ascending: false })
            .limit(50);
          setOrders((data ?? []) as unknown as OrderWithItems[]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          const updated = payload.new as Order;
          setOrders((prev) =>
            prev.map((o) =>
              o.id === updated.id ? { ...o, status: updated.status } : o
            )
          );
          // Alert restaurant when customer claims they have paid
          if (updated.status === "payment_claimed") {
            playAlert();
            setPaymentAlert(updated.id);
          }
        }
      )
      .subscribe((status) => {
        setLive(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  async function updateStatus(orderId: string, newStatus: Order["status"]) {
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/restaurant/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } finally {
      setUpdating(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!restaurantId) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Restaurant not found.</p>
      </div>
    );
  }

  const active  = orders.filter((o) => !["delivered", "cancelled"].includes(o.status));
  const history = orders.filter((o) =>  ["delivered", "cancelled"].includes(o.status));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Orders</h1>
        {live && (
          <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
            LIVE
          </span>
        )}
      </div>

      {/* New order alert banner */}
      {newOrderAlert && (
        <button
          onClick={() => setNewOrderAlert(false)}
          className="w-full bg-primary text-white rounded-2xl p-4 flex items-center justify-between animate-pulse"
        >
          <span className="font-bold text-lg">🔔 New order arrived!</span>
          <span className="text-sm opacity-80">Tap to dismiss</span>
        </button>
      )}

      {/* Payment claimed alert banner */}
      {paymentAlert && (
        <button
          onClick={() => setPaymentAlert(null)}
          className="w-full bg-blue-500 text-white rounded-2xl p-4 flex items-center justify-between"
        >
          <div className="text-left">
            <p className="font-bold text-base">💸 Payment submitted!</p>
            <p className="text-sm opacity-80">
              Order #{paymentAlert.slice(-6).toUpperCase()} — verify and confirm
            </p>
          </div>
          <span className="text-sm opacity-80 flex-shrink-0">Tap to dismiss</span>
        </button>
      )}

      {active.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center">
          <span className="text-5xl">📭</span>
          <p className="font-semibold mt-3">No active orders</p>
          <p className="text-muted-foreground text-sm mt-1">
            New orders will appear here instantly
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
            History ({history.length})
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
  onUpdateStatus: (status: Order["status"]) => void;
}) {
  const [showReceipt, setShowReceipt] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const label = STATUS_LABELS[order.status] ?? order.status;
  const color = STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600";

  const receiptUrl = order.payment_receipt_url
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/receipts/${order.payment_receipt_url}`
    : null;

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
              {item.menu_items?.name_uz ?? "Item"} × {item.quantity}
            </span>
            <span className="font-medium">
              ₩{(item.price_at_order * item.quantity).toLocaleString()}
            </span>
          </p>
        ))}
      </div>

      {/* Delivery type + address */}
      {order.delivery_type === "delivery" && order.delivery_address && (
        <div className="bg-blue-50 rounded-xl px-3 py-2 text-sm text-blue-800 flex gap-2">
          <span>🛵</span>
          <span>{order.delivery_address}</span>
        </div>
      )}
      {order.delivery_type === "pickup" && (
        <div className="bg-gray-50 rounded-xl px-3 py-2 text-sm text-gray-600 flex gap-2">
          <span>🏪</span>
          <span>Pickup</span>
        </div>
      )}

      {/* Customer note */}
      {order.customer_note && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2 text-sm text-yellow-800 flex gap-2">
          <span>📝</span>
          <span>{order.customer_note}</span>
        </div>
      )}

      {/* Payment receipt */}
      {receiptUrl && (
        <button
          onClick={() => setShowReceipt(true)}
          className="w-full h-10 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-sm font-semibold"
        >
          🧾 View payment receipt
        </button>
      )}

      {/* Receipt modal */}
      {showReceipt && receiptUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowReceipt(false)}
        >
          <div className="relative max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={receiptUrl} alt="Payment receipt" className="w-full rounded-2xl" />
            <button
              onClick={() => setShowReceipt(false)}
              className="absolute top-3 right-3 w-8 h-8 bg-black/60 text-white rounded-full text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-t pt-2">
        <span className="text-muted-foreground text-sm">
          {new Date(order.created_at).toLocaleString("ko-KR", {
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

      <ConfirmModal
        open={showCancelConfirm}
        title="Cancel this order?"
        description="The order will be cancelled and the customer will be notified."
        confirmLabel="Cancel order"
        cancelLabel="Go back"
        destructive
        onConfirm={() => { setShowCancelConfirm(false); onUpdateStatus("cancelled"); }}
        onCancel={() => setShowCancelConfirm(false)}
      />

      {!["delivered", "cancelled"].includes(order.status) && (
        <div className="flex gap-2 pt-1">
          {order.status === "payment_claimed" && (
            <button
              onClick={() => onUpdateStatus("payment_confirmed")}
              disabled={updating}
              className="flex-1 h-10 bg-green-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
            >
              ✓ Confirm payment
            </button>
          )}
          {order.status === "payment_confirmed" && (
            <button
              onClick={() => onUpdateStatus("preparing")}
              disabled={updating}
              className="flex-1 h-10 bg-orange-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
            >
              🍳 Start preparing
            </button>
          )}
          {order.status === "preparing" && (
            <button
              onClick={() => onUpdateStatus("ready")}
              disabled={updating}
              className="flex-1 h-10 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50"
            >
              ✅ Mark ready
            </button>
          )}
          {order.status === "ready" && (
            <button
              onClick={() => onUpdateStatus("delivered")}
              disabled={updating}
              className="flex-1 h-10 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50"
            >
              🛵 Mark delivered
            </button>
          )}
          {order.status !== "cancelled" && (
            <button
              onClick={() => setShowCancelConfirm(true)}
              disabled={updating}
              className="h-10 px-4 border border-destructive text-destructive rounded-xl text-sm font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}
