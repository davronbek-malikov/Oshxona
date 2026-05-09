"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

interface WeatherData {
  temp: number;
  isDay: boolean;
}

function getHour(): number {
  return new Date().getHours();
}

function getTimeOfDay(hour: number): "morning" | "afternoon" | "evening" | "night" | "latenight" {
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  if (hour >= 21 && hour < 24) return "night";
  return "latenight"; // 0-6
}

interface Suggestion {
  emoji: string;
  title_uz: string;
  title_en: string;
  desc_uz: string;
  desc_en: string;
  food: string;
  warning?: boolean;
}

function getSuggestion(timeOfDay: ReturnType<typeof getTimeOfDay>, temp: number | null): Suggestion {
  const isCold = temp !== null && temp < 10;
  const isHot = temp !== null && temp > 25;

  if (timeOfDay === "latenight") {
    return {
      emoji: "🌙",
      title_uz: "Kech tunda ovqat yaxshimas",
      title_en: "Late night eating isn't ideal",
      desc_uz: "Sog'liq uchun kech tunda ovqatlanmaslik tavsiya etiladi. Lekin juda och bo'lsangiz, engil ovqat tanlang.",
      desc_en: "Late night eating affects your health. If very hungry, choose something light.",
      food: "Mastava yoki sho'rva",
      warning: true,
    };
  }

  if (timeOfDay === "night") {
    return {
      emoji: "🌆",
      title_uz: "Kechqurun engil ovqat tavsiya etiladi",
      title_en: "Light dinner is recommended",
      desc_uz: "Kechqurun og'ir ovqat uxlashga xalaqit beradi. Mastava yoki salat ideal tanlov.",
      desc_en: "Heavy dinner disturbs sleep. Mastava or salad is perfect.",
      food: "Mastava, Achichuk Salat",
      warning: true,
    };
  }

  if (isCold) {
    const foods = timeOfDay === "morning" ? "Somsa, Lag'mon" : "Osh, Somsa, Lag'mon";
    return {
      emoji: "🥶",
      title_uz: `Tashqarida sovuq (${temp}°C) — isitadigan taom!`,
      title_en: `Cold outside (${temp}°C) — warm food time!`,
      desc_uz: "Sovuq havoda issiq osh yoki somsa eng yaxshi tanlov. Ichingizni isiting!",
      desc_en: "Cold weather calls for hot osh or somsa. Warm yourself up!",
      food: foods,
    };
  }

  if (isHot) {
    return {
      emoji: "☀️",
      title_uz: `Issiq kun (${temp}°C) — engil va yangilantiruvchi!`,
      title_en: `Hot day (${temp}°C) — something fresh!`,
      desc_uz: "Issiq havoda salat va ichimliklar eng yaxshi. Yengil va mazali!",
      desc_en: "Hot weather? Fresh salads and cool drinks are perfect!",
      food: "Salat, Ayraan, Ichimlik",
    };
  }

  // Default by time
  const defaults: Record<"morning" | "afternoon" | "evening" | "night" | "latenight", Suggestion> = {
    morning: {
      emoji: "🌅",
      title_uz: "Nonushta vaqti — kunjiga energiya!",
      title_en: "Breakfast time — fuel your day!",
      desc_uz: "Yaxshi kun yaxshi nonushtadan boshlanadi. Somsa yoki lag'mon bilan kuchlaning!",
      desc_en: "A good day starts with a good breakfast. Try somsa or lag'mon!",
      food: "Somsa, Lag'mon",
    },
    afternoon: {
      emoji: "☀️",
      title_uz: "Tushlik vaqti — to'yib ovqatlaning!",
      title_en: "Lunch time — eat well!",
      desc_uz: "Eng yaxshi ovqat tushda eyiladi. Osh yoki kabob sizni to'yintiradi!",
      desc_en: "The best meal is lunch. Osh or kabob will satisfy you!",
      food: "Osh, Kabob, Somsa",
    },
    evening: {
      emoji: "🌇",
      title_uz: "Kechki ovqat vaqti!",
      title_en: "Dinner time!",
      desc_uz: "Og'ir kundan keyin mazali ovqat eng yaxshi mukofot. Nima yeysiz?",
      desc_en: "After a long day, a delicious meal is the best reward. What will you have?",
      food: "Kabob, Osh, Lag'mon",
    },
    night: {
      emoji: "🌆",
      title_uz: "Kechqurun engil ovqat tavsiya etiladi",
      title_en: "Light dinner is recommended",
      desc_uz: "Mastava yoki salat ideal tanlov.",
      desc_en: "Mastava or salad is perfect.",
      food: "Mastava, Salat",
      warning: true,
    },
    latenight: {
      emoji: "🌙",
      title_uz: "Kech tunda ovqat yaxshimas",
      title_en: "Late night eating isn't ideal",
      desc_uz: "Lekin juda och bo'lsangiz, engil ovqat tanlang.",
      desc_en: "If very hungry, choose something light.",
      food: "Mastava",
      warning: true,
    },
  };

  return defaults[timeOfDay];
}

