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
      setTimeout(() => inputRef.current?.focus(), 120);
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

      const context =
        menuContext
          ? { type: "menu" as const, ...menuContext }
          : {
              type: "restaurants" as const,
              restaurants: restaurants ?? [],
            };

      try {
        const res = await fetch("/api/ai/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q.trim(), context }),
        });
        const data = await res.json();
        if (!res.ok) {
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

    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const r = new SR();
    r.continuous = false;
    r.interimResults = false;
    r.lang = lang === "uz" ? "uz-UZ" : lang === "en" ? "en-US" : "en-US";

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
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        aria-label={t("ai.buttonLabel")}
        className="fixed bottom-[112px] right-4 z-40 w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-transform"
        style={{ boxShadow: "0 4px 20px rgba(249,115,22,0.45)" }}
      >
        <span className="text-2xl leading-none">✨</span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-up panel */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ maxHeight: "70vh" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1.5 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <span className="font-bold text-lg">{t("ai.buttonLabel")}</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-muted-foreground hover:bg-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Input row */}
        <div className="px-4 pb-3 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={listening ? t("ai.listening") : query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch(query)}
            placeholder={t("ai.placeholder")}
            disabled={listening || loading}
            className="flex-1 h-12 px-4 rounded-2xl border border-input bg-gray-50 text-base focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
          />
          {/* Voice button */}
          <button
            onClick={listening ? stopVoice : startVoice}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
              listening
                ? "bg-red-500 text-white animate-pulse"
                : "bg-gray-100 text-muted-foreground hover:bg-gray-200"
            }`}
            aria-label={t("ai.tryVoice")}
          >
            🎤
          </button>
          {/* Search button */}
          <button
            onClick={() => doSearch(query)}
            disabled={!query.trim() || loading || listening}
            className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-primary/90 active:scale-95 transition-transform"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              "→"
            )}
          </button>
        </div>

        {/* Results */}
        <div
          className="overflow-y-auto px-4 pb-8"
          style={{ maxHeight: "calc(70vh - 160px)" }}
        >
          {loading && (
            <p className="text-center text-muted-foreground py-6 text-sm">
              {t("ai.searching")}
            </p>
          )}

          {error && (
            <p className="text-center text-red-500 py-6 text-sm">{error}</p>
          )}

          {!loading && matches !== null && (
            <>
              {reply && (
                <div className="mb-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 text-sm">
                  {reply}
                </div>
              )}

              {matches.length === 0 ? (
                <p className="text-center text-muted-foreground py-4 text-sm">
                  {t("ai.noResults")}
                </p>
              ) : (
                <div className="space-y-3">
                  {matches.map((match) => (
                    <div
                      key={match.restaurantId}
                      className="bg-gray-50 rounded-2xl p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-bold text-base">{match.restaurantName}</p>
                        <Link
                          href={`/menu/${match.restaurantId}`}
                          onClick={() => setOpen(false)}
                          className="text-xs text-primary font-semibold"
                        >
                          {t("ai.goToRestaurant")} →
                        </Link>
                      </div>
                      {match.items.length > 0 && (
                        <ul className="space-y-1">
                          {match.items.map((item) => (
                            <li
                              key={item.id}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-foreground">{item.name}</span>
                              <span className="text-primary font-semibold">
                                ₩{item.price.toLocaleString()}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
