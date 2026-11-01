// Runtime settings, fetched from /api/auth-config so the same build works locally and online.
export type AuthConfig = { mode: "supabase"; url: string; anonKey: string } | { mode: "test" } | { mode: "missing"; message: string };

let cached: Promise<AuthConfig> | null = null;
export function getAuthConfig(): Promise<AuthConfig> {
  cached ||= fetch("/api/auth-config", { credentials: "same-origin" })
    .then((r) => r.json() as Promise<AuthConfig>)
    .catch(() => ({ mode: "missing", message: "Couldn't reach the site's settings. Check your connection and reload." }) as AuthConfig);
  return cached;
}
export const TEST_COOKIE = "studio-test-auth";
