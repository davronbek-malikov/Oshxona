import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Oshxona — Halol Ovqat Yetkazish",
    short_name: "Oshxona",
    description: "Koreyadagi halol o'zbek ovqatlari. Halal Uzbek food delivery in Korea.",
    start_url: "/menu",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#059669",
    orientation: "portrait",
    categories: ["food", "lifestyle", "shopping"],
    icons: [
      { src: "/new_logo.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/new_logo.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Menyu", short_name: "Menyu", description: "Restoranlarni ko'rish", url: "/menu" },
      { name: "Buyurtmalarim", short_name: "Buyurtmalar", description: "Buyurtmalarni ko'rish", url: "/orders" },
      { name: "Kuryer", short_name: "Kuryer", description: "Kuryer paneli", url: "/rider/orders" },
    ],
  };
}
