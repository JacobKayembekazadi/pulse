// Vercel Serverless Function to proxy OpenAI API calls (avoids CORS)
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get API key from header or environment
  const authHeader = req.headers.authorization;
  const apiKey = authHeader?.replace('Bearer ', '') || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(401).json({ error: 'No OpenAI API key provided' });
  }

  try {
    const { endpoint = 'chat/completions', ...body } = req.body;

    // Validate endpoint to prevent arbitrary URL access
    const allowedEndpoints = ['chat/completions', 'completions', 'embeddings', 'models'];
    if (!allowedEndpoints.includes(endpoint)) {
      return res.status(400).json({ error: 'Invalid endpoint' });
    }

    const response = await fetch(`https://api.openai.com/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('OpenAI proxy error:', error);
    return res.status(500).json({ error: 'Proxy request failed' });
  }
}
