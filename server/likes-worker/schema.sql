CREATE TABLE IF NOT EXISTS likes (
 project_id TEXT NOT NULL,
 visitor_id TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (project_id, visitor_id)
);
CREATE INDEX IF NOT EXISTS likes_project_id ON likes (project_id);

CREATE TABLE IF NOT EXISTS contact_messages (
 id TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 email TEXT NOT NULL,
 interests TEXT NOT NULL,
 message TEXT NOT NULL,
 avatar TEXT,
 is_read INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS contacts_unread ON contact_messages(is_read,created_at);
CREATE TABLE IF NOT EXISTS contact_limits (
 visitor_hash TEXT NOT NULL,
 hour_bucket INTEGER NOT NULL,
 attempts INTEGER NOT NULL,
 PRIMARY KEY (visitor_hash,hour_bucket)
);
