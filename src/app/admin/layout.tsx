"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "admin") {
      router.replace("/menu");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 h-14 flex items-center justify-between sticky top-0 z-30">
        <h1 className="font-bold text-lg">⚙️ Admin Panel</h1>
        <span className="text-xs text-muted-foreground">{user.phone}</span>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
