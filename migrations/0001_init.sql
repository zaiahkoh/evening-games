CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  player_name TEXT NOT NULL,
  series_id TEXT NOT NULL,
  started_at_ms INTEGER NOT NULL,
  finished_at_ms INTEGER
);

CREATE TABLE IF NOT EXISTS run_guesses (
  run_id TEXT NOT NULL,
  challenge_id TEXT NOT NULL,
  attempt INTEGER NOT NULL,
  guess TEXT NOT NULL,
  feedback TEXT NOT NULL,
  created_at_ms INTEGER NOT NULL,
  PRIMARY KEY (run_id, challenge_id, attempt),
  FOREIGN KEY (run_id) REFERENCES runs (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT NOT NULL UNIQUE,
  player_name TEXT NOT NULL,
  series_id TEXT NOT NULL,
  solved_count INTEGER NOT NULL,
  total_challenges INTEGER NOT NULL,
  total_guesses INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL,
  created_at_ms INTEGER NOT NULL,
  FOREIGN KEY (run_id) REFERENCES runs (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_scores_rank
  ON scores (series_id, solved_count DESC, total_guesses ASC, duration_ms ASC);
