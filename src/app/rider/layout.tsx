import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Oshxona — Rider Panel",
  description: "Delivery rider dashboard",
};

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
