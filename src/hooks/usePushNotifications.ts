"use client";

import { useState, useEffect, useCallback } from "react";

export type PushState = "unsupported" | "default" | "granted" | "denied" | "loading";

export function usePushNotifications() {
  const [state, setState] = useState<PushState>("loading");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }
    const perm = Notification.permission;
    if (perm === "denied") { setState("denied"); return; }

    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setSubscription(sub);
        setState(sub ? "granted" : perm === "granted" ? "granted" : "default");
      });
    });
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) return false;

    try {
      const reg = await navigator.serviceWorker.ready;
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setState("denied"); return false; }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(sub.getKey("p256dh")!),
            auth: arrayBufferToBase64(sub.getKey("auth")!),
          },
        }),
      });

      setSubscription(sub);
      setState("granted");
      return true;
    } catch {
      return false;
    }
  }, []);

  const unsubscribe = useCallback(async (): Promise<void> => {
    if (!subscription) return;
    await fetch("/api/push/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
    await subscription.unsubscribe();
    setSubscription(null);
    setState("default");
  }, [subscription]);

  return { state, subscription, subscribe, unsubscribe };
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr.buffer as ArrayBuffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}
