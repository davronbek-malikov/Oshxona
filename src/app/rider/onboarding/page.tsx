"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

/* ── SVG icons (no emoji as structural icons per UX Pro Max) ─────────────── */
function MotorcycleIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 48 32" fill="none" className="w-10 h-7"
         stroke={active ? "#F97316" : "#555"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="25" r="5" /><circle cx="38" cy="25" r="5" />
      <path d="M15 25h14M24 8l6 12H15l3-8h6zM28 8h8l4 8" />
    </svg>
  );
}
function BicycleIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 48 32" fill="none" className="w-10 h-7"
         stroke={active ? "#F97316" : "#555"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="22" r="7" /><circle cx="38" cy="22" r="7" />
      <path d="M10 22l10-14h10l8 14M20 8h-4M24 8l-4 14" />
    </svg>
  );
}
function CarIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 48 28" fill="none" className="w-10 h-7"
         stroke={active ? "#F97316" : "#555"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13" cy="22" r="4" /><circle cx="35" cy="22" r="4" />
      <path d="M4 18h40v4H4zM8 18l4-9h24l4 9M14 9h8M26 9h6" />
    </svg>
  );
}
function WalkIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 36" fill="none" className="w-7 h-9"
         stroke={active ? "#F97316" : "#555"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="4" r="3" />
      <path d="M12 7l2 8-4 3M14 15l2 10M10 15l-3 10M8 25l6-3" />
    </svg>
  );
}

const KOREAN_BANKS = [
  "KB국민은행", "신한은행", "하나은행", "우리은행",
  "농협은행", "카카오뱅크", "토스뱅크", "기업은행",
];

type Step = 1 | 2 | 3 | "pending";

const STEPS_TOTAL = 3;

