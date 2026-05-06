import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const isConfigured =
    supabaseUrl.startsWith("https://") && supabaseKey.length > 20;

  // Redirect to /setup until credentials are filled in
  if (!isConfigured) {
    if (!pathname.startsWith("/setup")) {
      return NextResponse.redirect(new URL("/setup", request.url));
    }
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(
          ({
            name,
            value,
            options,
          }: {
            name: string;
            value: string;
            options: object;
          }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          }
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public routes — no auth required
  const publicPaths = ["/login", "/verify", "/auth/callback", "/api/auth", "/api/telegram"];
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (
    user &&
    (pathname === "/" || pathname === "/login" || pathname === "/verify")
  ) {
    return NextResponse.redirect(new URL("/menu", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)",
  ],
};
