-- Apply once to databases deployed before the quote attachment feature.
-- New databases already include the column in schema.sql.
ALTER TABLE contact_messages ADD COLUMN attachments TEXT NOT NULL DEFAULT '[]';
