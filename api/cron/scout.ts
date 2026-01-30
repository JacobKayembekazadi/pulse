// ============================================================================
// SCOUT CRON JOB
// Runs every 15 minutes to find new social posts
// ============================================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role key (bypasses RLS)
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

const APIFY_API_KEY = process.env.APIFY_API_KEY || process.env.VITE_APIFY_API_KEY;

// Apify actor IDs
const ACTORS = {
  reddit: 'trudax/reddit-scraper',
  twitter: 'apidojo/twitter-scraper',
  linkedin: 'curious_coder/linkedin-post-search-scraper',
};

interface ScoutResult {
  keyword: string;
  platform: string;
  newPosts: number;
  errors: string[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('Scout cron job starting...');

  // Verify this is a cron request (optional security)
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow in development or if no secret configured
    if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const results: ScoutResult[] = [];

  try {
    // 1. Get active keywords from database
    const { data: keywords, error: keywordsError } = await supabase
      .from('keywords')
      .select('*')
      .eq('is_active', true);

    if (keywordsError) {
      console.error('Error fetching keywords:', keywordsError);
      return res.status(500).json({ error: 'Failed to fetch keywords' });
    }

    if (!keywords || keywords.length === 0) {
      console.log('No active keywords found');
      return res.status(200).json({ message: 'No active keywords', results: [] });
    }

    console.log(`Found ${keywords.length} active keywords`);

    // 2. For each keyword, search relevant platforms
    for (const keywordRecord of keywords) {
      const { keyword, platforms } = keywordRecord;
      const result: ScoutResult = {
        keyword,
        platform: platforms.join(','),
        newPosts: 0,
        errors: [],
      };

      // Search Reddit (most reliable for now)
      if (platforms.includes('reddit') && APIFY_API_KEY) {
        try {
          const posts = await searchReddit(keyword);
          const saved = await saveProspects(posts, 'reddit', [keyword]);
          result.newPosts += saved;
          console.log(`Reddit: Found ${posts.length} posts, saved ${saved} new for "${keyword}"`);
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Reddit: ${msg}`);
          console.error(`Reddit search error for "${keyword}":`, error);
        }
      }

      // TODO: Add Twitter and LinkedIn when actors are configured
      // if (platforms.includes('twitter') && APIFY_API_KEY) { ... }
      // if (platforms.includes('linkedin') && APIFY_API_KEY) { ... }

      results.push(result);
    }

    // 3. Return summary
    const totalNew = results.reduce((sum, r) => sum + r.newPosts, 0);
    console.log(`Scout complete. Total new prospects: ${totalNew}`);

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      totalNewProspects: totalNew,
      results,
    });
  } catch (error) {
    console.error('Scout cron job failed:', error);
    return res.status(500).json({
      error: 'Scout failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// ============================================================================
// REDDIT SEARCH
// ============================================================================

async function searchReddit(keyword: string): Promise<any[]> {
  if (!APIFY_API_KEY) {
    throw new Error('Apify API key not configured');
  }

  // Start the Reddit scraper actor
  const runResponse = await fetch(
    `https://api.apify.com/v2/acts/${ACTORS.reddit}/runs?token=${APIFY_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        searchQueries: [keyword],
        sort: 'new',
        maxItems: 25,
        maxPostCount: 25,
        proxy: { useApifyProxy: true },
      }),
    }
  );

  if (!runResponse.ok) {
    throw new Error(`Apify run failed: ${runResponse.statusText}`);
  }

  const runData = await runResponse.json();
  const runId = runData.data?.id;

  if (!runId) {
    throw new Error('No run ID returned from Apify');
  }

  // Poll for completion (max 60 seconds for cron)
  let attempts = 0;
  while (attempts < 30) {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const statusResponse = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_API_KEY}`
    );
    const statusData = await statusResponse.json();

    if (statusData.data?.status === 'SUCCEEDED') {
      // Get results
      const datasetId = statusData.data.defaultDatasetId;
      const resultsResponse = await fetch(
        `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_API_KEY}`
      );
      return await resultsResponse.json();
    }

    if (statusData.data?.status === 'FAILED' || statusData.data?.status === 'ABORTED') {
      throw new Error(`Apify actor ${statusData.data.status}`);
    }

    attempts++;
  }

  throw new Error('Apify actor timeout');
}

// ============================================================================
// SAVE PROSPECTS
// ============================================================================

async function saveProspects(
  posts: any[],
  platform: string,
  keywords: string[]
): Promise<number> {
  let savedCount = 0;

  for (const post of posts) {
    // Normalize post data based on platform
    const prospect = normalizePost(post, platform, keywords);

    if (!prospect) continue;

    // Upsert (insert or skip if exists)
    const { error } = await supabase.from('prospects').upsert(
      {
        external_id: prospect.external_id,
        platform: prospect.platform,
        state: 'discovered',
        author_data: prospect.author_data,
        post_data: prospect.post_data,
        matched_keywords: prospect.matched_keywords,
      },
      { onConflict: 'external_id', ignoreDuplicates: true }
    );

    if (!error) {
      savedCount++;
    }
  }

  return savedCount;
}

function normalizePost(raw: any, platform: string, keywords: string[]) {
  if (platform === 'reddit') {
    // Skip if no meaningful content
    if (!raw.title && !raw.body && !raw.selftext) {
      return null;
    }

    return {
      external_id: `reddit_${raw.id || raw.postId || Date.now()}`,
      platform: 'reddit',
      author_data: {
        name: raw.author || 'Unknown',
        handle: raw.author || 'unknown',
        karma: raw.authorKarma || raw.author_karma || 0,
      },
      post_data: {
        title: raw.title || '',
        body: raw.body || raw.selftext || '',
        url: raw.url || raw.permalink ? `https://reddit.com${raw.permalink}` : '',
        subreddit: raw.subreddit || raw.communityName || '',
        score: raw.score || raw.ups || 0,
        created: raw.createdAt || raw.created_utc,
        engagement: {
          likes: raw.score || raw.ups || 0,
          comments: raw.numComments || raw.num_comments || 0,
          shares: 0,
        },
      },
      matched_keywords: keywords,
    };
  }

  // Add Twitter and LinkedIn normalizers as needed
  return null;
}
