// Asks the server to check a task answer. The server builds the teacher prompt from the lesson files,
// so the browser only sends which task and the answer text.
export const COACH_ERR: Record<string, string> = {
  missing_key: "Answer checking isn't set up yet. The Anthropic key still needs to be added to the site settings.",
  rate_limited: "That's 30 checks in the last hour, the limit. Wait a little, then press Enter again.",
  not_logged_in: "Your login has ended. Reload the page and log in again.",
  bad_request: "Couldn't check this answer. Reload the page and try again.",
};
export const COACH_FALLBACK = "Couldn't check the answer just now. Press Enter to try again.";

export async function askCoach(input: { lessonId: string; slide: number; answer: string }, onText: (soFar: string) => void, token: string | null): Promise<string> {
  const res = await fetch("/api/coach", {
    method: "POST",
    headers: { "content-type": "application/json", ...(token ? { authorization: "Bearer " + token } : {}) },
    credentials: "same-origin",
    body: JSON.stringify(input),
  });
  if (!res.ok || !res.body) {
    let code = "";
    try { code = ((await res.json()) as { code?: string }).code || ""; } catch { /* not json */ }
    throw Object.assign(new Error(code || "coach_failed"), { code });
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    text += dec.decode(value, { stream: true });
    onText(text);
  }
  if (text.includes("\u0000ERR:")) throw Object.assign(new Error("stream"), { code: "" });
  return text;
}

/** Same formatting as the old page: blank lines make paragraphs, **bold**, single line breaks kept. */
export function coachParagraphs(t: string) {
  return t.split(/\n{2,}/).map((p) => p.split(/(\*\*.+?\*\*)/g).map((part) => (/^\*\*.+\*\*$/.test(part) ? { b: part.slice(2, -2) } : { t: part })));
}
