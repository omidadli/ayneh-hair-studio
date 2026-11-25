-- Studio consultant (owner's order, Nov 2026): each person's first photo analysis is free, every
-- later one costs CONSULT_COINS coins (customer_ledger reason 'consult', order_id = this row).
-- owner: 'p:'+mobile or 'v:'+browser id. Cache hits (the same photo again) are not recorded.
CREATE TABLE consult_uses(id TEXT PRIMARY KEY, salon_id TEXT NOT NULL, owner TEXT NOT NULL, line TEXT NOT NULL DEFAULT 'hair', paid_by TEXT, coins INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL);
CREATE INDEX consult_uses_owner ON consult_uses(owner);
