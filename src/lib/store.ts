// Where Jamal's own data lives: Supabase online, or the browser (test mode on a developer's machine only).
import type { SupabaseClient } from "@supabase/supabase-js";

export type LessonState = { slide: number; quiz: Record<string, number>; checks: Record<string, unknown>; notes: Record<string, string>; feedback?: Record<string, string>; best?: number; done: boolean };
export type StudyState = { lessons: Record<string, LessonState>; last: string | null; updatedAt: number };
export type NoteSource = { kind: "slide" | "library" | "intel"; ref: string; label: string; href: string };
export type Note = { id: string; body: string; tags: string[]; source: NoteSource | null; created_at: string; updated_at: string };
export type Checkin = { week_start: string; choice: "deeper" | "keep_going" | null; ideas: string; updated_at?: string };
export type Role = "owner" | "partner" | "designer" | "media";
export type User = { id: string; email: string; roles: Role[] };

export interface Store {
  user(): Promise<User>;
  getProgress(): Promise<{ state: StudyState; imported_from: string | null } | null>;
  saveProgress(state: StudyState, importedFrom?: string): Promise<void>;
  listNotes(): Promise<Note[]>;
  saveNote(n: Partial<Note> & { body: string }): Promise<Note>;
  deleteNote(id: string): Promise<void>;
  getCheckin(weekStart: string): Promise<Checkin | null>;
  saveCheckin(c: Checkin): Promise<void>;
  signOut(): Promise<void>;
}

const must = <T,>(r: { data: T; error: { message: string } | null }) => { if (r.error) throw new Error(r.error.message); return r.data as NonNullable<T>; };
const authUser = async (sb: SupabaseClient) => { const { data, error } = await sb.auth.getUser(); if (error || !data.user) throw new Error(error?.message || "Not logged in"); return data.user; };

export function supabaseStore(sb: SupabaseClient): Store {
  let uid: string | null = null;
  const me = async () => (uid ||= (await authUser(sb)).id);
  return {
    async user() {
      const u = await authUser(sb);
      uid = u.id;
      const roles = must(await sb.from("user_roles").select("role").eq("user_id", u.id)) as { role: Role }[];
      return { id: u.id, email: u.email || "", roles: roles.map((r) => r.role) };
    },
    async getProgress() {
      return must(await sb.from("study_progress").select("state, imported_from").eq("user_id", await me()).maybeSingle()) as never;
    },
    async saveProgress(state, importedFrom) {
      const row: Record<string, unknown> = { user_id: await me(), state };
      if (importedFrom) row.imported_from = importedFrom;
      must(await sb.from("study_progress").upsert(row));
    },
    async listNotes() {
      return must(await sb.from("notes").select("*").order("created_at", { ascending: false })) as Note[];
    },
    async saveNote(n) {
      const row = { body: n.body, tags: n.tags || [], source: n.source ?? null };
      const q = n.id ? sb.from("notes").update(row).eq("id", n.id) : sb.from("notes").insert(row);
      return must(await q.select().single()) as Note;
    },
    async deleteNote(id) { must(await sb.from("notes").delete().eq("id", id)); },
    async getCheckin(weekStart) {
      return must(await sb.from("weekly_checkins").select("week_start, choice, ideas, updated_at").eq("week_start", weekStart).maybeSingle()) as Checkin | null;
    },
    async saveCheckin(c) {
      must(await sb.from("weekly_checkins").upsert({ user_id: await me(), week_start: c.week_start, choice: c.choice, ideas: c.ideas }, { onConflict: "user_id,week_start" }));
    },
    async signOut() { await sb.auth.signOut(); },
  };
}

/** Test mode only (localhost + AUTH_MODE=test): keeps everything in this browser. */
export function localStore(): Store {
  const K = "studio-test-db";
  type DB = { progress: { state: StudyState; imported_from: string | null } | null; notes: Note[]; checkins: Checkin[] };
  const load = (): DB => { try { return JSON.parse(localStorage.getItem(K) || "") as DB; } catch { return { progress: null, notes: [], checkins: [] }; } };
  const save = (d: DB) => localStorage.setItem(K, JSON.stringify(d));
  const now = () => new Date().toISOString();
  return {
    async user() { return { id: "test-user", email: "test@localhost", roles: ["owner"] }; },
    async getProgress() { return load().progress; },
    async saveProgress(state, importedFrom) { const d = load(); d.progress = { state, imported_from: importedFrom || d.progress?.imported_from || null }; save(d); },
    async listNotes() { return load().notes.slice().sort((a, b) => b.created_at.localeCompare(a.created_at)); },
    async saveNote(n) {
      const d = load();
      const existing = n.id && d.notes.find((x) => x.id === n.id);
      const note: Note = existing ? { ...existing, ...n, updated_at: now() } as Note
        : { id: crypto.randomUUID(), body: n.body, tags: n.tags || [], source: n.source ?? null, created_at: now(), updated_at: now() };
      d.notes = [note, ...d.notes.filter((x) => x.id !== note.id)]; save(d); return note;
    },
    async deleteNote(id) { const d = load(); d.notes = d.notes.filter((x) => x.id !== id); save(d); },
    async getCheckin(w) { return load().checkins.find((c) => c.week_start === w) || null; },
    async saveCheckin(c) { const d = load(); d.checkins = [{ ...c, updated_at: now() }, ...d.checkins.filter((x) => x.week_start !== c.week_start)]; save(d); },
    async signOut() { document.cookie = "studio-test-auth=; Max-Age=0; path=/"; localStorage.removeItem(K); },
  };
}
