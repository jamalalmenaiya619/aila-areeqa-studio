// Public: tells the login page and the app how to reach Supabase. The anon key is meant to be public;
// Row Level Security protects the data. Secret keys are never sent.
import { json, testMode, type Env } from "../_lib/env";

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  if (testMode(env, new URL(request.url))) return json({ mode: "test" });
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY)
    return json({ mode: "missing", message: "The login isn't set up yet: SUPABASE_URL and SUPABASE_ANON_KEY are missing from the site settings." });
  return json({ mode: "supabase", url: env.SUPABASE_URL, anonKey: env.SUPABASE_ANON_KEY });
};
