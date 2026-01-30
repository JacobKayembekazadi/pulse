// Vercel Serverless Function to proxy Apify API calls (avoids CORS)
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action, actorId, runId, datasetId } = req.query;
  // Check multiple env var names for flexibility
  const apiKey = req.headers['x-apify-token'] as string
    || process.env.APIFY_API_KEY
    || process.env.VITE_APIFY_API_KEY;

  if (!apiKey) {
    return res.status(401).json({ error: 'No Apify API key provided' });
  }

  try {
    let url: string;
    let options: RequestInit = {
      headers: { 'Content-Type': 'application/json' }
    };

    switch (action) {
      case 'run':
        // Start an actor run
        url = `https://api.apify.com/v2/acts/${actorId}/runs?token=${apiKey}`;
        options.method = 'POST';
        options.body = JSON.stringify(req.body);
        break;

      case 'status':
        // Check run status
        url = `https://api.apify.com/v2/actor-runs/${runId}?token=${apiKey}`;
        options.method = 'GET';
        break;

      case 'results':
        // Get dataset results
        url = `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apiKey}`;
        options.method = 'GET';
        break;

      case 'test':
        // Test API key
        url = `https://api.apify.com/v2/users/me?token=${apiKey}`;
        options.method = 'GET';
        break;

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Apify proxy error:', error);
    return res.status(500).json({ error: 'Proxy request failed' });
  }
}
