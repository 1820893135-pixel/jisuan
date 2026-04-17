export const schemaSql = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id TEXT NOT NULL,
  poi_id TEXT NOT NULL,
  city TEXT NOT NULL,
  poi_name TEXT NOT NULL,
  poi_type TEXT NOT NULL,
  poi_description TEXT NOT NULL,
  location_lng REAL NOT NULL,
  location_lat REAL NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, poi_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_created_at
ON favorites(user_id, created_at DESC);
`;
