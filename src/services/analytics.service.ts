// ============================================================================
// ANALYTICS SERVICE - Dashboard Metrics & Performance Analytics
// Aggregates data from accounts, campaigns, inbox, and content services
// ============================================================================

import { TimeFrame, ContentTemplate, Attribution } from '../types';
import { AnalyticsService, AnalyticsMetrics } from './index';
import { storage } from './storage.service';

// Generate engagement trend data
const generateEngagementTrend = (days: number): { date: string; value: number }[] => {
  const trend: { date: string; value: number }[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Simulate engagement with some variance and an upward trend
    const baseValue = 15 + (days - i) * 0.5;
    const variance = Math.random() * 10 - 5;
    const dayOfWeek = date.getDay();
    const weekdayBonus = (dayOfWeek >= 1 && dayOfWeek <= 5) ? 5 : 0;

    trend.push({
      date: date.toISOString().split('T')[0],
      value: Math.max(5, Math.round(baseValue + variance + weekdayBonus))
    });
  }

  return trend;
};

export class LocalAnalyticsService implements AnalyticsService {

  async getDashboardMetrics(timeframe: TimeFrame): Promise<AnalyticsMetrics> {
    // Load data from various stores
    const accounts = storage.get<any[]>('nexus-accounts', []);
    const conversations = storage.get<any[]>('nexus-conversations', []);
    const campaigns = storage.get<any[]>('nexus-campaigns', []);

    // Calculate timeframe cutoff
    const cutoff = this.getTimeframeCutoff(timeframe);

    // Filter accounts by creation date for "new" count
    const newAccounts = accounts.filter(a =>
      new Date(a.createdAt).getTime() > cutoff
    );

    // Count accounts by tier
    const byTier: Record<string, number> = {
      hot: 0,
      warm: 0,
      cold: 0,
      ice: 0
    };
    accounts.forEach(a => {
      const tier = a.score?.tier || 'cold';
      byTier[tier] = (byTier[tier] || 0) + 1;
    });

    // Aggregate campaign metrics
    let totalComments = 0;
    let totalReplies = 0;
    let totalPipeline = 0;
    let totalInfluenced = 0;

    campaigns.forEach(c => {
      if (c.metrics) {
        totalComments += c.metrics.commentsSent || 0;
        totalReplies += c.metrics.repliesReceived || 0;
        totalPipeline += c.metrics.pipelineGenerated || 0;
        totalInfluenced += c.metrics.revenueInfluenced || 0;
      }
    });

    // Calculate reply rate
    const replyRate = totalComments > 0
      ? Math.round((totalReplies / totalComments) * 100)
      : 0;

    // Calculate average response time (mock)
    const avgResponseTime = 12 + Math.floor(Math.random() * 8);

    return {
      accounts: {
        total: accounts.length,
        byTier,
        newThisWeek: newAccounts.length
      },
      engagement: {
        commentsSent: totalComments || 245,
        repliesReceived: totalReplies || 67,
        replyRate: replyRate || 27,
        avgResponseTime
      },
      pipeline: {
        totalValue: totalPipeline || 234000,
        newThisWeek: Math.round((totalPipeline || 234000) * 0.19),
        influenced: totalInfluenced || 89000
      },
      team: {
        activeMembers: 3,
        avgPerformance: 78
      }
    };
  }

  async getEngagementTrend(days: number): Promise<{ date: string; value: number }[]> {
    // Check if we have cached analytics data
    const cached = storage.get<{ engagementTrend?: { date: string; value: number }[] }>(
      'nexus-analytics',
      {}
    );

    if (cached.engagementTrend && cached.engagementTrend.length >= days) {
      return cached.engagementTrend.slice(-days);
    }

    // Generate trend data
    const trend = generateEngagementTrend(days);

    // Cache the result
    storage.set('nexus-analytics', { ...cached, engagementTrend: trend });

    return trend;
  }

  async getTopPerformingContent(limit: number): Promise<ContentTemplate[]> {
    const templates = storage.get<ContentTemplate[]>('nexus-templates', []);

    // If no templates, return sample data
    if (templates.length === 0) {
      return this.getSampleTopContent(limit);
    }

    // Sort by reply rate and return top performers
    return templates
      .filter(t => t.performance && t.performance.sent > 0)
      .sort((a, b) =>
        (b.performance?.replyRate || 0) - (a.performance?.replyRate || 0)
      )
      .slice(0, limit);
  }

  async getTeamLeaderboard(): Promise<{ member: string; score: number }[]> {
    // Return sample leaderboard data
    return [
      { member: 'Sarah Chen', score: 94 },
      { member: 'Michael Park', score: 87 },
      { member: 'Amanda Torres', score: 82 },
      { member: 'David Miller', score: 76 },
      { member: 'Jessica Liu', score: 71 }
    ];
  }

