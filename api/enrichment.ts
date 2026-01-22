// Vercel Serverless Function to proxy enrichment API calls (Clearbit, Apollo, Hunter)
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { provider, action } = req.query;

  // Get API keys from environment
  const clearbitKey = process.env.CLEARBIT_API_KEY;
  const apolloKey = process.env.APOLLO_API_KEY;
  const hunterKey = process.env.HUNTER_API_KEY;

  try {
    switch (provider) {
      case 'clearbit': {
        if (!clearbitKey) {
          return res.status(401).json({ error: 'Clearbit API key not configured' });
        }

        if (action === 'company') {
          const { domain } = req.query;
          if (!domain) {
            return res.status(400).json({ error: 'Domain required' });
          }

          const response = await fetch(
            `https://company.clearbit.com/v2/companies/find?domain=${domain}`,
            {
              headers: {
                'Authorization': `Bearer ${clearbitKey}`
              }
            }
          );

          if (response.status === 404) {
            return res.status(404).json({ error: 'Company not found' });
          }

          if (!response.ok) {
            return res.status(response.status).json({ error: 'Clearbit API error' });
          }

          const data = await response.json();
          return res.status(200).json(formatClearbitCompany(data));
        }
        break;
      }

      case 'apollo': {
        if (!apolloKey) {
          return res.status(401).json({ error: 'Apollo API key not configured' });
        }

        if (action === 'company') {
          const { domain } = req.query;
          if (!domain) {
            return res.status(400).json({ error: 'Domain required' });
          }

          const response = await fetch(
            'https://api.apollo.io/v1/organizations/enrich',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
              },
              body: JSON.stringify({
                api_key: apolloKey,
                domain
              })
            }
          );

          if (!response.ok) {
            return res.status(response.status).json({ error: 'Apollo API error' });
          }

          const data = await response.json();
          if (!data.organization) {
            return res.status(404).json({ error: 'Company not found' });
          }

          return res.status(200).json(formatApolloCompany(data.organization));
        }

        if (action === 'contacts') {
          const { domain, roles } = req.body || {};
          if (!domain) {
            return res.status(400).json({ error: 'Domain required' });
          }

          const response = await fetch(
            'https://api.apollo.io/v1/mixed_people/search',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
              },
              body: JSON.stringify({
                api_key: apolloKey,
                q_organization_domains: domain,
                person_titles: roles || ['CTO', 'VP Engineering', 'Head of Engineering'],
                per_page: 10
              })
            }
          );

          if (!response.ok) {
            return res.status(response.status).json({ error: 'Apollo API error' });
          }

          const data = await response.json();
          return res.status(200).json({
            contacts: (data.people || []).map(formatApolloContact)
          });
        }
        break;
      }

      case 'hunter': {
        if (!hunterKey) {
          return res.status(401).json({ error: 'Hunter API key not configured' });
        }

        if (action === 'find') {
          const { domain, firstName, lastName } = req.query;
          if (!domain || !firstName || !lastName) {
            return res.status(400).json({ error: 'Domain, firstName, and lastName required' });
          }

          const response = await fetch(
            `https://api.hunter.io/v2/email-finder?domain=${domain}&first_name=${firstName}&last_name=${lastName}&api_key=${hunterKey}`
          );

          if (!response.ok) {
            return res.status(response.status).json({ error: 'Hunter API error' });
          }

          const data = await response.json();
          if (!data.data?.email) {
            return res.status(404).json({ error: 'Email not found' });
          }

          return res.status(200).json({
            email: data.data.email,
            emailVerified: data.data.verification?.status === 'valid',
            confidence: data.data.score
          });
        }

        if (action === 'verify') {
          const { email } = req.query;
          if (!email) {
            return res.status(400).json({ error: 'Email required' });
          }

          const response = await fetch(
            `https://api.hunter.io/v2/email-verifier?email=${email}&api_key=${hunterKey}`
          );

          if (!response.ok) {
            return res.status(response.status).json({ error: 'Hunter API error' });
          }

          const data = await response.json();
          return res.status(200).json({
            valid: data.data?.result === 'deliverable',
            disposable: data.data?.disposable || false,
            score: data.data?.score || 0
          });
        }
        break;
      }

      default:
        return res.status(400).json({ error: 'Invalid provider. Use: clearbit, apollo, or hunter' });
    }

    return res.status(400).json({ error: 'Invalid action for provider' });
  } catch (error) {
    console.error('Enrichment proxy error:', error);
    return res.status(500).json({ error: 'Proxy request failed' });
  }
}

// Format Clearbit company response
function formatClearbitCompany(data: any) {
  return {
    name: data.name,
    domain: data.domain,
    logo: data.logo,
    description: data.description,
    industry: data.category?.industry,
    employeeCount: formatEmployeeRange(data.metrics?.employees),
    location: [data.location, data.geo?.country].filter(Boolean).join(', '),
    founded: data.foundedYear,
    linkedinUrl: data.linkedin?.handle ? `https://linkedin.com/company/${data.linkedin.handle}` : undefined,
    twitterHandle: data.twitter?.handle,
    techStack: data.tech || [],
    funding: data.metrics?.raised ? { total: data.metrics.raised } : undefined
  };
}

// Format Apollo company response
function formatApolloCompany(org: any) {
  return {
    name: org.name,
    domain: org.primary_domain,
    logo: org.logo_url,
    description: org.short_description,
    industry: org.industry,
    employeeCount: formatEmployeeRange(org.estimated_num_employees),
    location: [org.city, org.state, org.country].filter(Boolean).join(', '),
    founded: org.founded_year,
    linkedinUrl: org.linkedin_url,
    twitterHandle: org.twitter_url?.split('/').pop()
  };
}

// Format Apollo contact response
function formatApolloContact(person: any) {
  return {
    firstName: person.first_name,
    lastName: person.last_name,
    email: person.email,
    title: person.title,
    linkedinUrl: person.linkedin_url,
    seniority: person.seniority,
    department: person.department
  };
}

// Format employee count to range
function formatEmployeeRange(count: number | undefined): string | undefined {
  if (!count) return undefined;
  if (count < 10) return '1-10';
  if (count < 50) return '11-50';
  if (count < 200) return '51-200';
  if (count < 500) return '201-500';
  if (count < 1000) return '501-1000';
  if (count < 5000) return '1001-5000';
  return '5000+';
}
