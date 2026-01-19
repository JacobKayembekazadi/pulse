// ============================================================================
// SEARCH SERVICE - Multi-Source Social Search
// Supports: Apify (real data), Gemini AI (grounded search), Mock (fallback)
// ============================================================================

import { GoogleGenAI } from '@google/genai';
import { SocialPost, Platform, TimeFrame, Sentiment, PostCategory } from '../types';
import { SearchService, SearchParams } from './index';

// API Keys - loaded from localStorage or environment
const getApiKey = (key: string): string => {
  if (typeof window !== 'undefined') {
    const settings = localStorage.getItem('nexus-settings');
    if (settings) {
      const parsed = JSON.parse(settings);
      if (key === 'gemini' && parsed.state?.aiConfig?.apiKey) {
        return parsed.state.aiConfig.apiKey;
      }
      if (key === 'apify') {
        const apifyIntegration = parsed.state?.integrations?.find((i: any) => i.id === 'apify');
        return apifyIntegration?.apiKey || '';
      }
    }
  }
  return process.env[`${key.toUpperCase()}_API_KEY`] || '';
};

// Apify Actor IDs for different platforms
const APIFY_ACTORS = {
  linkedin: 'curious_coder/linkedin-post-search-scraper',
  twitter: 'apidojo/twitter-scraper',
  reddit: 'trudax/reddit-scraper',
};

