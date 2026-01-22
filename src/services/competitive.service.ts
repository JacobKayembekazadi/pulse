// ============================================================================
// COMPETITIVE SERVICE - Competitor Tracking & Mention Monitoring
// Uses localStorage persistence via storage.service
// ============================================================================

import {
  Competitor, CompetitorMention, SocialPost, Platform,
  Sentiment, TimeFrame, ConversationPriority
} from '../types';
import { CompetitiveService, CreateCompetitorInput } from './index';
import { storage } from './storage.service';

// Sample competitors for initial state
const SAMPLE_COMPETITORS: Competitor[] = [
  {
    id: 'comp_1',
    name: 'Gong.io',
    domain: 'gong.io',
    logo: 'https://logo.clearbit.com/gong.io',
    keywords: ['gong', 'revenue intelligence', 'conversation analytics'],
    socialProfiles: {
      linkedin: 'https://linkedin.com/company/gong-io',
      twitter: 'https://twitter.com/gaborgg'
    },
    tracking: {
      mentions: true,
      pricing: true,
      features: true,
      reviews: true
    }
  },
  {
    id: 'comp_2',
    name: 'Outreach',
    domain: 'outreach.io',
    logo: 'https://logo.clearbit.com/outreach.io',
    keywords: ['outreach', 'sales engagement', 'email sequences'],
    socialProfiles: {
      linkedin: 'https://linkedin.com/company/outreach-saas',
      twitter: 'https://twitter.com/outreach'
    },
    tracking: {
      mentions: true,
      pricing: false,
      features: true,
      reviews: true
    }
  },
  {
    id: 'comp_3',
    name: 'Salesloft',
    domain: 'salesloft.com',
    logo: 'https://logo.clearbit.com/salesloft.com',
    keywords: ['salesloft', 'sales cadence', 'revenue orchestration'],
    socialProfiles: {
      linkedin: 'https://linkedin.com/company/salesloft',
      twitter: 'https://twitter.com/salesloft'
    },
    tracking: {
      mentions: true,
      pricing: true,
      features: false,
      reviews: true
    }
  }
];

