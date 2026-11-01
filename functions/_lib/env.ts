// Settings for the server functions. Secrets live only here (Cloudflare environment variables), never in the browser.
export interface Env {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;      // public by design; still read from settings, not hard-coded
  ANTHROPIC_API_KEY?: string;      // secret
  AUTH_MODE?: string;              // "test" only works on localhost
  COACH_FAKE?: string;             // "1" on localhost: canned coaching reply for automated tests
  FILES?: R2Bucket;                // R2 bucket binding (Phase 3 uses it; Phase 1 only checks it)
  ASSETS: Fetcher;
}
export type User = { id: string; email: string };
export type Data = { user?: User; supabase?: import("@supabase/supabase-js").SupabaseClient; test?: boolean };

export const isLocal = (url: URL) => url.hostname === "localhost" || url.hostname === "127.0.0.1";
export const testMode = (env: Env, url: URL) => env.AUTH_MODE === "test" && isLocal(url);
export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers } });
