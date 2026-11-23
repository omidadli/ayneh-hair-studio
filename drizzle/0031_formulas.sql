-- Phase 2 — pro hair colour: the stylist's formula cards.
-- Additive: only new tables, no changes to existing ones.
CREATE TABLE IF NOT EXISTS color_formulas (
  id TEXT PRIMARY KEY,
  salon_id TEXT NOT NULL REFERENCES salons(id),
  session_id TEXT,
  customer_phone TEXT NOT NULL,
  target_color TEXT NOT NULL,
  current_color TEXT,
  brand TEXT,
  code TEXT,
  amounts TEXT NOT NULL DEFAULT '[]',
  oxidant_percent TEXT NOT NULL,
  oxidant_ratio TEXT NOT NULL,
  pause_root INTEGER,
  pause_shaft INTEGER,
  pause_top INTEGER,
  note TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at INTEGER NOT NULL,
  UNIQUE(salon_id,customer_phone)
);
CREATE INDEX IF NOT EXISTS idx_formulas_salon_phone ON color_formulas(salon_id,customer_phone);
