// Vercel Serverless Function to proxy Anthropic API calls (avoids CORS)
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get API key from header or environment
  const apiKey = req.headers['x-api-key'] as string || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(401).json({ error: 'No Anthropic API key provided' });
  }

  try {
    const { endpoint = 'messages', ...body } = req.body;

    // Validate endpoint
    const allowedEndpoints = ['messages'];
    if (!allowedEndpoints.includes(endpoint)) {
      return res.status(400).json({ error: 'Invalid endpoint' });
    }

    const response = await fetch(`https://api.anthropic.com/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Anthropic proxy error:', error);
    return res.status(500).json({ error: 'Proxy request failed' });
  }
}
