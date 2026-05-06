import webpush from "web-push";
import type { Database } from "@/types/database";

type OrderStatus = Database["public"]["Tables"]["orders"]["Row"]["status"];

const STATUS_LABEL_UZ: Record<OrderStatus, string> = {
  pending_payment:   "To'lov kutilmoqda",
  payment_claimed:   "To'lov jo'natildi",
  payment_confirmed: "To'lov tasdiqlandi",
  preparing:         "Tayyorlanmoqda",
  ready:             "Tayyor! Olib keting",
  delivered:         "Yetkazildi",
  cancelled:         "Bekor qilindi",
};

webpush.setVapidDetails(
  "mailto:oshxona@example.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export interface PushSubscriptionRecord {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function sendOrderStatusPush(
  subscriptions: PushSubscriptionRecord[],
  orderId: string,
  restaurantName: string,
  status: OrderStatus
) {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return; // Push not configured — silently skip
  }

  const label = STATUS_LABEL_UZ[status] ?? status;
  const payload = JSON.stringify({
    title: restaurantName,
    body: label,
    orderId,
    status,
    url: `/orders/${orderId}`,
  });

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
        { TTL: 60 * 60 } // 1 hour TTL
      )
    )
  );

  return results;
}