// Sample mentions
const generateSampleMentions = (competitors: Competitor[]): CompetitorMention[] => {
  const mentions: CompetitorMention[] = [];
  const contexts: CompetitorMention['context'][] = ['positive', 'negative', 'comparison', 'switch_from', 'switch_to'];
  const priorities: ConversationPriority[] = ['low', 'medium', 'high', 'urgent'];
  const platforms: Platform[] = ['linkedin', 'twitter', 'reddit'];

  competitors.forEach((comp, compIdx) => {
    for (let i = 0; i < 3; i++) {
      const daysAgo = Math.floor(Math.random() * 7);
      const context = contexts[Math.floor(Math.random() * contexts.length)];
      const priority = context === 'switch_from' ? 'urgent' :
                       context === 'comparison' ? 'high' :
                       priorities[Math.floor(Math.random() * priorities.length)];

      mentions.push({
        id: `mention_${comp.id}_${i}`,
        competitorId: comp.id,
        post: {
          id: `post_comp_${compIdx}_${i}`,
          platform: platforms[Math.floor(Math.random() * platforms.length)],
          author: {
            name: ['Sarah Chen', 'Mike Johnson', 'Amanda Torres', 'Jason Park'][Math.floor(Math.random() * 4)],
            handle: `user_${Math.floor(Math.random() * 1000)}`,
            title: ['VP Sales', 'Sales Director', 'Head of RevOps', 'SDR Manager'][Math.floor(Math.random() * 4)]
          },
          content: generateMentionContent(comp.name, context),
          engagement: {
            likes: Math.floor(Math.random() * 100),
            comments: Math.floor(Math.random() * 30),
            shares: Math.floor(Math.random() * 15)
          },
          url: `https://example.com/post/${compIdx}_${i}`,
          postedAt: new Date(Date.now() - daysAgo * 86400000),
          fetchedAt: new Date(),
          matchedKeywords: [comp.keywords[0]],
          matchedAccounts: [],
          relevanceScore: 0.7 + Math.random() * 0.3,
          sentiment: context === 'positive' ? 'positive' :
                     context === 'negative' ? 'negative' : 'neutral',
          category: context === 'comparison' ? 'comparison' :
                   context === 'switch_from' || context === 'switch_to' ? 'comparison' : 'brand_mention'
        },
        context,
        priority,
        timestamp: new Date(Date.now() - daysAgo * 86400000)
      });
    }
  });

  return mentions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

function generateMentionContent(competitorName: string, context: CompetitorMention['context']): string {
  const contents: Record<typeof context, string[]> = {
    positive: [
      `Really impressed with ${competitorName}'s latest features. The UX improvements are solid.`,
      `Our team has been using ${competitorName} for 6 months now and the ROI has been great.`,
      `${competitorName} just released a feature we've been waiting for. Excited to try it!`
    ],
    negative: [
      `Frustrated with ${competitorName}'s pricing model. Looking for alternatives...`,
      `Anyone else having issues with ${competitorName}'s support? Been waiting days for a response.`,
      `${competitorName}'s last update broke our workflow. Considering switching.`
    ],
    comparison: [
      `Evaluating ${competitorName} vs other solutions. What are your experiences?`,
      `Has anyone compared ${competitorName} to the alternatives? Need help deciding.`,
      `Looking at ${competitorName} for our sales team. How does it stack up?`
    ],
    switch_from: [
      `We're leaving ${competitorName} next quarter. Any recommendations for alternatives?`,
      `Finally migrating away from ${competitorName}. The limitations were too much.`,
      `Our contract with ${competitorName} ends soon. What are you all using?`
    ],
    switch_to: [
      `Just signed up for ${competitorName}. Excited to see what the hype is about!`,
      `Made the switch to ${competitorName} last month. So far so good.`,
      `We chose ${competitorName} over other options. The demo sold us.`
    ]
  };

  const options = contents[context];
  return options[Math.floor(Math.random() * options.length)];
}

// In-memory cache
let competitors: Competitor[] = [];
let mentions: CompetitorMention[] = [];

// Initialize from localStorage
const loadFromStorage = () => {
  const savedCompetitors = storage.get<Competitor[]>('nexus-competitors', []);
  if (savedCompetitors.length > 0) {
    competitors = savedCompetitors;
  } else {
    competitors = SAMPLE_COMPETITORS;
    storage.set('nexus-competitors', competitors);
  }

  // Generate fresh mentions based on competitors
  mentions = generateSampleMentions(competitors);
};

loadFromStorage();

const saveToStorage = () => {
  storage.set('nexus-competitors', competitors);
};

export class LocalCompetitiveService implements CompetitiveService {

  async getCompetitors(): Promise<Competitor[]> {
    return competitors;
  }

  async getCompetitor(id: string): Promise<Competitor | null> {
    return competitors.find(c => c.id === id) || null;
  }

  async addCompetitor(data: CreateCompetitorInput): Promise<Competitor> {
    const competitor: Competitor = {
      id: storage.generateId(),
      name: data.name,
      domain: data.domain,
      logo: `https://logo.clearbit.com/${data.domain}`,
      keywords: data.keywords || [data.name.toLowerCase()],
      socialProfiles: {},
      tracking: data.tracking || {
        mentions: true,
        pricing: true,
        features: true,
        reviews: true
      }
    };

    competitors.push(competitor);
    saveToStorage();

    // Generate mentions for new competitor
    const newMentions = generateSampleMentions([competitor]);
    mentions = [...newMentions, ...mentions].sort((a, b) =>
      b.timestamp.getTime() - a.timestamp.getTime()
    );

    return competitor;
  }

  async updateCompetitor(id: string, data: Partial<Competitor>): Promise<Competitor> {
    const index = competitors.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Competitor not found');

    competitors[index] = { ...competitors[index], ...data };
    saveToStorage();
    return competitors[index];
  }

  async removeCompetitor(id: string): Promise<void> {
    const index = competitors.findIndex(c => c.id === id);
    if (index !== -1) {
      competitors.splice(index, 1);
      mentions = mentions.filter(m => m.competitorId !== id);
      saveToStorage();
    }
  }

  async getMentions(competitorId: string, timeframe: TimeFrame): Promise<CompetitorMention[]> {
    const cutoff = this.getTimeframeCutoff(timeframe);
    return mentions.filter(m =>
      m.competitorId === competitorId &&
      m.timestamp.getTime() > cutoff
    );
  }

  async getAllMentions(timeframe: TimeFrame): Promise<CompetitorMention[]> {
    const cutoff = this.getTimeframeCutoff(timeframe);
    return mentions.filter(m => m.timestamp.getTime() > cutoff);
  }

  async getWinLossAnalysis(timeframe: TimeFrame): Promise<{
    wins: number;
    losses: number;
    reasons: { reason: string; count: number }[];
  }> {
    // Get win/loss records from storage
    const winLossRecords = storage.get<any[]>('nexus-winloss', []);
    const cutoff = this.getTimeframeCutoff(timeframe);

    const filtered = winLossRecords.filter(r =>
      new Date(r.date).getTime() > cutoff
    );

    const wins = filtered.filter(r => r.type === 'win').length;
    const losses = filtered.filter(r => r.type === 'loss').length;

    // Count reasons
    const reasonCounts: Record<string, number> = {};
    filtered.forEach(r => {
      if (r.reason) {
        reasonCounts[r.reason] = (reasonCounts[r.reason] || 0) + 1;
      }
    });

    const reasons = Object.entries(reasonCounts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);

    return { wins, losses, reasons };
  }

  // Helper to convert timeframe to cutoff timestamp
  private getTimeframeCutoff(timeframe: TimeFrame): number {
    const now = Date.now();
    switch (timeframe) {
      case 'live': return now - 3600000; // 1 hour
      case '24h': return now - 86400000;
      case '7d': return now - 7 * 86400000;
      case '30d': return now - 30 * 86400000;
      case '1y': return now - 365 * 86400000;
      default: return now - 7 * 86400000;
    }
  }

  // Get competitor stats
  async getCompetitorStats(id: string): Promise<{
    totalMentions: number;
    positiveMentions: number;
    negativeMentions: number;
    recentTrend: 'up' | 'down' | 'stable';
  }> {
    const compMentions = mentions.filter(m => m.competitorId === id);
    const recentMentions = compMentions.filter(m =>
      m.timestamp.getTime() > Date.now() - 7 * 86400000
    );
    const olderMentions = compMentions.filter(m =>
      m.timestamp.getTime() > Date.now() - 14 * 86400000 &&
      m.timestamp.getTime() <= Date.now() - 7 * 86400000
    );

    const trend = recentMentions.length > olderMentions.length ? 'up' :
                  recentMentions.length < olderMentions.length ? 'down' : 'stable';

    return {
      totalMentions: compMentions.length,
      positiveMentions: compMentions.filter(m => m.post.sentiment === 'positive').length,
      negativeMentions: compMentions.filter(m => m.post.sentiment === 'negative').length,
      recentTrend: trend
    };
  }

  // Get mentions that indicate switching opportunity
  async getSwitchingOpportunities(): Promise<CompetitorMention[]> {
    return mentions.filter(m => m.context === 'switch_from');
  }
}

// Export singleton instance
export const competitiveService = new LocalCompetitiveService();
