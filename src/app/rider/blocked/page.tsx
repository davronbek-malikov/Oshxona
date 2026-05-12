"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

export default function RiderBlockedPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const uz = lang === "uz";

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center mb-6">
        <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" className="w-12 h-12" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M4.93 4.93l14.14 14.14" strokeLinecap="round" />
        </svg>
      </div>

      <h1 className="text-[24px] font-extrabold text-gray-900 mb-3">
        {uz ? "Hisobingiz bloklangan" : "Account Blocked"}
      </h1>
      <p className="text-gray-500 text-[15px] leading-relaxed mb-8 max-w-[300px]">
        {uz
          ? "Hisobingiz restoran tomonidan vaqtincha bloklangan. Batafsil ma'lumot uchun restoran bilan bog'laning."
          : "Your account has been temporarily blocked by the restaurant. Please contact the restaurant for more information."}
      </p>

      <button onClick={() => router.push("/rider/profile")}
        className="text-[#F97316] text-[15px] font-bold underline underline-offset-4">
        {uz ? "Profilga o'tish" : "Go to profile"}
      </button>
    </div>
  );
}