export class PulseSearchService implements SearchService {
  private geminiClient: GoogleGenAI | null = null;
  private subscribers: Map<string, (post: SocialPost) => void> = new Map();
  private pollingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeClients();
  }

  private initializeClients() {
    const geminiKey = getApiKey('gemini');
    if (geminiKey) {
      this.geminiClient = new GoogleGenAI({ apiKey: geminiKey });
    }
  }

  async search(params: SearchParams): Promise<SocialPost[]> {
    const apifyKey = getApiKey('apify');

    // Try Apify first if configured
    if (apifyKey) {
      try {
        return await this.searchWithApify(params);
      } catch (error) {
        console.warn('Apify search failed, falling back to AI search:', error);
      }
    }

    // Fall back to Gemini AI search
    if (this.geminiClient || getApiKey('gemini')) {
      this.initializeClients();
      if (this.geminiClient) {
        try {
          return await this.searchWithGemini(params);
        } catch (error) {
          console.warn('Gemini search failed, using mock data:', error);
        }
      }
    }

    // Last resort: mock data
    return this.generateMockResults(params.keywords, params.platforms, params.maxResults || 10);
  }

  async searchWithApify(params: SearchParams): Promise<SocialPost[]> {
    const { keywords, platforms, timeframe, maxResults = 20 } = params;
    const apifyKey = getApiKey('apify');

    if (!apifyKey) {
      throw new Error('Apify API key not configured');
    }

    const searchTerms = Array.isArray(keywords) ? keywords.join(' ') : keywords;
    const allPosts: SocialPost[] = [];

    // Search each platform
    for (const platform of platforms) {
      const actorId = APIFY_ACTORS[platform as keyof typeof APIFY_ACTORS];
      if (!actorId) continue;

      try {
        const posts = await this.runApifyActor(actorId, {
          searchTerms,
          maxResults: Math.ceil(maxResults / platforms.length),
          timeframe
        }, apifyKey, platform);

        allPosts.push(...posts);
      } catch (error) {
        console.error(`Apify ${platform} search failed:`, error);
      }
    }

    return allPosts.slice(0, maxResults);
  }

  private async runApifyActor(
    actorId: string,
    input: any,
    apiKey: string,
    platform: Platform
  ): Promise<SocialPost[]> {
    // Start the actor run
    const runResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs?token=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });

    if (!runResponse.ok) {
      throw new Error(`Apify actor start failed: ${runResponse.statusText}`);
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;

    // Poll for completion (max 30 seconds)
    let attempts = 0;
    while (attempts < 15) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const statusResponse = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${apiKey}`
      );
      const statusData = await statusResponse.json();

      if (statusData.data.status === 'SUCCEEDED') {
        // Get results
        const datasetId = statusData.data.defaultDatasetId;
        const resultsResponse = await fetch(
          `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apiKey}`
        );
        const results = await resultsResponse.json();

        return results.map((item: any, index: number) =>
          this.normalizeApifyResult(item, platform, index)
        );
      }

      if (statusData.data.status === 'FAILED' || statusData.data.status === 'ABORTED') {
        throw new Error(`Apify actor ${statusData.data.status}`);
      }

      attempts++;
    }

    throw new Error('Apify actor timeout');
  }

  private normalizeApifyResult(raw: any, platform: Platform, index: number): SocialPost {
    const now = new Date();

    // Different platforms have different data structures
    let author, content, engagement, url, postedAt;

    if (platform === 'linkedin') {
      author = {
        id: raw.authorUrn || `author_${index}`,
        name: raw.authorName || raw.author?.name || 'LinkedIn User',
        handle: raw.authorUsername || raw.authorUrn?.split(':').pop() || 'user',
        title: raw.authorHeadline || raw.author?.headline,
        avatarUrl: raw.authorProfilePicture,
        followers: raw.authorFollowers,
        isVerified: raw.authorIsInfluencer || false
      };
      content = raw.text || raw.commentary || '';
      engagement = {
        likes: raw.numLikes || raw.likeCount || 0,
        comments: raw.numComments || raw.commentCount || 0,
        shares: raw.numShares || raw.shareCount || 0
      };
      url = raw.url || raw.postUrl;
      postedAt = raw.postedAt ? new Date(raw.postedAt) : now;
    } else if (platform === 'twitter') {
      author = {
        id: raw.author?.id || `author_${index}`,
        name: raw.author?.name || raw.user?.name || 'Twitter User',
        handle: raw.author?.userName || raw.user?.screen_name || 'user',
        avatarUrl: raw.author?.profilePicture,
        followers: raw.author?.followers,
        isVerified: raw.author?.isVerified || raw.author?.isBlueVerified || false
      };
      content = raw.text || raw.full_text || '';
      engagement = {
        likes: raw.likeCount || raw.favorite_count || 0,
        comments: raw.replyCount || 0,
        shares: raw.retweetCount || raw.retweet_count || 0,
        views: raw.viewCount
      };
      url = raw.url || `https://twitter.com/${author.handle}/status/${raw.id}`;
      postedAt = raw.createdAt ? new Date(raw.createdAt) : now;
    } else if (platform === 'reddit') {
      author = {
        id: raw.author || `author_${index}`,
        name: raw.author || 'Redditor',
        handle: raw.author || 'user',
        isVerified: false
      };
      content = raw.title ? `${raw.title}\n\n${raw.body || raw.selftext || ''}` : (raw.body || '');
      engagement = {
        likes: raw.score || raw.ups || 0,
        comments: raw.numComments || raw.num_comments || 0,
        shares: 0
      };
      url = raw.url || raw.permalink ? `https://reddit.com${raw.permalink}` : undefined;
      postedAt = raw.createdAt ? new Date(raw.createdAt * 1000) : now;
    } else {
      // Generic fallback
      author = {
        id: `author_${index}`,
        name: raw.author || 'Unknown',
        handle: 'user',
        isVerified: false
      };
      content = raw.text || raw.content || '';
      engagement = { likes: 0, comments: 0, shares: 0 };
      url = raw.url;
      postedAt = now;
    }

    return {
      id: raw.id || `${platform}_${Date.now()}_${index}`,
      platform,
      author,
      content,
      engagement,
      url,
      postedAt: postedAt,
      fetchedAt: now,
      matchedKeywords: [],
      matchedAccounts: [],
      relevanceScore: 80,
      sentiment: this.analyzeSentiment(content),
      category: this.inferCategory(content)
    };
  }

  async searchWithGemini(params: SearchParams): Promise<SocialPost[]> {
    const { keywords, platforms, timeframe, maxResults = 20 } = params;

    if (!this.geminiClient) {
      this.initializeClients();
      if (!this.geminiClient) {
        throw new Error('Gemini client not initialized');
      }
    }

    const searchTerms = Array.isArray(keywords) ? keywords.join(', ') : keywords;
    const timeframeMap: Record<TimeFrame, string> = {
      'live': 'past hour',
      '24h': 'past 24 hours',
      '7d': 'past week',
      '30d': 'past month',
      '1y': 'past year'
    };

    const platformList = platforms.length > 0 ? platforms.join(', ') : 'LinkedIn, Twitter, Reddit';

    const prompt = `Search for recent social media posts about: ${searchTerms}

Platforms: ${platformList}
Timeframe: ${timeframeMap[timeframe]}
Find ${maxResults} real posts. Return JSON array:
[{
  "platform": "linkedin|twitter|reddit",
  "author": {"name": "Full Name", "handle": "username", "title": "Job Title"},
  "content": "The actual post text...",
  "engagement": {"likes": 100, "comments": 20, "shares": 5},
  "postedAt": "2024-01-15T10:30:00Z",
  "url": "https://..."
}]`;

    try {
      const response = await this.geminiClient.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        }
      });

      const text = response.text || '[]';
      const jsonMatch = text.match(/\[[\s\S]*\]/);

      if (!jsonMatch) {
        return this.generateMockResults(keywords, platforms, maxResults);
      }

      const rawPosts = JSON.parse(jsonMatch[0]);
      return rawPosts.map((post: any, index: number) => this.normalizeGeminiResult(post, index));
    } catch (error) {
      console.error('Gemini search error:', error);
      throw error;
    }
  }

  private normalizeGeminiResult(raw: any, index: number): SocialPost {
    const now = new Date();

    return {
      id: `gemini_${Date.now()}_${index}`,
      platform: this.validatePlatform(raw.platform),
      author: {
        id: `author_${index}`,
        name: raw.author?.name || 'Unknown',
        handle: raw.author?.handle || 'user',
        title: raw.author?.title,
        isVerified: false
      },
      content: raw.content || '',
      engagement: {
        likes: raw.engagement?.likes || 0,
        comments: raw.engagement?.comments || 0,
        shares: raw.engagement?.shares || 0
      },
      url: raw.url,
      postedAt: raw.postedAt ? new Date(raw.postedAt) : now,
      fetchedAt: now,
      matchedKeywords: [],
      matchedAccounts: [],
      relevanceScore: 75,
      sentiment: this.analyzeSentiment(raw.content || ''),
      category: this.inferCategory(raw.content || '')
    };
  }

  subscribeToKeywords(keywords: string[], callback: (post: SocialPost) => void): () => void {
    const subscriptionId = Math.random().toString(36).substring(7);
    this.subscribers.set(subscriptionId, callback);

    if (!this.pollingInterval && this.subscribers.size > 0) {
      this.startPolling(keywords);
    }

    return () => {
      this.subscribers.delete(subscriptionId);
      if (this.subscribers.size === 0 && this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
    };
  }

  private startPolling(keywords: string[]) {
    this.pollingInterval = setInterval(async () => {
      try {
        const posts = await this.search({
          keywords,
          platforms: ['linkedin', 'twitter', 'reddit'],
          timeframe: 'live',
          maxResults: 5
        });

        posts.forEach(post => {
          this.subscribers.forEach(callback => callback(post));
        });
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 60000);
  }

  private validatePlatform(platform: string): Platform {
    const valid: Platform[] = ['linkedin', 'twitter', 'reddit', 'bluesky', 'news', 'web'];
    return valid.includes(platform as Platform) ? (platform as Platform) : 'web';
  }

  private analyzeSentiment(content: string): Sentiment {
    const lower = content.toLowerCase();
    const positiveWords = ['great', 'amazing', 'love', 'excellent', 'fantastic', 'awesome', 'best', 'happy', 'excited'];
    const negativeWords = ['terrible', 'awful', 'hate', 'worst', 'frustrated', 'disappointed', 'bad', 'problem', 'issue'];

    const positiveCount = positiveWords.filter(w => lower.includes(w)).length;
    const negativeCount = negativeWords.filter(w => lower.includes(w)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private inferCategory(content: string): PostCategory {
    const lower = content.toLowerCase();

    if (lower.includes('?') || lower.includes('how do') || lower.includes('anyone know')) {
      return 'question';
    }
    if (lower.includes('pain') || lower.includes('frustrat') || lower.includes('struggle')) {
      return 'pain_point';
    }
    if (lower.includes('vs') || lower.includes('compar') || lower.includes('better than')) {
      return 'comparison';
    }
    if (lower.includes('recommend') || lower.includes('suggest')) {
      return 'recommendation';
    }
    if (lower.includes('announce') || lower.includes('launch')) {
      return 'announcement';
    }
    return 'thought_leadership';
  }

  private generateMockResults(keywords: string | string[], platforms: Platform[], count: number): SocialPost[] {
    const keywordList = Array.isArray(keywords) ? keywords : [keywords];
    const keyword = keywordList[0] || 'sales';

    const mockAuthors = [
      { name: 'Sarah Chen', title: 'VP of Marketing @ TechCorp', handle: 'sarahchen' },
      { name: 'Mike Rodriguez', title: 'Growth Lead @ ScaleUp', handle: 'mikerodriguez' },
      { name: 'Emily Watson', title: 'Director of Revenue @ CloudFirst', handle: 'emilywatson' },
      { name: 'James Liu', title: 'Founder @ DataFlow', handle: 'jamesliu' },
      { name: 'Amanda Torres', title: 'Head of SDR @ Nexus', handle: 'amandatorres' },
    ];

    const mockContents = [
      `Just wrapped up Q4 planning. The shift to ${keyword} approaches has been a game changer. Anyone else seeing improvements?`,
      `Hot take: Traditional ${keyword} is evolving fast. Community-led growth and warm intros are becoming essential.`,
      `We integrated a new ${keyword} stack and results are impressive. Team spending 80% less time on manual work.`,
      `Building in public: Our ${keyword} strategy now focuses on intent signals. Quality improvement is remarkable.`,
      `Anyone have recommendations for ${keyword} tools? Looking to upgrade our current setup.`,
      `The ROI on ${keyword} has exceeded expectations. Happy to share our playbook if anyone's interested.`,
    ];

    const now = new Date();

    return mockContents.slice(0, count).map((content, index) => {
      const platform = platforms[index % platforms.length] || 'linkedin';
      const author = mockAuthors[index % mockAuthors.length];

      return {
        id: `mock_${Date.now()}_${index}`,
        platform,
        author: {
          id: `author_${index}`,
          name: author.name,
          handle: author.handle,
          title: author.title,
          followers: Math.floor(Math.random() * 10000) + 500,
          isVerified: Math.random() > 0.7
        },
        content,
        engagement: {
          likes: Math.floor(Math.random() * 500) + 50,
          comments: Math.floor(Math.random() * 100) + 10,
          shares: Math.floor(Math.random() * 50) + 5
        },
        url: `https://${platform}.com/post/${index}`,
        postedAt: new Date(now.getTime() - Math.random() * 86400000 * 3),
        fetchedAt: now,
        matchedKeywords: keywordList,
        matchedAccounts: [],
        relevanceScore: Math.floor(Math.random() * 20) + 80,
        sentiment: (['positive', 'neutral', 'negative'] as Sentiment[])[Math.floor(Math.random() * 3)],
        category: this.inferCategory(content)
      };
    });
  }
}

export const searchService = new PulseSearchService();
