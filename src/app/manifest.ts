import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Oshxona — Mazali halol taomlar",
    short_name: "Oshxona",
    description:
      "Koreyadagi o'zbek restoranlarini toping. Find halal Uzbek food in Korea.",
    start_url: "/menu",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#F97316",
    orientation: "portrait",
    categories: ["food", "lifestyle"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Menyular",
        short_name: "Menyu",
        description: "Restoranlarni ko'rish",
        url: "/menu",
      },
      {
        name: "Buyurtmalar",
        short_name: "Buyurtmalar",
        description: "Buyurtmalarimni ko'rish",
        url: "/orders",
      },
    ],
  };
}
