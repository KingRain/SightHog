ALTER TABLE sighthog.events ADD COLUMN IF NOT EXISTS country LowCardinality(String) DEFAULT 'Unknown';
ALTER TABLE sighthog.events ADD COLUMN IF NOT EXISTS visitor_id String DEFAULT '';
ALTER TABLE sighthog.events ADD COLUMN IF NOT EXISTS browser LowCardinality(String) DEFAULT 'Unknown';
ALTER TABLE sighthog.events ADD COLUMN IF NOT EXISTS os LowCardinality(String) DEFAULT 'Unknown';
ALTER TABLE sighthog.events ADD COLUMN IF NOT EXISTS referrer String DEFAULT '';
