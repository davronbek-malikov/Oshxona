"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cart";

export default function CartPage() {
  const { items, restaurantName, updateQty, removeItem, total, itemCount } =
    useCartStore();
  const count = itemCount();

  if (count === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <span className="text-7xl mb-4">🛒</span>
        <h2 className="text-xl font-bold">Savat bo'sh</h2>
        <p className="text-muted-foreground mt-2">
          Restoranlardan taomlar qo'shing
        </p>
        <Link
          href="/menu"
          className="mt-6 h-12 px-8 bg-primary text-white rounded-xl flex items-center font-semibold"
        >
          Menyuga qaytish
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Savat</h1>

      <div className="bg-primary/10 rounded-xl px-4 py-3 flex items-center gap-2">
        <span>🏪</span>
        <span className="font-semibold text-sm">{restaurantName}</span>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl p-4 flex gap-3">
            {item.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.photo_url}
                alt={item.name_uz}
                className="w-16 h-16 object-cover rounded-xl flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🍽️</span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{item.name_uz}</p>
              <p className="text-primary font-bold">
                ₩{item.price_krw.toLocaleString()}
              </p>

              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => updateQty(item.id, item.quantity - 1)}
                  className="w-9 h-9 border border-border rounded-lg flex items-center justify-center text-xl font-bold text-muted-foreground"
                >
                  −
                </button>
                <span className="font-bold text-lg w-6 text-center">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQty(item.id, item.quantity + 1)}
                  className="w-9 h-9 bg-primary text-white rounded-lg flex items-center justify-center text-xl font-bold"
                >
                  +
                </button>
                <span className="ml-auto font-bold">
                  ₩{(item.price_krw * item.quantity).toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={() => removeItem(item.id)}
              className="self-start text-muted-foreground text-xl leading-none"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-lg">Jami / Total</span>
          <span className="font-bold text-2xl text-primary">
            ₩{total().toLocaleString()}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{count} ta mahsulot</p>
      </div>

      <Link
        href="/checkout"
        className="flex items-center justify-center w-full h-14 bg-primary text-white rounded-2xl font-bold text-lg"
      >
        Buyurtma berish →
      </Link>

      <Link
        href="/menu"
        className="block text-center text-sm text-muted-foreground underline"
      >
        Menyuga qaytish
      </Link>
    </div>
  );
}
