-- A forwarded bank message that could not be read as a deposit keeps its wording with every digit
-- masked (#), so the owner can see what the bank app actually sent and the parser can follow it.
-- Read deposits keep no text at all.
ALTER TABLE pay_sms ADD COLUMN sample TEXT NOT NULL DEFAULT '';
