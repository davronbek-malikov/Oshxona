import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RestaurantContext {
  type: "restaurants";
  restaurants: Array<{
    id: string;
    name_uz: string;
    name_en: string | null;
    description: string | null;
  }>;
}

interface MenuContext {
  type: "menu";
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

interface SearchRequest {
  query: string;
  context: RestaurantContext | MenuContext;
}

interface MatchItem { id: string; name: string; price: number }
interface Match { restaurantId: string; restaurantName: string; items: MatchItem[] }
interface SearchResponse { reply: string; matches: Match[] }

// ─── Detect which provider to use ─────────────────────────────────────────────
type Provider = "groq" | "gemini";

function detectProvider(): { provider: Provider; apiKey: string } | null {
  if (process.env.GROQ_API_KEY) {
    return { provider: "groq", apiKey: process.env.GROQ_API_KEY };
  }
  if (process.env.GOOGLE_GEMINI_API_KEY) {
    return { provider: "gemini", apiKey: process.env.GOOGLE_GEMINI_API_KEY };
  }
  return null;
}

// ─── Shared system prompt ──────────────────────────────────────────────────────
function buildPrompt(query: string, ctx: RestaurantContext | MenuContext): string {
  const ctxJson =
    ctx.type === "restaurants"
      ? JSON.stringify(
          ctx.restaurants.map((r) => ({
            id: r.id,
            name: r.name_uz + (r.name_en ? ` / ${r.name_en}` : ""),
            description: r.description ?? "",
          }))
        )
      : JSON.stringify(
          ctx.items.map((i) => ({
            id: i.id,
            restaurantId: ctx.restaurantId,
            restaurantName: ctx.restaurantName,
            name: i.name_uz + (i.name_en ? ` / ${i.name_en}` : ""),
            category: i.category ?? "",
            price: i.price_krw,
          }))
        );

  return `You are a food assistant for Oshxona, a halal Uzbek food app in South Korea.
The user query may be in Uzbek, Korean, English, or Russian.
Find the best matching ${ctx.type === "restaurants" ? "restaurants" : "menu items"}.

User query: "${query}"

Available ${ctx.type === "restaurants" ? "restaurants" : "menu items"}:
${ctxJson}

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "reply": "Short friendly response in the SAME language as the query (max 1 sentence)",
  "matches": [
    {
      "restaurantId": "uuid",
      "restaurantName": "name",
      "items": [{ "id": "uuid", "name": "item name", "price": 12000 }]
    }
  ]
}
Rules: max 3 matches. If nothing found return {"reply":"...","matches":[]}.
Understand food in Uzbek/Korean/English/Russian (kabob=케밥=кабоб, osh=плов=밥).`;
}

// ─── Groq (OpenAI-compatible, free) ───────────────────────────────────────────
async function callGroq(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 1024,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Groq error:", err);
    throw new Error(`Groq API error ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ─── Google Gemini ─────────────────────────────────────────────────────────────
async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error("Gemini error:", err);
    throw new Error(`Gemini API error ${res.status}`);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

// ─── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Avtorizatsiya kerak" }, { status: 401 });
  }

  const providerConfig = detectProvider();
  if (!providerConfig) {
    return NextResponse.json(
      { error: "AI search not configured. Add GROQ_API_KEY or GOOGLE_GEMINI_API_KEY to .env.local" },
      { status: 503 }
    );
  }

  let body: SearchRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { query, context } = body;
  if (!query?.trim() || !context) {
    return NextResponse.json({ error: "Missing query or context" }, { status: 400 });
  }

  const prompt = buildPrompt(query.trim(), context);

  try {
    const { provider, apiKey } = providerConfig;
    const rawText =
      provider === "groq"
        ? await callGroq(prompt, apiKey)
        : await callGemini(prompt, apiKey);

    // Strip markdown fences if present (Gemini sometimes adds them)
    const cleaned = rawText
      .replace(/^```(?:json)?\n?/, "")
      .replace(/\n?```$/, "")
      .trim();

    let parsed: SearchResponse;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json<SearchResponse>({ reply: query, matches: [] });
    }

    return NextResponse.json<SearchResponse>({
      reply: parsed.reply ?? "",
      matches: Array.isArray(parsed.matches) ? parsed.matches : [],
    });
  } catch (err) {
    console.error("AI search error:", err);
    return NextResponse.json({ error: "AI service error" }, { status: 502 });
  }
}
