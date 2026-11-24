-- Pricing v2 (owner's decision, Nov 2026): image credits are per service line.
-- Additive only; nothing is rewritten.
--
-- credit_ledger.line: the service the credit can be spent on (hair | color | nails | lashes).
--   NULL = an older credit (plan gift, top-up, referral reward) that any line of the salon may
--   spend, exactly as before this migration. worker/credits.js balance() spends a line's own
--   credits first, then the shared (NULL) pool.
-- orders.line: the line an order's image credits go to ('' = none, or a legacy order whose
--   credits are shared). Path 1 («فقط ساخت تصویر», kind 'images'), a subscriber pack (kind
--   'pack') and a subscription bought together with its first pack (kind 'plan') all set it.
ALTER TABLE credit_ledger ADD COLUMN line TEXT;
--> statement-breakpoint
ALTER TABLE orders ADD COLUMN line TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
CREATE INDEX credit_ledger_salon_line ON credit_ledger(salon_id, line);
