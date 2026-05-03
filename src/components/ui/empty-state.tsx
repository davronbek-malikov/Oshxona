import Link from "next/link";
import { Button } from "./button";

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export function EmptyState({ icon, title, description, ctaLabel, ctaHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <span className="text-6xl">{icon}</span>
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      <p className="text-muted-foreground text-base max-w-xs">{description}</p>
      {ctaLabel && ctaHref && (
        <Button asChild className="mt-2">
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      )}
    </div>
  );
}

export function EmptyCart() {
  return (
    <EmptyState
      icon="🛒"
      title="Savat bo'sh"
      description="Hali hech narsa qo'shilmagan. Menyu sahifasidan taom tanlang."
      ctaLabel="Menyuga qaytish"
      ctaHref="/menu"
    />
  );
}

export function EmptyOrders() {
  return (
    <EmptyState
      icon="📋"
      title="Buyurtmalar yo'q"
      description="Hali birorta buyurtma berilmagan. Yaqin restorandan buyurtma bering!"
      ctaLabel="Menyuga qaytish"
      ctaHref="/menu"
    />
  );
}
