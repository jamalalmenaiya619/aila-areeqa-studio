// Every request passes through here. Only the login page and its own files are public.
// Lessons, Intel, photos and the app code are served only after the login check.
import { getUser } from "./_lib/auth";
import { json, type Data, type Env } from "./_lib/env";

const PUBLIC = [/^\/login(\.html)?\/?$/, /^\/assets\/public\//, /^\/api\/auth-config$/, /^\/favicon\.svg$/, /^\/robots\.txt$/];

export const onRequest: PagesFunction<Env, string, Data> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const secure = (r: Response) => {
    const res = new Response(r.body, r);
    res.headers.set("x-robots-tag", "noindex, nofollow");
    res.headers.set("x-content-type-options", "nosniff");
    res.headers.set("referrer-policy", "same-origin");
    res.headers.set("x-frame-options", "DENY");
    return res;
  };
  if (PUBLIC.some((r) => r.test(url.pathname))) return secure(await ctx.next());

  const { user, setCookies, supabase, test } = await getUser(ctx.request, ctx.env);
  if (!user) {
    const res = url.pathname.startsWith("/api/")
      ? json({ code: "not_logged_in" }, 401)
      : new Response(null, { status: 302, headers: { location: "/login?next=" + encodeURIComponent(url.pathname + url.search), "cache-control": "no-store" } });
    for (const c of setCookies) res.headers.append("set-cookie", c);
    return secure(res);
  }
  ctx.data.user = user;
  ctx.data.supabase = supabase;
  ctx.data.test = test;
  const res = secure(await ctx.next());
  // Private content must never be stored by a shared cache.
  res.headers.set("cache-control", /^\/assets\//.test(url.pathname) ? "private, max-age=31536000, immutable" : "private, no-store");
  for (const c of setCookies) res.headers.append("set-cookie", c);
  return res;
};
