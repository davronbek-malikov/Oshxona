"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

export default function RiderPendingPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const uz = lang === "uz";

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      {/* Icon */}
      <div className="w-24 h-24 rounded-full bg-[#F97316]/10 flex items-center justify-center mb-6">
        <svg viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="1.5" className="w-12 h-12" aria-hidden="true">
          <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" />
          <path d="M12 6V12L16 14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h1 className="text-[26px] font-extrabold text-gray-900 mb-3">
        {uz ? "Ko'rib chiqilmoqda" : "Under Review"}
      </h1>

      <p className="text-gray-500 text-[15px] leading-relaxed mb-3 max-w-[300px]">
        {uz
          ? "Arizangiz admin tomonidan ko'rib chiqilmoqda. Tasdiqlangandan so'ng siz bilan bog'lanamiz."
          : "Your application is being reviewed by the admin. You will be notified once approved."}
      </p>

      <p className="text-gray-400 text-[13px] mb-10">
        {uz ? "Odatda 24 soat ichida ko'rib chiqiladi." : "Usually reviewed within 24 hours."}
      </p>

      {/* Steps indicator */}
      <div className="w-full max-w-[320px] space-y-3 mb-10">
        {[
          { icon: "✓", label: uz ? "Ariza yuborildi" : "Application submitted", done: true },
          { icon: "⏳", label: uz ? "Admin ko'rib chiqyapti" : "Admin reviewing", done: false, active: true },
          { icon: "→", label: uz ? "Tasdiqlash va ishga kirish" : "Approved & start working", done: false },
        ].map((s, i) => (
          <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
            s.done ? "bg-green-50 border border-green-200"
            : s.active ? "bg-orange-50 border border-orange-200"
            : "bg-gray-50 border border-gray-200"
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[14px] font-bold flex-shrink-0 ${
              s.done ? "bg-green-500 text-white"
              : s.active ? "bg-[#F97316] text-white"
              : "bg-gray-200 text-gray-400"
            }`}>
              {s.icon}
            </div>
            <span className={`text-[14px] font-semibold ${
              s.done ? "text-green-600" : s.active ? "text-gray-900" : "text-gray-400"
            }`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={() => router.push("/menu")}
        className="text-[#F97316] text-[15px] font-bold underline underline-offset-4"
      >
        {uz ? "Mijoz sifatida davom etish" : "Continue as customer"}
      </button>
    </div>
  );
}
