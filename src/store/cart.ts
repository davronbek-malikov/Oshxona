import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  name_uz: string;
  price_krw: number;
  photo_url: string | null;
  quantity: number;
}

interface CartState {
  restaurantId: string | null;
  restaurantName: string;
  items: CartItem[];
  addItem: (
    restaurantId: string,
    restaurantName: string,
    item: Omit<CartItem, "quantity">
  ) => boolean;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      restaurantId: null,
      restaurantName: "",
      items: [],

      addItem: (restaurantId, restaurantName, item) => {
        const { restaurantId: current, items } = get();
        if (current && current !== restaurantId && items.length > 0) {
          return false; // caller must prompt to clear
        }
        const existing = items.find((i) => i.id === item.id);
        if (existing) {
          set({
            items: items.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          });
        } else {
          set({
            restaurantId,
            restaurantName,
            items: [...items, { ...item, quantity: 1 }],
          });
        }
        return true;
      },

      removeItem: (id) => {
        const items = get().items.filter((i) => i.id !== id);
        set({
          items,
          restaurantId: items.length === 0 ? null : get().restaurantId,
          restaurantName: items.length === 0 ? "" : get().restaurantName,
        });
      },

      updateQty: (id, qty) => {
        if (qty <= 0) {
          get().removeItem(id);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, quantity: qty } : i
          ),
        });
      },

      clearCart: () =>
        set({ restaurantId: null, restaurantName: "", items: [] }),

      total: () =>
        get().items.reduce(
          (sum, item) => sum + item.price_krw * item.quantity,
          0
        ),

      itemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    { name: "oshxona-cart" }
  )
);
