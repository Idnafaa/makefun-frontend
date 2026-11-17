// Read-only client for make.fun's public API (GET only, CORS-open).
// Answers are cached in memory and in sessionStorage for 60 s, and revalidated
// with the API's minute-bound ETags so a view rarely refetches unchanged data.

const API = 'https://make.fun/api';
const TTL = 60_000;
const memory = new Map();

function cacheGet(key) {
  const hit = memory.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.body;
  try {
    const raw = sessionStorage.getItem('mf:' + key);
    if (raw) {
      const saved = JSON.parse(raw);
      if (Date.now() - saved.at < TTL) { memory.set(key, saved); return saved.body; }
    }
  } catch { /* storage unavailable: fetch live */ }
  return null;
}

function cachePut(key, body, etag) {
  const entry = { at: Date.now(), body, etag };
  memory.set(key, entry);
  try { sessionStorage.setItem('mf:' + key, JSON.stringify(entry)); } catch { /* ignore */ }
}

async function get(path) {
  const cached = cacheGet(path);
  if (cached) return cached;
  const etag = memory.get(path)?.etag;
  const res = await fetch(API + path, etag ? { headers: { 'If-None-Match': etag } } : undefined);
  if (res.status === 304) {
    const body = memory.get(path).body;
    cachePut(path, body, etag);
    return body;
  }
  if (!res.ok) throw new Error(`make.fun API ${res.status} for ${path}`);
  const body = await res.json();
  cachePut(path, body, res.headers.get('etag'));
  return body;
}

/** Live bounties, newest activity first. */
export const listBounties = () => get('/competitions?status=open&activity=times');

/** One bounty, by slug. */
export const oneBounty = (slug) => get(`/competitions/${encodeURIComponent(slug)}`);

/** A bounty's leaderboard rows (entries array, ranked). */
export const leaderboard = (slug) => get(`/competitions/${encodeURIComponent(slug)}/leaderboard`);

/** An account's public profile, by handle. */
export const profile = (handle) => get(`/profiles/${encodeURIComponent(handle)}`);
