"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { UZ } from "@/i18n/uz";
import { EN } from "@/i18n/en";
import { createClient } from "@/lib/supabase/client";

export type Locale = "uz" | "en";

type ContextValue = {
  lang: Locale;
  setLang: (lang: Locale) => void;
  t: (path: string) => string;
};

const STORAGE_KEY = "oshxona_lang";
const DICTS = { uz: UZ as unknown as Record<string, unknown>, en: EN as unknown as Record<string, unknown> };

function resolve(obj: Record<string, unknown>, path: string): string {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const part of parts) {
    if (cur == null || typeof cur !== "object") return path;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === "string" ? cur : path;
}

const LanguageContext = createContext<ContextValue>({
  lang: "uz",
  setLang: () => {},
  t: (p) => p,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Locale>("uz");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored === "uz" || stored === "en") {
      setLangState(stored);
      return;
    }
    // Attempt to read from Supabase user profile
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user?.email) return;
      const phone = "+" + user.email.replace("@oshxona.internal", "");
      supabase
        .from("users")
        .select("language")
        .eq("phone", phone)
        .single()
        .then(({ data }) => {
          const dbLang = data?.language as Locale | null;
          if (dbLang === "uz" || dbLang === "en") {
            setLangState(dbLang);
            localStorage.setItem(STORAGE_KEY, dbLang);
          }
        });
    });
  }, []);

  const setLang = useCallback(async (l: Locale) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        const phone = "+" + user.email.replace("@oshxona.internal", "");
        await supabase.from("users").update({ language: l }).eq("phone", phone);
      }
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (path: string) => resolve(DICTS[lang], path),
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
