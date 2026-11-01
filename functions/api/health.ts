// Health check (login required). Says which parts are connected; never shows a key.
import { json, type Data, type Env } from "../_lib/env";

export const onRequestGet: PagesFunction<Env, string, Data> = async ({ env, data }) => {
  const out: Record<string, string> = {};
  out.login = data.user ? "ok" : "not logged in";
  out.supabase = env.SUPABASE_URL && env.SUPABASE_ANON_KEY ? "configured" : data.test ? "test mode" : "missing settings";
  if (data.supabase) {
    const { error } = await data.supabase.from("study_progress").select("user_id", { head: true, count: "exact" });
    out.database = error ? "error: " + error.message : "ok";
  }
  out.anthropic = env.ANTHROPIC_API_KEY ? "key present" : "key missing";
  if (!env.FILES) out.r2 = "binding FILES missing";
  else {
    try { await env.FILES.list({ limit: 1 }); out.r2 = "ok"; } catch (e) { out.r2 = "error: " + String((e as Error).message || e); }
  }
  return json(out);
};
