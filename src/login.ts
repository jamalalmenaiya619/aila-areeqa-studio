// The login page: email magic link. This page and its files are the only things served without a login.
import "./styles/tokens.css";
import "./styles/login.css";
import { createBrowserClient } from "@supabase/ssr";
import { getAuthConfig, TEST_COOKIE } from "./lib/config";
import { applyTheme, readTheme } from "./lib/theme";

applyTheme(readTheme());
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const form = $<HTMLFormElement>("login-form"), msg = $("msg"), email = $<HTMLInputElement>("email"), btn = $<HTMLButtonElement>("send");
const params = new URLSearchParams(location.search);
const next = (() => { const n = params.get("next") || "/"; return n.startsWith("/") && !n.startsWith("//") ? n : "/"; })();
const say = (t: string) => { msg.textContent = t; };

(async () => {
  const cfg = await getAuthConfig();
  if (cfg.mode === "missing") { say(cfg.message); btn.disabled = true; return; }
  if (cfg.mode === "test") {
    $("test-box").hidden = false;
    $("test-login").addEventListener("click", () => { document.cookie = `${TEST_COOKIE}=1; path=/; SameSite=Lax`; location.href = next; });
    return;
  }
  const sb = createBrowserClient(cfg.url, cfg.anonKey);
  // Coming back from the email link: the session is picked up here, then we go on.
  const code = params.get("code");
  if (code) {
    say("Logging you in…");
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (error) say("That link has expired or was already used. Send a new one."); else { location.replace(next); return; }
  }
  const { data } = await sb.auth.getSession();
  if (data.session) { location.replace(next); return; }
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    btn.disabled = true; say("Sending…");
    const { error } = await sb.auth.signInWithOtp({
      email: email.value.trim(),
      options: { shouldCreateUser: false, emailRedirectTo: `${location.origin}/login?next=${encodeURIComponent(next)}` },
    });
    btn.disabled = false;
    say(error ? "Couldn't send the link. Check the email address, or wait a minute and try again." : "Check your email for a login link. You can close this tab.");
  });
})();
