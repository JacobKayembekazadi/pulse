// ============================================================================
// HOT MOMENTS SERVICE - Real-time Opportunity Detection
// Generates hot moments from social posts, account activity, and competitor mentions
// ============================================================================

import { HotMoment, HotMomentType, HotMomentUrgency, SocialPost, Account } from '../types';
import { storage } from './storage.service';

// Generate unique ID
const generateId = () => `hm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// Determine urgency based on time elapsed
const calculateUrgency = (timestamp: Date): HotMomentUrgency => {
  const elapsed = Date.now() - timestamp.getTime();
  if (elapsed < 30 * 60 * 1000) return 'act_now'; // < 30 min
  if (elapsed < 2 * 60 * 60 * 1000) return 'within_hour'; // < 2 hours
  return 'today';
};

// Calculate expiration time based on urgency
const calculateExpiry = (urgency: HotMomentUrgency): Date => {
  const now = new Date();
  switch (urgency) {
    case 'act_now': return new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
    case 'within_hour': return new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours
    case 'today': return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
  }
};

export class HotMomentsService {
  private moments: HotMoment[] = [];
  private subscribers: ((moments: HotMoment[]) => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const saved = storage.get<HotMoment[]>('nexus-hotmoments', []);
    if (saved.length > 0) {
      this.moments = saved.map(m => ({
        ...m,
        expiresAt: new Date(m.expiresAt),
        createdAt: new Date(m.createdAt)
      }));
      // Remove expired moments
      this.cleanupExpired();
    } else {
      // Initialize with sample moments
      this.moments = this.generateInitialMoments();
      this.saveToStorage();
    }
  }

  private saveToStorage() {
    storage.set('nexus-hotmoments', this.moments);
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.moments));
  }

  private cleanupExpired() {
    const now = new Date();
    const before = this.moments.length;
    this.moments = this.moments.filter(m => m.expiresAt > now);
    if (this.moments.length !== before) {
      this.saveToStorage();
      this.notifySubscribers();
    }
  }

  private generateInitialMoments(): HotMoment[] {
    return [
      {
        id: generateId(),
        type: 'post_just_published',
        accountId: 'acc_3',
        description: 'CloudFirst (Hot Lead) just posted about scaling outreach',
        urgency: 'act_now',
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(Date.now() - 120000)
      },
      {
        id: generateId(),
        type: 'high_engagement',
        postId: 'post_1',
        description: 'Your comment on ABM thread getting high engagement',
        urgency: 'within_hour',
        expiresAt: new Date(Date.now() + 7200000),
        createdAt: new Date(Date.now() - 600000)
      },
      {
        id: generateId(),
        type: 'competitor_active',
        accountId: 'acc_1',
        description: 'Competitor mentioned by TechCorp stakeholder',
        urgency: 'today',
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(Date.now() - 1800000)
      }
    ];
  }

  // Get all active hot moments
  getHotMoments(): HotMoment[] {
    this.cleanupExpired();
    return this.moments.sort((a, b) => {
      // Sort by urgency first, then by creation time
      const urgencyOrder = { 'act_now': 0, 'within_hour': 1, 'today': 2 };
      const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  // Subscribe to hot moment updates
  subscribe(callback: (moments: HotMoment[]) => void): () => void {
    this.subscribers.push(callback);
    callback(this.getHotMoments());
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  // Dismiss a hot moment
  dismiss(id: string): void {
    this.moments = this.moments.filter(m => m.id !== id);
    this.saveToStorage();
    this.notifySubscribers();
  }

  // Create a hot moment from a social post
  createFromPost(post: SocialPost, account?: Account): HotMoment | null {
    // Don't create duplicate moments for the same post
    if (this.moments.some(m => m.postId === post.id)) {
      return null;
    }

    const urgency = calculateUrgency(post.postedAt);

    let description = '';
    let type: HotMomentType = 'post_just_published';

    // Determine type and description based on context
    if (account && account.score.tier === 'hot') {
      description = `${account.company.name} (Hot Lead) just posted about ${post.matchedKeywords[0] || 'relevant topic'}`;
    } else if (post.engagement.likes > 50 || post.engagement.comments > 20) {
      type = 'high_engagement';
      description = `High-engagement post (${post.engagement.likes} likes) matching "${post.matchedKeywords[0]}"`;
    } else if (post.category === 'competitor_mention') {
      type = 'competitor_active';
      description = `Competitor mentioned in conversation by ${post.author.name}`;
    } else {
      description = `New post from ${post.author.name} about ${post.matchedKeywords[0] || 'relevant topic'}`;
    }

    const moment: HotMoment = {
      id: generateId(),
      type,
      postId: post.id,
      accountId: account?.id,
      description,
      urgency,
      expiresAt: calculateExpiry(urgency),
      createdAt: new Date()
    };

    this.moments.unshift(moment);
    this.saveToStorage();
    this.notifySubscribers();

    return moment;
  }

  // Create a hot moment for high engagement on our content
  createForEngagement(postId: string, engagementCount: number): HotMoment {
    const moment: HotMoment = {
      id: generateId(),
      type: 'high_engagement',
      postId,
      description: `Your comment is getting high engagement (${engagementCount}+ interactions)`,
      urgency: 'within_hour',
      expiresAt: calculateExpiry('within_hour'),
      createdAt: new Date()
    };

    this.moments.unshift(moment);
    this.saveToStorage();
    this.notifySubscribers();

    return moment;
  }

  // Create a hot moment for competitor activity
  createForCompetitorActivity(
    competitorName: string,
    accountId?: string,
    accountName?: string
  ): HotMoment {
    const description = accountName
      ? `${competitorName} mentioned by ${accountName} stakeholder`
      : `${competitorName} trending in your target conversations`;

    const moment: HotMoment = {
      id: generateId(),
      type: 'competitor_active',
      accountId,
      description,
      urgency: 'today',
      expiresAt: calculateExpiry('today'),
      createdAt: new Date()
    };

    this.moments.unshift(moment);
    this.saveToStorage();
    this.notifySubscribers();

    return moment;
  }

  // Create a hot moment for trending topic
  createForTrendingTopic(topic: string, postCount: number): HotMoment {
    const moment: HotMoment = {
      id: generateId(),
      type: 'trending_topic',
      description: `"${topic}" is trending with ${postCount} posts in last hour`,
      urgency: 'act_now',
      expiresAt: calculateExpiry('act_now'),
      createdAt: new Date()
    };

    this.moments.unshift(moment);
    this.saveToStorage();
    this.notifySubscribers();

    return moment;
  }

  // Process incoming posts and generate relevant hot moments
  processIncomingPosts(posts: SocialPost[], accounts: Account[]): HotMoment[] {
    const newMoments: HotMoment[] = [];

    posts.forEach(post => {
      // Try to match to a hot account
      const matchedAccount = accounts.find(a =>
        a.score.tier === 'hot' && (
          post.matchedAccounts.includes(a.id) ||
          post.author.name.toLowerCase().includes(a.company.name.toLowerCase())
        )
      );

      // Create moment for posts from hot accounts or high engagement
      if (matchedAccount || post.engagement.likes > 30 || post.engagement.comments > 10) {
        const moment = this.createFromPost(post, matchedAccount || undefined);
        if (moment) {
          newMoments.push(moment);
        }
      }
    });

    // Limit to 3 new moments at a time to avoid overwhelming
    return newMoments.slice(0, 3);
  }

  // Get count of active moments by urgency
  getMomentCounts(): { actNow: number; withinHour: number; today: number } {
    this.cleanupExpired();
    return {
      actNow: this.moments.filter(m => m.urgency === 'act_now').length,
      withinHour: this.moments.filter(m => m.urgency === 'within_hour').length,
      today: this.moments.filter(m => m.urgency === 'today').length
    };
  }

  // Clear all moments (for testing/reset)
  clearAll(): void {
    this.moments = [];
    this.saveToStorage();
    this.notifySubscribers();
  }
}

// Export singleton instance
export const hotMomentsService = new HotMomentsService();
