// POST /api/coach: checks a task answer with Claude and streams the reply back as plain text.
// The browser sends only which task (lesson + slide) and the answer; the prompt is built here from the lesson files.
import Anthropic from "@anthropic-ai/sdk";
import l1 from "../../content/lessons/l1.json";
import l2 from "../../content/lessons/l2.json";
import l3 from "../../content/lessons/l3.json";
import l4 from "../../content/lessons/l4.json";
import l5 from "../../content/lessons/l5.json";
import l6 from "../../content/lessons/l6.json";
import l7 from "../../content/lessons/l7.json";
import { buildCoachPrompt } from "../../src/study/coach-prompt";
import { COACH_EFFORT, COACH_LIMIT_PER_HOUR, COACH_MAX_TOKENS, COACH_MODEL } from "../../src/config/models";
import { isLocal, json, type Data, type Env } from "../_lib/env";

const LESSONS: Record<string, any> = { l1, l2, l3, l4, l5, l6, l7 };
const testUsage = new Map<string, number[]>(); // test mode only

async function underLimit(data: Data): Promise<boolean> {
  const since = Date.now() - 3600_000;
  if (data.test || !data.supabase) {
    const list = (testUsage.get(data.user!.id) || []).filter((t) => t > since);
    if (list.length >= COACH_LIMIT_PER_HOUR) return false;
    list.push(Date.now()); testUsage.set(data.user!.id, list); return true;
  }
  const { count, error } = await data.supabase.from("coach_usage").select("id", { count: "exact", head: true }).gte("created_at", new Date(since).toISOString());
  if (error) throw new Error(error.message);
  if ((count || 0) >= COACH_LIMIT_PER_HOUR) return false;
  const ins = await data.supabase.from("coach_usage").insert({ user_id: data.user!.id });
  if (ins.error) throw new Error(ins.error.message);
  return true;
}

const textStream = (produce: (write: (t: string) => Promise<void>) => Promise<void>) => {
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const w = writable.getWriter(), enc = new TextEncoder();
  produce((t) => w.write(enc.encode(t))).catch(async () => { try { await w.write(enc.encode("\u0000ERR:stream")); } catch { /* closed */ } }).finally(() => w.close().catch(() => {}));
  return new Response(readable, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" } });
};

export const onRequestPost: PagesFunction<Env, string, Data> = async ({ request, env, data }) => {
  if (!data.user) return json({ code: "not_logged_in" }, 401);
  let body: { lessonId?: string; slide?: number; answer?: string };
  try { body = await request.json(); } catch { return json({ code: "bad_request" }, 400); }
  const lesson = LESSONS[body.lessonId || ""];
  const s = lesson && typeof body.slide === "number" ? lesson.slides[body.slide] : null;
  const answer = (body.answer || "").trim();
  if (!s || s.type !== "task" || !answer || answer.length > 8000) return json({ code: "bad_request" }, 400);

  const fake = env.COACH_FAKE === "1" && isLocal(new URL(request.url));
  if (!env.ANTHROPIC_API_KEY && !fake) return json({ code: "missing_key" }, 503);
  try { if (!(await underLimit(data))) return json({ code: "rate_limited" }, 429); }
  catch { return json({ code: "server_error" }, 500); }

  if (fake) return textStream(async (write) => {
    for (const part of ["**Verdict:** On track. ", "Test reply.\n\n**What you got right:** You wrote an answer.\n\n", "**What to fix:** Nothing, this is a test.\n\n**Try this:** Press Next."]) await write(part);
  });

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const prompt = buildCoachPrompt(lesson, s, answer);
  return textStream(async (write) => {
    const stream = client.beta.messages.stream({
      model: COACH_MODEL,
      max_tokens: COACH_MAX_TOKENS,
      output_config: { effort: COACH_EFFORT },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      messages: [{ role: "user", content: prompt }],
    });
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") await write(event.delta.text);
    }
    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal") await write("\n\nThis answer couldn't be checked. Try rewording it, then press Enter again.");
  });
};
