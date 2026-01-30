-- ============================================================================
-- PULSE/NEXUS DATABASE SCHEMA
-- Run this in Supabase SQL Editor to set up the database
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROSPECTS TABLE
-- Main pipeline table for tracking social posts through the funnel
-- ============================================================================

CREATE TABLE IF NOT EXISTS prospects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id TEXT UNIQUE NOT NULL,           -- Reddit post ID, Tweet ID, etc.
  platform TEXT NOT NULL CHECK (platform IN ('reddit', 'twitter', 'linkedin', 'bluesky', 'news', 'web')),
  state TEXT NOT NULL DEFAULT 'discovered' CHECK (state IN (
    'discovered',
    'qualified',
    'researched',
    'drafted',
    'pending_human',
    'approved',
    'sent',
    'rejected'
  )),

  -- Source data
  author_data JSONB NOT NULL DEFAULT '{}',    -- {name, handle, karma, followers, title, avatarUrl}
  post_data JSONB NOT NULL DEFAULT '{}',      -- {title, body, url, subreddit, score, engagement}

  -- Pipeline data (populated as prospect moves through stages)
  qualification_data JSONB,                   -- {score, reasons, icpMatch, buyingSignals}
  research_data JSONB,                        -- {company, role, talkingPoints, recentActivity}
  draft_message TEXT,                         -- AI-generated reply
  review_notes TEXT,                          -- Human feedback/notes

  -- Metadata
  matched_keywords TEXT[] DEFAULT '{}',
  quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_prospects_state ON prospects(state);
CREATE INDEX IF NOT EXISTS idx_prospects_platform ON prospects(platform);
CREATE INDEX IF NOT EXISTS idx_prospects_created_at ON prospects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prospects_external_id ON prospects(external_id);

-- ============================================================================
-- KEYWORDS TABLE
-- Keywords to monitor across platforms
-- ============================================================================

CREATE TABLE IF NOT EXISTS keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword TEXT NOT NULL,
  platforms TEXT[] DEFAULT '{reddit,twitter,linkedin}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_keywords_active ON keywords(is_active) WHERE is_active = true;

-- ============================================================================
-- COMMUNITIES TABLE
-- Specific subreddits, LinkedIn groups, etc. to watch
-- ============================================================================

CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform TEXT NOT NULL CHECK (platform IN ('reddit', 'twitter', 'linkedin', 'bluesky')),
  name TEXT NOT NULL,                         -- r/sales, r/startups, etc.
  url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_communities_active ON communities(is_active) WHERE is_active = true;

-- ============================================================================
-- SENT MESSAGES TABLE
-- Track messages that were sent (for analytics and preventing duplicates)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sent_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prospect_id UUID REFERENCES prospects(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  platform TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  response_received BOOLEAN DEFAULT false,
  response_data JSONB
);

CREATE INDEX IF NOT EXISTS idx_sent_messages_prospect ON sent_messages(prospect_id);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- Automatically update the updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_prospects_updated_at
  BEFORE UPDATE ON prospects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- For multi-tenant setup (optional - enable when adding auth)
-- ============================================================================

-- Uncomment these when you add authentication:
-- ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sent_messages ENABLE ROW LEVEL SECURITY;

-- Example policy (requires user_id column):
-- CREATE POLICY "Users can only see their own prospects"
--   ON prospects FOR ALL
--   USING (auth.uid() = user_id);

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

-- Insert some default keywords
INSERT INTO keywords (keyword, platforms) VALUES
  ('looking for CRM', '{reddit,twitter,linkedin}'),
  ('sales automation', '{reddit,twitter,linkedin}'),
  ('outbound tools', '{reddit,linkedin}')
ON CONFLICT DO NOTHING;

-- Insert some communities to watch
INSERT INTO communities (platform, name, url) VALUES
  ('reddit', 'r/sales', 'https://reddit.com/r/sales'),
  ('reddit', 'r/startups', 'https://reddit.com/r/startups'),
  ('reddit', 'r/SaaS', 'https://reddit.com/r/SaaS'),
  ('reddit', 'r/Entrepreneur', 'https://reddit.com/r/Entrepreneur')
ON CONFLICT DO NOTHING;
