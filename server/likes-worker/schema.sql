CREATE TABLE IF NOT EXISTS likes (
 project_id TEXT NOT NULL,
 visitor_id TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (project_id, visitor_id)
);
CREATE INDEX IF NOT EXISTS likes_project_id ON likes (project_id);
