// ============================================================================
// TEST ENDPOINT
// Verify environment variables and API configuration
// ============================================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const config = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    configured: {
      supabase: {
        url: !!process.env.SUPABASE_URL || !!process.env.VITE_SUPABASE_URL,
        serviceKey: !!process.env.SUPABASE_SERVICE_KEY,
        anonKey: !!process.env.VITE_SUPABASE_ANON_KEY,
      },
      apify: !!process.env.APIFY_API_KEY || !!process.env.VITE_APIFY_API_KEY,
      gemini: !!process.env.VITE_GEMINI_API_KEY,
      cronSecret: !!process.env.CRON_SECRET,
    },
    ready: false,
  };

  // Check if minimum config is present
  config.ready =
    (config.configured.supabase.url && config.configured.supabase.anonKey) ||
    config.configured.apify ||
    config.configured.gemini;

  res.status(200).json(config);
}
