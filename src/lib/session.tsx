// Who is logged in, and the data store for them. The server already checked the login before this page loaded.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { getAuthConfig } from "./config";
import { localStore, supabaseStore, type Store, type User } from "./store";

type Session = { store: Store; user: User; testMode: boolean; accessToken: () => Promise<string | null> };
const Ctx = createContext<Session | null>(null);
export const useSession = () => { const s = useContext(Ctx); if (!s) throw new Error("No session"); return s; };

export function SessionProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<Session | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      const cfg = await getAuthConfig();
      if (cfg.mode === "missing") throw new Error(cfg.message);
      if (cfg.mode === "test") {
        const store = localStore();
        setS({ store, user: await store.user(), testMode: true, accessToken: async () => "test" });
        return;
      }
      const sb = createBrowserClient(cfg.url, cfg.anonKey);
      const store = supabaseStore(sb);
      const { data } = await sb.auth.getSession();
      if (!data.session) { location.href = "/login?next=" + encodeURIComponent(location.pathname + location.search); return; }
      setS({ store, user: await store.user(), testMode: false, accessToken: async () => (await sb.auth.getSession()).data.session?.access_token || null });
    })().catch((e) => setErr(String(e.message || e)));
  }, []);
  if (err) return <div className="shell-msg"><p>Couldn't open your account: {err}</p><p><a href="/login">Log in again</a></p></div>;
  if (!s) return <div className="shell-msg"><p className="mono">Opening the studio…</p></div>;
  return <Ctx.Provider value={s}>{children}</Ctx.Provider>;
}