export default function RiderOnboardingPage() {
  const router = useRouter();
  const { lang } = useLanguage();

  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  // On mount: if already registered redirect to the right screen
  useEffect(() => {
    fetch("/api/rider/orders?type=available")
      .then((r) => r.json())
      .then((d) => {
        if (d.pending) { router.replace("/rider/pending"); return; }
        if (d.blocked) { router.replace("/rider/blocked"); return; }
        if (d.rider)   { router.replace("/rider/orders");  return; }
        setChecking(false);
      })
      .catch(() => setChecking(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Step 1
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");

  // Step 2
  const [vehicle, setVehicle] = useState<"motorcycle" | "bicycle" | "car" | "walking">("motorcycle");

  // Step 3
  const [paymentMethod, setPaymentMethod] = useState<"bank" | "cash">("bank");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankHolder, setBankHolder] = useState("");

  const uz = lang === "uz";

  const VEHICLES = [
    {
      value: "motorcycle" as const,
      label: uz ? "Mototsikl" : "Motorcycle",
      desc: uz ? "Tez yetkazish" : "Fast delivery",
      Icon: MotorcycleIcon,
    },
    {
      value: "bicycle" as const,
      label: uz ? "Velosiped" : "Bicycle",
      desc: uz ? "Yaqin masofalar" : "Short distances",
      Icon: BicycleIcon,
    },
    {
      value: "car" as const,
      label: uz ? "Avtomobil" : "Car",
      desc: uz ? "Katta buyurtmalar" : "Large orders",
      Icon: CarIcon,
    },
    {
      value: "walking" as const,
      label: uz ? "Piyoda" : "On foot",
      desc: uz ? "Juda yaqin masofalar" : "Very short range",
      Icon: WalkIcon,
    },
  ];

  function validateStep1() {
    if (!name.trim()) {
      setNameError(uz ? "Ism kiritish majburiy" : "Name is required");
      return false;
    }
    if (name.trim().split(" ").length < 2) {
      setNameError(uz ? "Ism va familiyangizni kiriting" : "Please enter first and last name");
      return false;
    }
    setNameError("");
    return true;
  }

  function handleNext() {
    if (step === 1 && !validateStep1()) return;
    setError("");
    setStep((s) => (s === 1 ? 2 : s === 2 ? 3 : s) as Step);
  }

  async function handleSubmit(e?: React.SyntheticEvent) {
    e?.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/rider/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          vehicle,
          payment_method: paymentMethod,
          bank_name: paymentMethod === "bank" ? (bankName || null) : null,
          bank_account_number: paymentMethod === "bank" ? (bankAccount || null) : null,
          bank_account_holder: paymentMethod === "bank" ? (bankHolder || null) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Xatolik yuz berdi"); return; }
      // existing: true means this account already has a rider profile
      if (data.existing) { router.replace("/rider/pending"); return; }
      setStep("pending");
    } catch {
      setError(uz ? "Internet aloqasini tekshiring" : "Check your internet connection");
    } finally {
      setSaving(false);
    }
  }

  /* ── Loading check ───────────────────────────────────────────────────── */
  if (checking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#F97316]/30 border-t-[#F97316] rounded-full animate-spin" />
      </div>
    );
  }

  /* ── Pending approval screen ─────────────────────────────────────────── */
  if (step === "pending") {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-[#F97316]/10 flex items-center justify-center mb-6">
          <svg viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="1.5" className="w-10 h-10">
            <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" />
            <path d="M12 6V12L16 14" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-[24px] font-extrabold text-gray-900 mb-3">
          {uz ? "Ariza qabul qilindi!" : "Application Received!"}
        </h1>
        <p className="text-gray-500 text-[15px] leading-relaxed mb-2">
          {uz
            ? "Arizangiz admin tomonidan ko'rib chiqilmoqda."
            : "Your application is being reviewed by the admin."}
        </p>
        <p className="text-gray-400 text-[13px] mb-8">
          {uz
            ? "Tasdiqlangandan so'ng siz bilan bog'lanamiz."
            : "You will be notified once approved."}
        </p>
        <div className="bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-left w-full max-w-sm space-y-2 mb-8">
          <div className="flex justify-between text-[14px]">
            <span className="text-gray-400">{uz ? "Ism" : "Name"}</span>
            <span className="text-gray-900 font-semibold">{name}</span>
          </div>
          <div className="flex justify-between text-[14px]">
            <span className="text-gray-400">{uz ? "Transport" : "Vehicle"}</span>
            <span className="text-gray-900 font-semibold capitalize">{vehicle}</span>
          </div>
        </div>
        <button onClick={() => router.push("/menu")}
          className="text-[#F97316] text-[15px] font-bold underline underline-offset-4">
          {uz ? "Mijoz sifatida davom etish" : "Continue as customer"}
        </button>
      </div>
    );
  }

  const stepNum = step as 1 | 2 | 3;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="px-4 pt-12 pb-2">
        <div className="flex items-center gap-3 mb-6">
          {stepNum > 1 && (
            <button onClick={() => setStep((s) => ((s as number) - 1) as Step)}
              aria-label={uz ? "Orqaga" : "Back"}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"
              style={{ minWidth: 40 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" className="w-5 h-5">
                <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          <div className="flex-1">
            <p className="text-gray-400 text-[12px] font-bold uppercase tracking-wider mb-1">
              {uz ? `${stepNum}-qadam ${STEPS_TOTAL} dan` : `Step ${stepNum} of ${STEPS_TOTAL}`}
            </p>
            {/* Progress bar */}
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#F97316] rounded-full transition-all duration-400"
                style={{ width: `${(stepNum / STEPS_TOTAL) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <h1 className="text-[26px] font-extrabold text-gray-900 leading-tight">
          {stepNum === 1
            ? (uz ? "Shaxsiy ma'lumotlar" : "Personal Information")
            : stepNum === 2
            ? (uz ? "Transport turini tanlang" : "Choose Your Vehicle")
            : (uz ? "Bank ma'lumotlari" : "Bank Details")}
        </h1>
        <p className="text-gray-400 text-[14px] mt-1">
          {stepNum === 1
            ? (uz ? "To'liq ismingizni kiriting" : "Enter your full legal name")
            : stepNum === 2
            ? (uz ? "Yetkazib berish uchun foydalanadigan transport" : "Vehicle you'll use for deliveries")
            : (uz ? "Daromadingiz qayerga o'tkazilishini belgilang" : "Where to receive your earnings")}
        </p>
      </div>

      {/* ── STEP 1 — Personal info ───────────────────────────────────────── */}
      {stepNum === 1 && (
        <div className="flex-1 px-4 pt-6 pb-32 space-y-5">
          <div>
            <label htmlFor="rider-name" className="block text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              {uz ? "To'liq ism *" : "Full Name *"}
            </label>
            <input
              id="rider-name"
              type="text"
              value={name}
              autoComplete="name"
              onChange={(e) => { setName(e.target.value); if (nameError) setNameError(""); }}
              onBlur={validateStep1}
              placeholder={uz ? "Masalan: Davronbek Malikov" : "e.g. John Smith"}
              className={`w-full rounded-2xl bg-gray-50 px-4 text-[16px] font-medium text-gray-900 placeholder:text-gray-300
                focus:outline-none transition-colors ${nameError
                  ? "border-2 border-red-400 h-14"
                  : "border border-gray-200 focus:border-[#F97316] h-14"}`}
              aria-describedby={nameError ? "name-error" : undefined}
              aria-invalid={!!nameError}
            />
            {nameError && (
              <p id="name-error" role="alert" className="flex items-center gap-1.5 mt-2 text-red-500 text-[13px]">
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
                  <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 4a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3A.75.75 0 018 5zm0 7a1 1 0 100-2 1 1 0 000 2z" />
                </svg>
                {nameError}
              </p>
            )}
            <p className="text-gray-300 text-[12px] mt-2">
              {uz ? "Passport yoki ID dagi ismingizni kiriting" : "Enter name exactly as on your ID or passport"}
            </p>
          </div>
        </div>
      )}

      {/* ── STEP 2 — Vehicle ─────────────────────────────────────────────── */}
      {stepNum === 2 && (
        <div className="flex-1 px-4 pt-6 pb-32">
          <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label={uz ? "Transport turi" : "Vehicle type"}>
            {VEHICLES.map(({ value, label, desc, Icon }) => {
              const selected = vehicle === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setVehicle(value)}
                  className={`relative flex flex-col items-center justify-center gap-2 rounded-2xl p-5 border-2 transition-all
                    min-h-[120px] active:scale-[0.97] ${
                    selected
                      ? "border-[#F97316] bg-orange-50"
                      : "border-gray-200 bg-white"
                  }`}>
                  {selected && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#F97316] flex items-center justify-center">
                      <svg viewBox="0 0 12 12" fill="white" className="w-3 h-3">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                      </svg>
                    </div>
                  )}
                  <Icon active={selected} />
                  <div className="text-center">
                    <p className={`font-bold text-[14px] ${selected ? "text-[#F97316]" : "text-gray-600"}`}>{label}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP 3 — Bank details ────────────────────────────────────────── */}
      {stepNum === 3 && (
        <div className="flex-1 px-4 pt-6 pb-32 space-y-4">
          {/* Payment method toggle */}
          <div className="grid grid-cols-2 gap-2">
            {(["bank", "cash"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setPaymentMethod(m)}
                className={`h-14 rounded-2xl border-2 font-bold text-[15px] transition-all ${
                  paymentMethod === m ? "border-[#F97316] bg-orange-50 text-[#F97316]" : "border-gray-200 bg-white text-gray-400"
                }`}>
                {m === "bank"
                  ? (uz ? "🏦 Bank o'tkazma" : "🏦 Bank transfer")
                  : (uz ? "💵 Naqd pul" : "💵 Cash")}
              </button>
            ))}
          </div>

          <div className="bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3 flex items-start gap-3">
            <svg viewBox="0 0 20 20" fill="#F97316" className="w-5 h-5 flex-shrink-0 mt-0.5">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" />
            </svg>
            <p className="text-gray-500 text-[13px] leading-relaxed">
              {uz
                ? "Bank ma'lumotlari ixtiyoriy, lekin daromad olish uchun zarur."
                : "Bank details are optional but required to receive earnings."}
            </p>
          </div>

          {/* Bank fields — only shown for bank transfer */}
          {paymentMethod === "cash" && (
            <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 text-[13px] text-green-700 font-medium">
              {uz ? "Naqd to'lov: buyurtma yetkazgandan keyin to'lov olasiz." : "Cash payment: you will collect payment after each delivery."}
            </div>
          )}
          {/* Bank name */}
          <div className={paymentMethod === "cash" ? "hidden" : ""}>
            <label htmlFor="bank-select" className="block text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              {uz ? "Bank nomi" : "Bank Name"}
            </label>
            <div className="relative">
              <select
                id="bank-select"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full h-14 rounded-2xl bg-gray-50 border border-gray-200 px-4 pr-10 text-[15px] text-gray-900
                  focus:outline-none focus:border-[#F97316] appearance-none transition-colors"
              >
                <option value="">{uz ? "Bank tanlang (ixtiyoriy)" : "Select bank (optional)"}</option>
                {KOREAN_BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              <svg viewBox="0 0 20 20" fill="#999" className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>

          {/* Account number */}
          <div className={paymentMethod === "cash" ? "hidden" : ""}>
            <label htmlFor="bank-account" className="block text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              {uz ? "Hisob raqami" : "Account Number"}
            </label>
            <input
              id="bank-account"
              type="text"
              inputMode="numeric"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value.replace(/\D/g, ""))}
              placeholder={uz ? "Masalan: 110-123-456789" : "e.g. 110-123-456789"}
              className="w-full h-14 rounded-2xl bg-gray-50 border border-gray-200 px-4 text-[15px] font-mono text-gray-900
                placeholder:text-gray-300 focus:outline-none focus:border-[#F97316] transition-colors"
            />
          </div>

          {/* Account holder */}
          <div className={paymentMethod === "cash" ? "hidden" : ""}>
            <label htmlFor="bank-holder" className="block text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              {uz ? "Hisob egasi" : "Account Holder"}
            </label>
            <input
              id="bank-holder"
              type="text"
              autoComplete="name"
              value={bankHolder}
              onChange={(e) => setBankHolder(e.target.value)}
              placeholder={uz ? "Bank hisob egasining ismi" : "Name as shown on bank account"}
              className="w-full h-14 rounded-2xl bg-gray-50 border border-gray-200 px-4 text-[15px] text-gray-900
                placeholder:text-gray-300 focus:outline-none focus:border-[#F97316] transition-colors"
            />
          </div>

          {error && (
            <div role="alert" className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
              <svg viewBox="0 0 20 20" fill="#ef4444" className="w-5 h-5 flex-shrink-0 mt-0.5">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
              </svg>
              <p className="text-red-600 text-[14px] leading-relaxed">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Fixed CTA bar ─────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-5">
        <div className="max-w-[640px] mx-auto">
          <button
            type="button"
            disabled={saving}
            onClick={stepNum < 3 ? handleNext : handleSubmit}
            className="w-full h-14 rounded-2xl bg-[#F97316] text-white font-extrabold text-[17px]
              active:scale-[0.97] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ minHeight: 56 }}
          >
            {saving ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {uz ? "Yuborilmoqda..." : "Submitting..."}
              </>
            ) : stepNum < 3 ? (
              <>{uz ? "Davom etish" : "Continue"} <span className="opacity-70">→</span></>
            ) : (
              uz ? "Ariza yuborish" : "Submit Application"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
