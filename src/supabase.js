// ═══════════════════════════════════════════════════════════════
//  DawnQuiz — Supabase module (optional)
//  Drop in your Supabase URL + anon key to enable Tournament Mode.
//  The app works fully without this file being configured.
// ═══════════════════════════════════════════════════════════════

// ── CONFIG — fill these in from your Supabase project settings ──
const SUPABASE_URL  = "";   // e.g. "https://xxxx.supabase.co"
const SUPABASE_ANON = "";   // e.g. "eyJhbGci..."

// ── Detect if Supabase is configured ────────────────────────────
export const supabaseEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON);

// ── Lightweight fetch wrapper (no SDK dependency) ────────────────
async function sb(method, path, body = null, opts = {}) {
  const prefer = [
    method === "POST" ? "return=representation" : "",
    opts.count ? "count=exact" : "",
  ].filter(Boolean).join(",");

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      "Content-Type":  "application/json",
      "apikey":         SUPABASE_ANON,
      "Authorization": `Bearer ${SUPABASE_ANON}`,
      ...(prefer ? { "Prefer": prefer } : {}),
      ...(opts.count ? { "Range-Unit": "items", "Range": "0-0" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase ${method} ${path}: ${err}`);
  }
  // Return count from header if requested
  if (opts.count) {
    const range = res.headers.get("content-range");
    if (range) {
      const total = range.split("/")[1];
      return total === "*" ? 0 : parseInt(total, 10);
    }
    return 0;
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ═══════════════════════════════════════════════════════════════
//  TOURNAMENTS  (table: tournaments)
//
//  Schema (run this SQL in Supabase SQL editor):
//
//  create table tournaments (
//    id          uuid primary key default gen_random_uuid(),
//    code        text unique not null,
//    title       text not null,
//    description text,
//    tier        text not null default 'expert',
//    tier_length int  not null default 10,
//    difficulty  text not null default 'standard',
//    seed        text not null,
//    created_by  text not null,
//    starts_at   timestamptz not null,
//    ends_at     timestamptz not null,
//    created_at  timestamptz default now()
//  );
//
//  create table tournament_entries (
//    id            uuid primary key default gen_random_uuid(),
//    tournament_id uuid references tournaments(id) on delete cascade,
//    username      text not null,
//    score         int  not null,
//    accuracy      int  not null,
//    correct       int  not null,
//    total         int  not null,
//    time_bonus    int  not null default 0,
//    submitted_at  timestamptz default now()
//  );
//
//  -- Allow anonymous reads & inserts (RLS policies):
//  alter table tournaments enable row level security;
//  alter table tournament_entries enable row level security;
//  create policy "public read tournaments"  on tournaments         for select using (true);
//  create policy "public insert tournament" on tournaments         for insert with check (true);
//  create policy "public read entries"      on tournament_entries  for select using (true);
//  create policy "public insert entry"      on tournament_entries  for insert with check (true);
// ═══════════════════════════════════════════════════════════════

// Generate a short human-readable tournament code e.g. "DAWN-4F2X"
export function genTournamentCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `DAWN-${code}`;
}

// Create a new tournament
export async function createTournament({ title, description, tier, tierLength, difficulty, seed, createdBy, startsAt, endsAt }) {
  const code = genTournamentCode();
  const rows = await sb("POST", "tournaments", {
    code, title, description: description || "",
    tier, tier_length: tierLength, difficulty, seed,
    created_by: createdBy,
    starts_at: startsAt, ends_at: endsAt,
  });
  return rows?.[0] || null;
}

// Fetch a single tournament by code
export async function getTournamentByCode(code) {
  const rows = await sb("GET", `tournaments?code=eq.${encodeURIComponent(code)}&limit=1`);
  return rows?.[0] || null;
}

// Fetch all active tournaments (not yet ended)
export async function getActiveTournaments() {
  const now = new Date().toISOString();
  return await sb("GET", `tournaments?ends_at=gt.${now}&order=ends_at.asc&limit=20`) || [];
}

// Fetch all tournaments (for browsing)
export async function getAllTournaments() {
  return await sb("GET", `tournaments?order=ends_at.desc&limit=50`) || [];
}

// Submit a tournament entry
export async function submitEntry({ tournamentId, username, score, accuracy, correct, total, timeBonus }) {
  const rows = await sb("POST", "tournament_entries", {
    tournament_id: tournamentId,
    username, score, accuracy, correct, total, time_bonus: timeBonus,
  });
  return rows?.[0] || null;
}

// Get leaderboard for a tournament (top 50 — best score per username)
export async function getLeaderboard(tournamentId) {
  const all = await sb("GET",
    `tournament_entries?tournament_id=eq.${tournamentId}&order=score.desc&limit=200`
  ) || [];
  // Deduplicate: keep best score per username
  const best = {};
  for (const e of all) {
    if (!best[e.username] || e.score > best[e.username].score) best[e.username] = e;
  }
  return Object.values(best).sort((a, b) => b.score - a.score).slice(0, 50);
}

// Get a player's personal best in a tournament
export async function getMyBest(tournamentId, username) {
  const rows = await sb("GET",
    `tournament_entries?tournament_id=eq.${tournamentId}&username=eq.${encodeURIComponent(username)}&order=score.desc&limit=1`
  ) || [];
  return rows?.[0] || null;
}

// Build a shareable tournament URL
export function buildTournamentUrl(code) {
  return `${typeof APP_URL !== "undefined" ? APP_URL : window.location.origin}?tournament=${code}`;
}

// ═══════════════════════════════════════════════════════════════
//  CHALLENGES  (table: challenges)
//
//  Add this SQL in Supabase SQL editor:
//
//  create table challenges (
//    id            uuid primary key default gen_random_uuid(),
//    code          text unique not null,
//    seed          text not null,
//    tier          text not null default 'expert',
//    tier_length   int  not null default 10,
//    created_by    text not null,
//    status        text not null default 'waiting',
//    creator_score int,
//    creator_correct int,
//    creator_total   int,
//    opponent_name  text,
//    opponent_score int,
//    opponent_correct int,
//    opponent_total   int,
//    created_at    timestamptz default now(),
//    expires_at    timestamptz not null
//  );
//
//  alter table challenges enable row level security;
//  create policy "public read challenges"   on challenges for select using (true);
//  create policy "public insert challenges" on challenges for insert with check (true);
//  create policy "public update challenges" on challenges for update using (true);
// ═══════════════════════════════════════════════════════════════

// Generate a short challenge code e.g. "CHL-X7K2"
export function genChallengeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `CHL-${code}`;
}

// Create a challenge (default expiry: 24h)
export async function createChallenge({ seed, tier, tierLength, createdBy, expiryHours = 24 }) {
  const code = genChallengeCode();
  const expiresAt = new Date(Date.now() + expiryHours * 3600 * 1000).toISOString();
  const rows = await sb("POST", "challenges", {
    code, seed, tier, tier_length: tierLength,
    created_by: createdBy, status: "waiting", expires_at: expiresAt,
  });
  return rows?.[0] || null;
}

// Fetch a challenge by code
export async function getChallengeByCode(code) {
  const rows = await sb("GET", `challenges?code=eq.${encodeURIComponent(code)}&limit=1`);
  return rows?.[0] || null;
}

// Opponent joins — mark as joined
export async function joinChallenge(id, opponentName) {
  const rows = await sb("PATCH", `challenges?id=eq.${id}`, {
    status: "joined", opponent_name: opponentName,
  });
  return rows?.[0] || null;
}

// Submit creator score
export async function submitCreatorScore(id, { score, correct, total }) {
  await sb("PATCH", `challenges?id=eq.${id}`, {
    creator_score: score, creator_correct: correct, creator_total: total,
  });
}

// Submit opponent score + mark completed
export async function submitOpponentScore(id, { score, correct, total }) {
  await sb("PATCH", `challenges?id=eq.${id}`, {
    opponent_score: score, opponent_correct: correct, opponent_total: total,
    status: "completed",
  });
}

// Build a shareable challenge URL
export function buildChallengeShareUrl(code, seed, tierLength) {
  const base = typeof APP_URL !== "undefined" ? APP_URL : window.location.origin;
  return `${base}?chl=${code}&challenge=${seed}&ql=${tierLength}`;
}

// ═══════════════════════════════════════════════════════════════
//  ANALYTICS  (table: app_events)
//
//  Add this SQL in Supabase SQL editor:
//
//  create table app_events (
//    id          uuid primary key default gen_random_uuid(),
//    event       text not null,
//    username    text,
//    meta        jsonb,
//    created_at  timestamptz default now()
//  );
//
//  create index app_events_event_idx on app_events(event);
//  create index app_events_created_idx on app_events(created_at desc);
//
//  alter table app_events enable row level security;
//  create policy "public insert events" on app_events for insert with check (true);
//  create policy "public read events"   on app_events for select using (true);
// ═══════════════════════════════════════════════════════════════

// Fire-and-forget event logger — never throws, never blocks UI
export function logEvent(event, username = null, meta = {}) {
  if (!supabaseEnabled) return;
  sb("POST", "app_events", { event, username: username || null, meta })
    .catch(() => {}); // silent fail
}

// ── Stats queries for Admin dashboard ───────────────────────────

// Total visits (app_open events)
export async function statsTotalVisits() {
  return await sb("GET", "app_events?event=eq.app_open&select=id", null, { count: true });
}

// Unique visitors (distinct usernames from app_open)
export async function statsUniqueVisitors() {
  // Fetch up to 5000 usernames and deduplicate client-side
  const rows = await sb("GET", "app_events?event=eq.app_open&select=username&limit=5000") || [];
  const unique = new Set(rows.map(r => r.username).filter(Boolean));
  return unique.size;
}

// Visits per day — last 14 days
export async function statsVisitsPerDay() {
  const since = new Date(Date.now() - 14 * 86400000).toISOString();
  const rows = await sb("GET", `app_events?event=eq.app_open&created_at=gt.${since}&select=created_at`) || [];
  const counts = {};
  rows.forEach(r => {
    const day = r.created_at.slice(0, 10);
    counts[day] = (counts[day] || 0) + 1;
  });
  // Fill in missing days
  const result = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    result.push({ date: d, count: counts[d] || 0 });
  }
  return result;
}

// Total runs started
export async function statsTotalRuns() {
  return await sb("GET", "app_events?event=eq.run_start&select=id", null, { count: true });
}

// Runs by tier
export async function statsRunsByTier() {
  const rows = await sb("GET", "app_events?event=eq.run_start&select=meta") || [];
  const counts = { beginner: 0, intermediate: 0, expert: 0 };
  rows.forEach(r => { const t = r.meta?.tier; if (t && counts[t] !== undefined) counts[t]++; });
  return counts;
}

// Daily questions answered
export async function statsDailyAnswers() {
  const rows = await sb("GET", "app_events?event=eq.daily_answer&select=meta") || [];
  const correct = rows.filter(r => r.meta?.correct).length;
  return { total: rows.length, correct, incorrect: rows.length - correct };
}

// Top players by runs
export async function statsTopPlayers() {
  const rows = await sb("GET", "app_events?event=eq.run_complete&select=username,meta&order=created_at.desc&limit=500") || [];
  const counts = {};
  rows.forEach(r => {
    if (!r.username) return;
    if (!counts[r.username]) counts[r.username] = { runs: 0, sunrays: 0 };
    counts[r.username].runs++;
    counts[r.username].sunrays += r.meta?.sunrays || 0;
  });
  return Object.entries(counts)
    .map(([username, v]) => ({ username, ...v }))
    .sort((a, b) => b.runs - a.runs)
    .slice(0, 10);
}

// Recent events feed
export async function statsRecentEvents(limit = 20) {
  return await sb("GET", `app_events?order=created_at.desc&limit=${limit}&select=event,username,meta,created_at`) || [];
}
