-- Phase 2 — pro hair colour. Additive only: the stylist's colour formula cards and the
-- brand-shade table that links a catalog colour to a real brand shade code.
-- color_formulas: one row per customer's formula card (brand, code, amount, oxidant,
-- pauses per zone, note). The draft suggestion is stored with the row it came from.
CREATE TABLE IF NOT EXISTS color_formulas(
  id TEXT PRIMARY KEY,
  salon_id TEXT NOT NULL,
  customer_phone TEXT NOT NULL, -- a customer of this salon (leads with staff_id NULL)
  target_color TEXT NOT NULL, -- the colour the formula is for
  current_color TEXT,
  brand TEXT,
  code TEXT,
  amounts TEXT, -- JSON list of {name, code, amount}
  oxidant_percent TEXT, -- '3' | '6' | '9' | '12'
  oxidant_ratio TEXT, -- '1:1' | '1:1.5' | '1:2'
  pause_root INTEGER, -- minutes the colour stays on the roots
  pause_shaft INTEGER, -- minutes on the shaft
  pause_top INTEGER, -- minutes on the top/ends
  note TEXT,
  source TEXT NOT NULL DEFAULT 'draft', -- 'suggestion' (model or rule draft) or 'manual'
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS color_formulas_salon ON color_formulas(salon_id, created_at);
-- One card per customer phone per salon: the check-then-insert in color.js cannot
-- duplicate a row even under concurrent saves.
CREATE UNIQUE INDEX IF NOT EXISTS color_formulas_salon_phone ON color_formulas(salon_id, customer_phone);
-- brand_shades: a catalog colour linked to a real Iranian brand shade code (owner-editable
-- table in /admin). `link` is an optional shop link («کجا بخرم»).
CREATE TABLE IF NOT EXISTS brand_shades(
  id TEXT PRIMARY KEY,
  color TEXT NOT NULL, -- a colour name from the catalog (worker/lines.js COLOR_STYLES)
  brand TEXT NOT NULL,
  code TEXT NOT NULL,
  note TEXT,
  link TEXT, -- optional shop link, validated as http(s)
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS brand_shades_color ON brand_shades(color);