  async getAttributionReport(timeframe: TimeFrame): Promise<Attribution[]> {
    const cutoff = this.getTimeframeCutoff(timeframe);
    const accounts = storage.get<any[]>('nexus-accounts', []);
    const campaigns = storage.get<any[]>('nexus-campaigns', []);

    // Generate attribution data for accounts with pipeline
    const attributions: Attribution[] = [];

    accounts
      .filter(a => a.score?.tier === 'hot' || a.stage === 'opportunity')
      .slice(0, 5)
      .forEach((account, idx) => {
        const campaign = campaigns[idx % campaigns.length];

        attributions.push({
          id: `attr_${account.id}`,
          accountId: account.id,
          touchpoints: [
            {
              type: 'social_comment',
              channel: 'linkedin',
              campaignId: campaign?.id,
              description: 'Initial engagement',
              timestamp: new Date(Date.now() - 7 * 86400000),
              weight: 0.3
            },
            {
              type: 'social_reply',
              channel: 'linkedin',
              campaignId: campaign?.id,
              description: 'Follow-up conversation',
              timestamp: new Date(Date.now() - 5 * 86400000),
              weight: 0.4
            },
            {
              type: 'meeting',
              channel: 'meeting',
              campaignId: campaign?.id,
              description: 'Demo scheduled',
              timestamp: new Date(Date.now() - 2 * 86400000),
              weight: 0.3
            }
          ],
          model: 'linear',
          totalValue: 25000 + Math.floor(Math.random() * 75000),
          createdAt: new Date(Date.now() - idx * 86400000)
        });
      });

    return attributions;
  }

  // Helper: Get timeframe cutoff timestamp
  private getTimeframeCutoff(timeframe: TimeFrame): number {
    const now = Date.now();
    switch (timeframe) {
      case 'live': return now - 3600000;
      case '24h': return now - 86400000;
      case '7d': return now - 7 * 86400000;
      case '30d': return now - 30 * 86400000;
      case '1y': return now - 365 * 86400000;
      default: return now - 7 * 86400000;
    }
  }

  // Helper: Generate sample top content when no real data exists
  private getSampleTopContent(limit: number): ContentTemplate[] {
    const samples: Partial<ContentTemplate>[] = [
      {
        id: 'temp_1',
        type: 'social_comment',
        name: 'Helpful Value Add',
        category: 'Engagement',
        performance: { sent: 145, replies: 58, replyRate: 40, avgSentiment: 0.8 }
      },
      {
        id: 'temp_2',
        type: 'social_comment',
        name: 'Curious Question',
        category: 'Engagement',
        performance: { sent: 98, replies: 43, replyRate: 44, avgSentiment: 0.7 }
      },
      {
        id: 'temp_3',
        type: 'linkedin_message',
        name: 'Enterprise Outreach',
        category: 'Outreach',
        performance: { sent: 67, replies: 31, replyRate: 46, avgSentiment: 0.75 }
      },
      {
        id: 'temp_4',
        type: 'social_comment',
        name: 'Problem Solver',
        category: 'Engagement',
        performance: { sent: 112, replies: 39, replyRate: 35, avgSentiment: 0.65 }
      },
      {
        id: 'temp_5',
        type: 'email_outreach',
        name: 'Warm Follow-up',
        category: 'Follow-up',
        performance: { sent: 89, replies: 28, replyRate: 31, avgSentiment: 0.7 }
      }
    ];

    return samples.slice(0, limit) as ContentTemplate[];
  }

  // Get platform breakdown
  async getPlatformBreakdown(): Promise<{
    platform: string;
    engagements: number;
    replyRate: number;
  }[]> {
    return [
      { platform: 'LinkedIn', engagements: 245, replyRate: 38 },
      { platform: 'Twitter', engagements: 156, replyRate: 28 },
      { platform: 'Reddit', engagements: 89, replyRate: 42 },
      { platform: 'Bluesky', engagements: 34, replyRate: 35 }
    ];
  }

  // Get sentiment breakdown
  async getSentimentBreakdown(): Promise<{
    positive: number;
    neutral: number;
    negative: number;
  }> {
    return {
      positive: 58,
      neutral: 32,
      negative: 10
    };
  }

  // Get best engagement times
  async getBestEngagementTimes(): Promise<{
    dayOfWeek: number;
    hour: number;
    engagementRate: number;
  }[]> {
    const times: { dayOfWeek: number; hour: number; engagementRate: number }[] = [];

    // Generate heatmap data (higher during work hours on weekdays)
    for (let day = 0; day < 7; day++) {
      for (let hour = 6; hour < 22; hour += 3) {
        let rate = 0.2;

        // Weekdays have higher engagement
        if (day >= 1 && day <= 5) {
          rate += 0.2;

          // Peak hours (9am-5pm)
          if (hour >= 9 && hour <= 17) {
            rate += 0.3;
          }

          // Tuesday-Thursday highest
          if (day >= 2 && day <= 4) {
            rate += 0.1;
          }
        }

        rate += Math.random() * 0.1;

        times.push({
          dayOfWeek: day,
          hour,
          engagementRate: Math.min(1, rate)
        });
      }
    }

    return times;
  }
}

// Export singleton instance
export const analyticsService = new LocalAnalyticsService();
