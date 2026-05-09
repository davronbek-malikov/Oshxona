"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

interface RestaurantItem {
  id: string;
  name: string;
  price: number;
}

interface Match {
  restaurantId: string;
  restaurantName: string;
  items: RestaurantItem[];
}

interface RestaurantEntry {
  id: string;
  name_uz: string;
  name_en: string | null;
  description: string | null;
}

interface MenuContext {
  restaurantId: string;
  restaurantName: string;
  items: Array<{
    id: string;
    name_uz: string;
    name_en: string | null;
    category: string | null;
    price_krw: number;
  }>;
}

interface Props {
  restaurants?: RestaurantEntry[];
  menuContext?: MenuContext;
}

interface SpeechRecognitionEvent extends Event {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((e: Event) => void) | null;
  onend: ((e: Event) => void) | null;
  onerror: ((e: Event) => void) | null;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

// z-[61] > BottomNav z-50, so the panel covers the nav when open
const Z_BACKDROP = "z-[60]";
const Z_PANEL    = "z-[61]";

export function AISearchButton({ restaurants, menuContext }: Props) {
  const { t, lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const hasContext = Boolean(restaurants?.length || menuContext);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      setQuery("");
      setMatches(null);
      setReply("");
      setError("");
    }
  }, [open]);

  const doSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) return;
      setLoading(true);
      setMatches(null);
      setError("");
      setReply("");

      const context = menuContext
        ? { type: "menu" as const, ...menuContext }
        : { type: "restaurants" as const, restaurants: restaurants ?? [] };

      try {
        const res = await fetch("/api/ai/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q.trim(), context }),
        });
        const data = await res.json();
        if (res.status === 503) {
          setError(
            lang === "uz"
              ? "AI qidiruv sozlanmagan. Gemini API kaliti kerak."
              : "AI search not configured. Gemini API key required."
          );
        } else if (!res.ok) {
          setError(t("ai.error"));
        } else {
          setReply(data.reply ?? "");
          setMatches(data.matches ?? []);
        }
      } catch {
        setError(t("ai.error"));
      } finally {
        setLoading(false);
      }
    },
    [restaurants, menuContext, t]
  );

  function startVoice() {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) return;
    recognitionRef.current?.abort();

    const r = new SR();
    r.continuous = false;
    r.interimResults = false;
    r.lang = lang === "en" ? "en-US" : "uz-UZ";
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    r.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript ?? "";
      setQuery(transcript);
      if (transcript) doSearch(transcript);
    };
    recognitionRef.current = r;
    r.start();
  }

  function stopVoice() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  if (!hasContext) return null;

  return (
    <>
      {/* Floating trigger — deep purple, bigger */}
      <button
        onClick={() => setOpen(true)}
        aria-label={t("ai.buttonLabel")}
        className="fixed bottom-[74px] right-4 z-40 w-14 h-14 rounded-2xl text-white flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform"
        style={{
          background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
          boxShadow: "0 6px 24px rgba(124,58,237,0.45)",
        }}
      >
        <span className="text-2xl leading-none">✨</span>
        <span className="text-[9px] font-bold leading-none">AI</span>
      </button>

      {/* Backdrop — z-[60] covers BottomNav (z-50) */}
      <div
        className={`fixed inset-0 ${Z_BACKDROP} transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        } bg-black/50`}
        onClick={() => setOpen(false)}
      />

      {/* Slide-up panel — z-[61], flex column so results scroll inside */}
      <div
        className={`fixed bottom-0 left-0 right-0 ${Z_PANEL} bg-white rounded-t-3xl shadow-2xl
          flex flex-col transition-transform duration-300 ease-out
          ${open ? "translate-y-0" : "translate-y-full"}`}
        style={{ maxHeight: "85vh" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1.5 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <span className="font-bold text-lg">{t("ai.buttonLabel")}</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-muted-foreground hover:bg-gray-200"
            aria-label={t("ai.close")}
          >
            ✕
          </button>
        </div>

        {/* Input row */}
        <div className="px-4 pb-3 flex gap-2 flex-shrink-0">
          <input
            ref={inputRef}
            type="text"
            value={listening ? t("ai.listening") : query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && doSearch(query)}
            placeholder={t("ai.placeholder")}
            disabled={listening || loading}
            className="flex-1 h-12 px-4 rounded-2xl border border-input bg-gray-50 text-base focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
          />
          <button
            onClick={listening ? stopVoice : startVoice}
            className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
              listening
                ? "bg-red-500 text-white animate-pulse"
                : "bg-gray-100 text-muted-foreground hover:bg-gray-200"
            }`}
            aria-label={t("ai.tryVoice")}
          >
            🎤
          </button>
          <button
            onClick={() => doSearch(query)}
            disabled={!query.trim() || loading || listening}
            className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-primary/90 active:scale-95 transition-transform"
            aria-label={t("common.search")}
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <span className="text-lg font-bold">→</span>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 flex-shrink-0" />

        {/* Results — flex-1 + min-h-0 so this section actually scrolls */}
        <div className="flex-1 overflow-y-auto min-h-0 px-4 pt-3 pb-8">
          {/* Empty state — prompt to search */}
          {!loading && !error && matches === null && (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
              <span className="text-4xl">🍽️</span>
              <p className="text-sm text-center">
                {lang === "uz"
                  ? "Taom nomi, kategoriya yoki mahsulot kiriting"
                  : "Type a food name, category or ingredient"}
              </p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">{t("ai.searching")}</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <span className="text-3xl">⚠️</span>
              <p className="text-sm text-red-500 text-center">{error}</p>
            </div>
          )}

          {!loading && matches !== null && (
            <div className="space-y-3">
              {reply && (
                <div className="bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3 text-sm text-foreground">
                  {reply}
                </div>
              )}

              {matches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <span className="text-3xl">🔍</span>
                  <p className="text-sm text-muted-foreground text-center">
                    {t("ai.noResults")}
                  </p>
                </div>
              ) : (
                matches.map((match) => (
                  <div key={match.restaurantId} className="bg-gray-50 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 pt-4 pb-2">
                      <p className="font-bold text-base">{match.restaurantName}</p>
                      <Link
                        href={`/menu/${match.restaurantId}`}
                        onClick={() => setOpen(false)}
                        className="text-xs text-primary font-semibold bg-primary/10 px-3 py-1.5 rounded-full"
                      >
                        {t("ai.goToRestaurant")} →
                      </Link>
                    </div>
                    {match.items.length > 0 && (
                      <ul className="px-4 pb-4 space-y-2">
                        {match.items.map((item) => (
                          <li key={item.id} className="flex items-center justify-between">
                            <span className="text-sm text-foreground">{item.name}</span>
                            <span className="text-sm font-bold text-primary">
                              ₩{item.price.toLocaleString()}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
