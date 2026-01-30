// ============================================================================
// CAMPAIGN SERVICE - Campaign Management & Attribution
// Uses localStorage persistence via storage.service
// ============================================================================

import {
  Campaign, CampaignMetrics, CampaignStatus, CampaignType,
  Attribution, Touchpoint, Platform, TeamMember
} from '../types';
import { CampaignService, CreateCampaignInput } from './index';
import { storage } from './storage.service';

// Default team member for demo
const DEFAULT_USER: TeamMember = {
  id: 'user_1',
  email: 'user@example.com',
  name: 'Demo User',
  role: 'admin',
  permissions: ['manage_team', 'send_messages', 'view_analytics'],
  assignedAccounts: [],
  capacity: { maxAccounts: 100, currentAccounts: 3 },
  performance: { responsesThisWeek: 45, avgResponseTime: 12, meetingsBooked: 5 }
};

// Sample campaigns for initial state
const SAMPLE_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp_1',
    name: 'Q1 ABM Outreach',
    type: 'abm_outreach',
    status: 'active',
    targeting: {
      keywords: ['sales automation', 'revenue operations', 'ABM tools'],
      accounts: ['acc_1', 'acc_2'],
      personas: ['VP Sales', 'Head of RevOps'],
      platforms: ['linkedin', 'twitter']
    },
    templates: ['temp_1'],
    sops: ['sop_1'],
    dateRange: {
      start: new Date('2025-01-01'),
      end: new Date('2025-03-31')
    },
    metrics: {
      postsFound: 156,
      commentsGenerated: 89,
      commentsSent: 67,
      repliesReceived: 23,
      conversationsStarted: 12,
      meetingsBooked: 5,
      pipelineGenerated: 145000,
      revenueInfluenced: 45000
    },
    createdBy: DEFAULT_USER,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date()
  },
  {
    id: 'camp_2',
    name: 'Thought Leadership',
    type: 'community_engagement',
    status: 'active',
    targeting: {
      keywords: ['B2B sales', 'social selling', 'sales engagement'],
      accounts: [],
      personas: [],
      platforms: ['linkedin', 'twitter', 'reddit']
    },
    templates: ['temp_2'],
    sops: ['sop_2'],
    dateRange: {
      start: new Date('2025-01-15')
    },
    metrics: {
      postsFound: 342,
      commentsGenerated: 156,
      commentsSent: 134,
      repliesReceived: 45,
      conversationsStarted: 8,
      meetingsBooked: 2,
      pipelineGenerated: 52000,
      revenueInfluenced: 0
    },
    createdBy: DEFAULT_USER,
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date()
  },
  {
    id: 'camp_3',
    name: 'Competitor Monitoring',
    type: 'competitor_monitoring',
    status: 'active',
    targeting: {
      keywords: ['Outreach', 'Salesloft', 'Gong'],
      accounts: [],
      personas: [],
      platforms: ['linkedin', 'twitter', 'reddit']
    },
    templates: [],
    sops: ['sop_3'],
    dateRange: {
      start: new Date('2025-01-01')
    },
    metrics: {
      postsFound: 89,
      commentsGenerated: 23,
      commentsSent: 18,
      repliesReceived: 7,
      conversationsStarted: 3,
      meetingsBooked: 1,
      pipelineGenerated: 35000,
      revenueInfluenced: 0
    },
    createdBy: DEFAULT_USER,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date()
  }
];

// In-memory cache
let campaigns: Campaign[] = [];

// Initialize from localStorage or use sample data
const loadFromStorage = () => {
  const saved = storage.get<Campaign[]>('nexus-campaigns', []);
  if (saved.length > 0) {
    // Restore Date objects
    campaigns = saved.map(c => ({
      ...c,
      dateRange: {
        start: new Date(c.dateRange.start),
        end: c.dateRange.end ? new Date(c.dateRange.end) : undefined
      },
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt)
    }));
  } else {
    campaigns = SAMPLE_CAMPAIGNS;
    storage.set('nexus-campaigns', campaigns);
  }
};

loadFromStorage();

const saveToStorage = () => {
  storage.set('nexus-campaigns', campaigns);
};

export class LocalCampaignService implements CampaignService {

  async getCampaigns(status?: CampaignStatus[]): Promise<Campaign[]> {
    if (!status || status.length === 0) {
      return campaigns;
    }
    return campaigns.filter(c => status.includes(c.status));
  }

  async getCampaign(id: string): Promise<Campaign | null> {
    return campaigns.find(c => c.id === id) || null;
  }

