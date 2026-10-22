-- プレイ数（D1）。匿名のプレイIDとキャンパスだけを持つ。IPアドレス・学部・家計は保存しない。
-- ローカル：npm run db:local   本番：npx wrangler d1 execute tonpei-18000 --remote --file schema.sql

CREATE TABLE IF NOT EXISTS counters (
  key TEXT PRIMARY KEY,
  n INTEGER NOT NULL DEFAULT 0
);
INSERT OR IGNORE INTO counters (key, n) VALUES ('entered', 0), ('finished', 0);

-- 「いま◯◯で学んでいる人」を数えるためのプレイごとの行
CREATE TABLE IF NOT EXISTS plays (
  id TEXT PRIMARY KEY,
  campus TEXT,
  updated_at INTEGER NOT NULL,
  finished INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS plays_active ON plays (finished, updated_at);
