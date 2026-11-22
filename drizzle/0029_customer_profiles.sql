-- Customer accounts on the studio (ayneh-salon.site): sign-up keeps her name and city; saved and
-- liked looks follow her mobile once she signs in (or this browser's session before that).
ALTER TABLE otps ADD COLUMN city TEXT NOT NULL DEFAULT '';
CREATE TABLE IF NOT EXISTS customer_profiles(salon_id TEXT NOT NULL,phone TEXT NOT NULL,first_name TEXT NOT NULL,last_name TEXT NOT NULL,city TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,PRIMARY KEY(salon_id,phone));
CREATE TABLE IF NOT EXISTS customer_saves(salon_id TEXT NOT NULL,owner TEXT NOT NULL,kind TEXT NOT NULL,item TEXT NOT NULL,created_at INTEGER NOT NULL,PRIMARY KEY(salon_id,owner,kind,item));
CREATE INDEX IF NOT EXISTS customer_saves_item ON customer_saves(salon_id,kind,item);
