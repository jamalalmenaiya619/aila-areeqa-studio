// Checks the login on the server, from the Supabase session cookies the browser keeps.
import { createServerClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import { testMode, type Env, type User } from "./env";

export const TEST_COOKIE = "studio-test-auth";

export async function getUser(request: Request, env: Env): Promise<{ user: User | null; setCookies: string[]; supabase?: ReturnType<typeof createServerClient>; test?: boolean }> {
  const url = new URL(request.url);
  const cookieHeader = request.headers.get("cookie") || "";
  if (testMode(env, url)) {
    const ok = parseCookieHeader(cookieHeader).some((c) => c.name === TEST_COOKIE && c.value === "1");
    return { user: ok ? { id: "test-user", email: "test@localhost" } : null, setCookies: [], test: true };
  }
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return { user: null, setCookies: [] };
  const setCookies: string[] = [];
  const supabase = createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => parseCookieHeader(cookieHeader).map((c) => ({ name: c.name, value: c.value ?? "" })),
      setAll: (list) => { for (const c of list) setCookies.push(serializeCookieHeader(c.name, c.value, { ...c.options, path: "/", sameSite: "lax", secure: url.protocol === "https:" })); },
    },
  });
  // getClaims() checks the token's signature (and refreshes an expired session, writing new cookies).
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return { user: null, setCookies, supabase };
  return { user: { id: data.claims.sub, email: (data.claims.email as string) || "" }, setCookies, supabase };
}
