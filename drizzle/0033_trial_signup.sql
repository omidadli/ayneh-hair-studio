-- Free signup for beauty professionals (owner's decision, Nov 2026): a new professional signs up
-- with name + mobile and gets a page with 3 free images; when they run out, a popup sends them to
-- /pricing, where the purchase goes to the same mobile and the same page (no form).
-- Additive only.
--
-- trials.buy_token_hash: hash of the random token in the HttpOnly cookie «ayneh_trial» set at
--   signup; /pricing uses it to know who is buying (worker/trial.js trialByToken).
-- trials.line: the service chosen at signup (hair | color | nails | lashes) — opens /pricing on it.
-- trials.converted_at: when a paid order turned the free page into a paid salon (same salon id).
ALTER TABLE trials ADD COLUMN buy_token_hash TEXT;
--> statement-breakpoint
ALTER TABLE trials ADD COLUMN line TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE trials ADD COLUMN converted_at INTEGER;
--> statement-breakpoint
CREATE INDEX trials_buy_token ON trials(buy_token_hash);
