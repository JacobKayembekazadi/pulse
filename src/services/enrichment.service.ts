// ============================================================================
// ENRICHMENT SERVICE - Company & Contact Data Enrichment
// Integrates with Clearbit, Apollo, Hunter for production data
// ============================================================================

import { storage } from './storage.service';

export interface CompanyEnrichment {
  name: string;
  domain: string;
  logo?: string;
  description?: string;
  industry?: string;
  employeeCount?: string;
  location?: string;
  founded?: number;
  linkedinUrl?: string;
  twitterHandle?: string;
  techStack?: string[];
  funding?: {
    total?: number;
    lastRound?: string;
    lastRoundDate?: string;
  };
}

export interface ContactEnrichment {
  email?: string;
  emailVerified?: boolean;
  linkedinUrl?: string;
  title?: string;
  seniority?: string;
  department?: string;
  phone?: string;
}

// Cache enrichment results to avoid repeated API calls
const enrichmentCache = new Map<string, { data: CompanyEnrichment; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

class EnrichmentService {
  private clearbitKey: string | null = null;
  private apolloKey: string | null = null;
  private hunterKey: string | null = null;

  constructor() {
    this.loadKeys();
  }

  private loadKeys() {
    // Load from environment variables
    this.clearbitKey = import.meta.env.VITE_CLEARBIT_API_KEY || null;
    this.apolloKey = import.meta.env.VITE_APOLLO_API_KEY || null;
    this.hunterKey = import.meta.env.VITE_HUNTER_API_KEY || null;
  }

  // Check if any enrichment service is configured
  isConfigured(): boolean {
    return !!(this.clearbitKey || this.apolloKey);
  }

  // Enrich company data by domain
  async enrichCompany(domain: string): Promise<CompanyEnrichment | null> {
    // Check cache first
    const cached = enrichmentCache.get(domain);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    // Try Clearbit first
    if (this.clearbitKey) {
      try {
        const data = await this.enrichFromClearbit(domain);
        if (data) {
          enrichmentCache.set(domain, { data, timestamp: Date.now() });
          return data;
        }
      } catch (error) {
        console.warn('Clearbit enrichment failed:', error);
      }
    }

    // Fallback to Apollo
    if (this.apolloKey) {
      try {
        const data = await this.enrichFromApollo(domain);
        if (data) {
          enrichmentCache.set(domain, { data, timestamp: Date.now() });
          return data;
        }
      } catch (error) {
        console.warn('Apollo enrichment failed:', error);
      }
    }

    return null;
  }

  // Clearbit Company API
  private async enrichFromClearbit(domain: string): Promise<CompanyEnrichment | null> {
    const response = await fetch(
      `https://company.clearbit.com/v2/companies/find?domain=${domain}`,
      {
        headers: {
          'Authorization': `Bearer ${this.clearbitKey}`
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Clearbit API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      name: data.name,
      domain: data.domain,
      logo: data.logo,
      description: data.description,
      industry: data.category?.industry,
      employeeCount: this.formatEmployeeRange(data.metrics?.employees),
      location: [data.location, data.geo?.country].filter(Boolean).join(', '),
      founded: data.foundedYear,
      linkedinUrl: data.linkedin?.handle ? `https://linkedin.com/company/${data.linkedin.handle}` : undefined,
      twitterHandle: data.twitter?.handle,
      techStack: data.tech || [],
      funding: data.metrics?.raised ? {
        total: data.metrics.raised
      } : undefined
    };
  }

  // Apollo Company API
  private async enrichFromApollo(domain: string): Promise<CompanyEnrichment | null> {
    const response = await fetch(
      'https://api.apollo.io/v1/organizations/enrich',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          api_key: this.apolloKey,
          domain
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Apollo API error: ${response.status}`);
    }

    const data = await response.json();
    const org = data.organization;

    if (!org) return null;

    return {
      name: org.name,
      domain: org.primary_domain,
      logo: org.logo_url,
      description: org.short_description,
      industry: org.industry,
      employeeCount: this.formatEmployeeRange(org.estimated_num_employees),
      location: [org.city, org.state, org.country].filter(Boolean).join(', '),
      founded: org.founded_year,
      linkedinUrl: org.linkedin_url,
      twitterHandle: org.twitter_url?.split('/').pop()
    };
  }

  // Find and verify email for a contact
  async findEmail(firstName: string, lastName: string, domain: string): Promise<ContactEnrichment | null> {
    if (!this.hunterKey) return null;

    try {
      const response = await fetch(
        `https://api.hunter.io/v2/email-finder?domain=${domain}&first_name=${firstName}&last_name=${lastName}&api_key=${this.hunterKey}`
      );

      if (!response.ok) return null;

      const data = await response.json();

      if (data.data?.email) {
        return {
          email: data.data.email,
          emailVerified: data.data.verification?.status === 'valid',
          linkedinUrl: data.data.linkedin,
          title: data.data.position,
          seniority: data.data.seniority,
          department: data.data.department,
          phone: data.data.phone_number
        };
      }
    } catch (error) {
      console.warn('Hunter email finder failed:', error);
    }

    return null;
  }

  // Verify an email address
  async verifyEmail(email: string): Promise<{ valid: boolean; disposable: boolean; score: number } | null> {
    if (!this.hunterKey) return null;

    try {
      const response = await fetch(
        `https://api.hunter.io/v2/email-verifier?email=${email}&api_key=${this.hunterKey}`
      );

      if (!response.ok) return null;

      const data = await response.json();

      return {
        valid: data.data?.result === 'deliverable',
        disposable: data.data?.disposable || false,
        score: data.data?.score || 0
      };
    } catch (error) {
      console.warn('Hunter email verification failed:', error);
      return null;
    }
  }

  // Helper to format employee count ranges
  private formatEmployeeRange(count: number | undefined): string | undefined {
    if (!count) return undefined;
    if (count < 10) return '1-10';
    if (count < 50) return '11-50';
    if (count < 200) return '51-200';
    if (count < 500) return '201-500';
    if (count < 1000) return '501-1000';
    if (count < 5000) return '1001-5000';
    if (count < 10000) return '5001-10000';
    return '10000+';
  }

  // Get company logo URL (with fallback to UI Avatars)
  getCompanyLogo(company: { name: string; domain?: string; logo?: string }): string {
    if (company.logo) return company.logo;
    if (company.domain) return `https://logo.clearbit.com/${company.domain}`;
    // Fallback to initial-based avatar
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&background=6366f1&color=fff&bold=true`;
  }
}

// Export singleton instance
export const enrichmentService = new EnrichmentService();
