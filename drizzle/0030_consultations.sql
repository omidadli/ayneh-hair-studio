-- Phase 1 — the beauty consultant. Additive only: consultations (saved analyses with the
-- customer's answers and ranked picks) plus ai_cache (dedup for vision results, keyed by a
-- hash of the photo bytes — never stores the photo itself).
CREATE TABLE IF NOT EXISTS consultations(
  id TEXT PRIMARY KEY,
  salon_id TEXT NOT NULL,
  owner TEXT NOT NULL, -- verified mobile only; guests never get a row (their result stays in-session)
  line TEXT NOT NULL,
  photo_id TEXT,
  analysis_json TEXT,
  answers_json TEXT,
  picks_json TEXT,
  result_id TEXT, -- the image she built from a pick, attached after generation
  share_hash TEXT, -- one-time stylist link: hash of the token, never the token itself
  share_hash_prev TEXT, -- the token replaced by a re-share: still answered with 410, never 404
  share_expires INTEGER,
  share_used_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS consultations_owner ON consultations(salon_id, owner, created_at);
-- Every /share/<token> lookup hashes the token and queries by it (and by the replaced token,
-- which must answer 410): both columns are looked up on every request, so both are indexed.
CREATE INDEX IF NOT EXISTS consultations_share_hash ON consultations(share_hash);
CREATE INDEX IF NOT EXISTS consultations_share_hash_prev ON consultations(share_hash_prev);
CREATE TABLE IF NOT EXISTS ai_cache(
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