  async createCampaign(data: CreateCampaignInput): Promise<Campaign> {
    const now = new Date();
    const campaign: Campaign = {
      id: storage.generateId(),
      name: data.name,
      type: data.type,
      status: 'draft',
      targeting: data.targeting,
      templates: data.templates || [],
      sops: data.sops || [],
      dateRange: {
        start: data.startDate || now,
        end: data.endDate
      },
      metrics: {
        postsFound: 0,
        commentsGenerated: 0,
        commentsSent: 0,
        repliesReceived: 0,
        conversationsStarted: 0,
        meetingsBooked: 0,
        pipelineGenerated: 0,
        revenueInfluenced: 0
      },
      createdBy: DEFAULT_USER,
      createdAt: now,
      updatedAt: now
    };

    campaigns.push(campaign);
    saveToStorage();
    return campaign;
  }

  async updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign> {
    const index = campaigns.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Campaign not found');

    const updated = {
      ...campaigns[index],
      ...data,
      updatedAt: new Date()
    };
    campaigns[index] = updated;
    saveToStorage();
    return updated;
  }

  async deleteCampaign(id: string): Promise<void> {
    const index = campaigns.findIndex(c => c.id === id);
    if (index !== -1) {
      campaigns.splice(index, 1);
      saveToStorage();
    }
  }

  async launchCampaign(id: string): Promise<void> {
    await this.updateCampaign(id, { status: 'active' });
  }

  async pauseCampaign(id: string): Promise<void> {
    await this.updateCampaign(id, { status: 'paused' });
  }

  async completeCampaign(id: string): Promise<void> {
    await this.updateCampaign(id, { status: 'completed' });
  }

  async getCampaignMetrics(id: string): Promise<CampaignMetrics> {
    const campaign = await this.getCampaign(id);
    if (!campaign) throw new Error('Campaign not found');
    return campaign.metrics;
  }

  async getAttribution(campaignId: string): Promise<Attribution[]> {
    // Return mock attribution data for the campaign
    const campaign = await this.getCampaign(campaignId);
    if (!campaign) return [];

    const touchpoints: Touchpoint[] = [
      {
        type: 'social_comment',
        channel: 'linkedin',
        campaignId,
        description: 'Initial engagement on LinkedIn post',
        timestamp: new Date(Date.now() - 7 * 86400000),
        weight: 0.3
      },
      {
        type: 'social_reply',
        channel: 'linkedin',
        campaignId,
        description: 'Reply received and follow-up',
        timestamp: new Date(Date.now() - 5 * 86400000),
        weight: 0.4
      },
      {
        type: 'meeting',
        channel: 'meeting',
        campaignId,
        description: 'Demo call scheduled',
        timestamp: new Date(Date.now() - 2 * 86400000),
        weight: 0.3
      }
    ];

    return campaign.targeting.accounts.map((accountId, idx) => ({
      id: `attr_${campaignId}_${idx}`,
      accountId,
      touchpoints,
      model: 'linear' as const,
      totalValue: campaign.metrics.pipelineGenerated / Math.max(campaign.targeting.accounts.length, 1),
      createdAt: new Date()
    }));
  }

  // Helper to update campaign metrics
  async incrementMetric(
    id: string,
    metric: keyof CampaignMetrics,
    amount: number = 1
  ): Promise<void> {
    const campaign = await this.getCampaign(id);
    if (!campaign) return;

    const metrics = { ...campaign.metrics };
    metrics[metric] = (metrics[metric] || 0) + amount;

    await this.updateCampaign(id, { metrics });
  }

  // Get all campaigns for a specific account
  async getCampaignsForAccount(accountId: string): Promise<Campaign[]> {
    return campaigns.filter(c =>
      c.targeting.accounts.includes(accountId)
    );
  }

  // Get aggregate metrics across all campaigns
  async getAggregateMetrics(): Promise<CampaignMetrics> {
    return campaigns.reduce((acc, c) => ({
      postsFound: acc.postsFound + c.metrics.postsFound,
      commentsGenerated: acc.commentsGenerated + c.metrics.commentsGenerated,
      commentsSent: acc.commentsSent + c.metrics.commentsSent,
      repliesReceived: acc.repliesReceived + c.metrics.repliesReceived,
      conversationsStarted: acc.conversationsStarted + c.metrics.conversationsStarted,
      meetingsBooked: acc.meetingsBooked + c.metrics.meetingsBooked,
      pipelineGenerated: acc.pipelineGenerated + c.metrics.pipelineGenerated,
      revenueInfluenced: acc.revenueInfluenced + c.metrics.revenueInfluenced
    }), {
      postsFound: 0,
      commentsGenerated: 0,
      commentsSent: 0,
      repliesReceived: 0,
      conversationsStarted: 0,
      meetingsBooked: 0,
      pipelineGenerated: 0,
      revenueInfluenced: 0
    });
  }
}

// Export singleton instance
export const campaignService = new LocalCampaignService();
