-- Sign-in by mobile (the studio's «ورود یا ثبت‌نام») looks a mobile up across sessions.
CREATE INDEX IF NOT EXISTS sessions_verified_phone ON sessions(verified_phone);
