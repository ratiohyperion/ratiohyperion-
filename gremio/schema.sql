-- Base de datos del login gremio (Cloudflare D1, binding "DB")
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  empresa TEXT,
  cuit TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  pass_hash TEXT NOT NULL,
  pass_salt TEXT NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  verified_at INTEGER,
  last_login INTEGER
);
CREATE TABLE IF NOT EXISTS tokens (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  kind TEXT NOT NULL,            -- 'verify' | 'reset'
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS attempts (
  k TEXT NOT NULL,
  ts INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_attempts ON attempts(k, ts);
CREATE INDEX IF NOT EXISTS idx_sessions_exp ON sessions(expires_at);
