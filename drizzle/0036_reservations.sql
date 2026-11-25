-- «درخواست رزرو جایگاه» (owner, Nov 2026): when the month's capacity is full, a professional
-- leaves name, family name, mobile and role; the owner sees them in /admin.
CREATE TABLE reservations(id TEXT PRIMARY KEY, first_name TEXT NOT NULL, last_name TEXT NOT NULL, phone TEXT NOT NULL, role TEXT NOT NULL, line TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'new', created_at INTEGER NOT NULL);
CREATE UNIQUE INDEX reservations_phone ON reservations(phone);
