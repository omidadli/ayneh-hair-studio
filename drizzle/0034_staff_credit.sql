-- Pricing v2, owner's order (Nov 2026): a subscription grants credit worth half its price, in
-- toman (credit_ledger.line = 'pool', delta in toman), spent by any service at the single-image
-- price of that service. The manager may give each member a credit cap (team.credit_cap, toman;
-- NULL = no cap). Credit bought for one member (orders.staff_id → credit_ledger.staff_id) raises
-- that member's cap by its value. generations.staff_id: the member whose customer made the image.
ALTER TABLE credit_ledger ADD COLUMN staff_id TEXT;
ALTER TABLE team ADD COLUMN credit_cap INTEGER;
ALTER TABLE generations ADD COLUMN staff_id TEXT;
ALTER TABLE orders ADD COLUMN staff_id TEXT;
CREATE INDEX gen_staff ON generations(salon_id, staff_id);
