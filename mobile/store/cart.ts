import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface CartItem {
  id: string;
  name_uz: string;
  price_krw: number;
  quantity: number;
}

interface CartStore {
  restaurantId: string | null;
  restaurantName: string;
  items: CartItem[];
  addItem: (restaurantId: string, restaurantName: string, item: Omit<CartItem, "quantity">) => boolean;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      restaurantId: null,
      restaurantName: "",
      items: [],

      addItem(restaurantId, restaurantName, item) {
        const state = get();
        if (state.restaurantId && state.restaurantId !== restaurantId) return false;

        set((s) => {
          const existing = s.items.find((i) => i.id === item.id);
          return {
            restaurantId,
            restaurantName,
            items: existing
              ? s.items.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
              : [...s.items, { ...item, quantity: 1 }],
          };
        });
        return true;
      },

      removeItem: (id) =>
        set((s) => ({
          items: s.items.filter((i) => i.id !== id),
          restaurantId: s.items.length === 1 ? null : s.restaurantId,
        })),

      updateQty: (id, qty) =>
        set((s) => ({
          items: qty <= 0
            ? s.items.filter((i) => i.id !== id)
            : s.items.map((i) => i.id === id ? { ...i, quantity: qty } : i),
        })),

      clearCart: () => set({ items: [], restaurantId: null, restaurantName: "" }),

      total: () => get().items.reduce((sum, i) => sum + i.price_krw * i.quantity, 0),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: "oshxona-cart",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