export function SmartEmptyOrders() {
  const { lang } = useLanguage();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [hour] = useState(getHour());

  useEffect(() => {
    // Get location then fetch weather from Open-Meteo (free, no API key needed)
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current_weather=true`
          );
          const data = await res.json();
          if (data.current_weather) {
            setWeather({
              temp: Math.round(data.current_weather.temperature),
              isDay: data.current_weather.is_day === 1,
            });
          }
        } catch {
          // Weather unavailable — use time-only suggestions
        }
      },
      () => {} // Location denied — use time-only suggestions
    );
  }, []);

  const timeOfDay = getTimeOfDay(hour);
  const suggestion = getSuggestion(timeOfDay, weather?.temp ?? null);
  const isUz = lang === "uz";

  return (
    <div className="flex flex-col items-center px-2 pt-4 pb-8 space-y-5">
      {/* Main suggestion card */}
      <div className={`w-full rounded-3xl p-6 text-center ${
        suggestion.warning
          ? "bg-amber-50 border border-amber-200"
          : "bg-white"
      }`} style={!suggestion.warning ? { boxShadow: "0 2px 16px rgba(0,0,0,0.06)" } : {}}>
        <span className="text-6xl block mb-4">{suggestion.emoji}</span>
        <h2 className="font-extrabold text-[20px] text-[#111] leading-tight">
          {isUz ? suggestion.title_uz : suggestion.title_en}
        </h2>
        <p className="text-[14px] text-[#AAAAAA] mt-2 leading-relaxed">
          {isUz ? suggestion.desc_uz : suggestion.desc_en}
        </p>

        {/* Recommended foods */}
        <div className="flex flex-wrap gap-2 justify-center mt-4">
          {suggestion.food.split(",").map((f) => (
            <span key={f} className="bg-primary/10 text-primary text-[13px] font-bold px-3 py-1.5 rounded-full">
              {f.trim()}
            </span>
          ))}
        </div>
      </div>

      {/* Weather info if available */}
      {weather && (
        <div className="flex items-center gap-2 text-[13px] text-[#AAAAAA]">
          <span>{weather.isDay ? "☀️" : "🌙"}</span>
          <span>
            {isUz
              ? `Hozir tashqarida ${weather.temp}°C`
              : `Currently ${weather.temp}°C outside`}
          </span>
        </div>
      )}

      {/* CTA */}
      <Link
        href="/menu"
        className="w-full h-14 bg-primary text-white rounded-2xl flex items-center justify-center font-bold text-[16px] active:scale-[0.98] transition-transform"
        style={{ boxShadow: "0 4px 16px rgba(5,150,105,0.3)" }}
      >
        {isUz ? "🍽️  Oshxonalarga o'tish" : "🍽️  Browse Restaurants"}
      </Link>

      <p className="text-[12px] text-[#CCCCCC] text-center">
        {isUz ? "Hali buyurtma berilmagan" : "No orders placed yet"}
      </p>
    </div>
  );
}
