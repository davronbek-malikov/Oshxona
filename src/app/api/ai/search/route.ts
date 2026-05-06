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

interface MatchItem {
  id: string;
  name: string;
  price: number;
}

interface Match {
  restaurantId: string;
  restaurantName: string;
  items: MatchItem[];
}

interface SearchResponse {
  reply: string;
  matches: Match[];
}

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
The user's query may be in Uzbek, Korean, English, or Russian.
Find the best matching ${ctx.type === "restaurants" ? "restaurants" : "menu items"} from the available list.

User query: "${query}"

Available ${ctx.type === "restaurants" ? "restaurants" : "menu items"}:
${ctxJson}

Respond ONLY with valid JSON (no markdown, no code blocks) in this exact format:
{
  "reply": "A short friendly response in the SAME language as the user's query (max 1 sentence)",
  "matches": [
    {
      "restaurantId": "uuid here",
      "restaurantName": "restaurant name here",
      "items": [
        { "id": "uuid", "name": "item name", "price": 12000 }
      ]
    }
  ]
}

Rules:
- For restaurant search: each match has restaurantId, restaurantName, and items: []
- For menu search: each match has restaurantId, restaurantName, and the matching menu items
- If nothing matches, return { "reply": "...", "matches": [] }
- Return at most 3 matches
- Understand food keywords in all 4 languages (e.g. "kabob", "케밥", "кабоб", "chicken")`;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Avtorizatsiya kerak" }, { status: 401 });
  }

  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI search not configured" }, { status: 503 });
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
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      console.error("Gemini error:", err);
      return NextResponse.json({ error: "AI service error" }, { status: 502 });
    }

    const geminiData = await geminiRes.json();
    const rawText: string =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Strip markdown code fences if present
    const cleaned = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();

    let parsed: SearchResponse;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json<SearchResponse>({
        reply: query,
        matches: [],
      });
    }

    return NextResponse.json<SearchResponse>({
      reply: parsed.reply ?? "",
      matches: Array.isArray(parsed.matches) ? parsed.matches : [],
    });
  } catch (err) {
    console.error("AI search error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
