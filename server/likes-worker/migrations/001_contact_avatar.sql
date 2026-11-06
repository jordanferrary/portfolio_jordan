-- Run only if contact_messages already exists from a previous deployment.
-- New deployments use schema.sql, which already contains this column.
ALTER TABLE contact_messages ADD COLUMN avatar TEXT;
