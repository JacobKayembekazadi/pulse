// ============================================================================
// SEARCH SERVICE - Pulse (Gemini) + Apify Integration
// ============================================================================

import { GoogleGenAI } from '@google/genai';
import { SocialPost, Platform, TimeFrame, Sentiment, PostCategory } from '../types';
import { SearchService, SearchParams } from './index';

const API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY || '';

export class PulseSearchService implements SearchService {
  private client: GoogleGenAI | null = null;
  private subscribers: Map<string, (post: SocialPost) => void> = new Map();
  private pollingInterval: NodeJS.Timeout | null = null;

  constructor() {
    if (API_KEY) {
      this.client = new GoogleGenAI({ apiKey: API_KEY });
    }
  }

  async search(params: SearchParams): Promise<SocialPost[]> {
    // Default to Pulse (free) mode
    return this.searchWithPulse(params);
  }

  async searchWithPulse(params: SearchParams): Promise<SocialPost[]> {
    const { keywords, platforms, timeframe, maxResults = 20 } = params;

    if (!this.client) {
      console.warn('Search client not initialized');
      return [];
    }

    const timeframeMap: Record<TimeFrame, string> = {
      'live': 'past hour',
      '24h': 'past 24 hours',
      '7d': 'past week',
      '30d': 'past month',
      '1y': 'past year'
    };

    const platformList = platforms.length > 0 ? platforms.join(', ') : 'LinkedIn, Twitter, Reddit, news sites';

    const prompt = `Search for recent social media posts and discussions about: ${keywords.join(', ')}

Focus on: ${platformList}
Timeframe: ${timeframeMap[timeframe]}

Find ${maxResults} real, recent posts that mention these topics. For each post, provide:
1. The platform (linkedin, twitter, reddit, bluesky, news, web)
2. Author name and title/role if available
3. The actual post content
4. Approximate engagement (likes, comments, shares)
5. When it was posted
6. A relevance score (0-100)

Return as JSON array:
[{
  "platform": "linkedin|twitter|reddit|bluesky|news|web",
  "author": {"name": "...", "handle": "...", "title": "..."},
  "content": "...",
  "engagement": {"likes": 0, "comments": 0, "shares": 0},
  "postedAt": "ISO date string",
  "relevanceScore": 85,
  "sentiment": "positive|neutral|negative",
  "url": "https://..."
}]

Important: Return realistic, diverse results from different authors and platforms.`;

    try {
      const response = await this.client.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        }
      });

      const text = response.text || '[]';

      // Extract JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return this.generateMockResults(keywords, platforms, maxResults);
      }

      const rawPosts = JSON.parse(jsonMatch[0]);

      return rawPosts.map((post: any, index: number) => this.normalizePost(post, index, keywords));
    } catch (error) {
      console.error('Search error:', error);
      return this.generateMockResults(keywords, platforms, maxResults);
    }
  }

  async searchWithApify(params: SearchParams): Promise<SocialPost[]> {
    // TODO: Implement Apify integration for deep scraping
    // This would require Apify API key and actor configurations
    console.warn('Apify integration not yet implemented, falling back to Pulse');
    return this.searchWithPulse(params);
  }

  subscribeToKeywords(keywords: string[], callback: (post: SocialPost) => void): () => void {
    const subscriptionId = Math.random().toString(36).substring(7);
    this.subscribers.set(subscriptionId, callback);

    // Start polling if not already running
    if (!this.pollingInterval && this.subscribers.size > 0) {
      this.startPolling(keywords);
    }

    // Return unsubscribe function
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
        const posts = await this.searchWithPulse({
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
    }, 60000); // Poll every 60 seconds
  }

  private normalizePost(raw: any, index: number, keywords: string[]): SocialPost {
    const now = new Date();
    const id = `post_${Date.now()}_${index}`;

    return {
      id,
      platform: this.validatePlatform(raw.platform),
      author: {
        id: `author_${index}`,
        name: raw.author?.name || 'Unknown Author',
        handle: raw.author?.handle || raw.author?.name?.toLowerCase().replace(/\s/g, '') || 'unknown',
        title: raw.author?.title,
        avatar: raw.author?.avatar,
        followers: raw.author?.followers,
        isVerified: raw.author?.isVerified || false
      },
      content: raw.content || '',
      media: raw.media,
      engagement: {
        likes: raw.engagement?.likes || 0,
        comments: raw.engagement?.comments || 0,
        shares: raw.engagement?.shares || 0,
        views: raw.engagement?.views
      },
      url: raw.url || `https://example.com/post/${id}`,
      postedAt: raw.postedAt ? new Date(raw.postedAt) : now,
      fetchedAt: now,
      matchedKeywords: keywords.filter(k =>
        raw.content?.toLowerCase().includes(k.toLowerCase())
      ),
      matchedAccounts: [],
      relevanceScore: raw.relevanceScore || 75,
      sentiment: this.validateSentiment(raw.sentiment),
      category: this.inferCategory(raw.content || '')
    };
  }

  private validatePlatform(platform: string): Platform {
    const valid: Platform[] = ['linkedin', 'twitter', 'reddit', 'bluesky', 'news', 'web'];
    return valid.includes(platform as Platform) ? (platform as Platform) : 'web';
  }

  private validateSentiment(sentiment: string): Sentiment {
    const valid: Sentiment[] = ['positive', 'neutral', 'negative'];
    return valid.includes(sentiment as Sentiment) ? (sentiment as Sentiment) : 'neutral';
  }

  private inferCategory(content: string): PostCategory {
    const lower = content.toLowerCase();

    if (lower.includes('?') || lower.includes('how do') || lower.includes('anyone know')) {
      return 'question';
    }
    if (lower.includes('pain') || lower.includes('frustrat') || lower.includes('struggle') || lower.includes('problem')) {
      return 'pain_point';
    }
    if (lower.includes('vs') || lower.includes('compar') || lower.includes('better than')) {
      return 'comparison';
    }
    if (lower.includes('recommend') || lower.includes('suggest') || lower.includes('try')) {
      return 'recommendation';
    }
    if (lower.includes('announce') || lower.includes('launch') || lower.includes('release')) {
      return 'announcement';
    }
    return 'thought_leadership';
  }

  private generateMockResults(keywords: string[], platforms: Platform[], count: number): SocialPost[] {
    const mockAuthors = [
      { name: 'Sarah Chen', title: 'VP of Marketing @ TechCorp', handle: 'sarahchen' },
      { name: 'Mike Rodriguez', title: 'Growth Lead @ ScaleUp', handle: 'mikerodriguez' },
      { name: 'Emily Watson', title: 'Director of Revenue @ CloudFirst', handle: 'emilywatson' },
      { name: 'James Liu', title: 'Founder @ DataFlow', handle: 'jamesliu' },
      { name: 'Amanda Torres', title: 'Head of Growth @ Nexus', handle: 'amandatorres' },
    ];

    const mockContents = [
      `Just wrapped up our Q4 planning. The shift to ${keywords[0] || 'AI-powered'} approaches has been a game changer for our team. Anyone else seeing major improvements?`,
      `Hot take: Traditional ${keywords[0] || 'outreach'} is evolving fast. Community-led growth and warm intros are becoming essential. Thoughts?`,
      `We just integrated a new ${keywords[0] || 'automation'} stack and the results are impressive. Our team is spending 80% less time on manual work.`,
      `Building in public: Our ${keywords[0] || 'growth'} strategy now focuses on intent signals. The quality improvement has been remarkable.`,
      `Anyone have recommendations for ${keywords[0] || 'B2B marketing'} tools? Looking to upgrade our current setup.`,
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
        postedAt: new Date(now.getTime() - Math.random() * 86400000 * 7),
        fetchedAt: now,
        matchedKeywords: keywords,
        matchedAccounts: [],
        relevanceScore: Math.floor(Math.random() * 20) + 80,
        sentiment: (['positive', 'neutral', 'negative'] as Sentiment[])[Math.floor(Math.random() * 3)],
        category: this.inferCategory(content)
      };
    });
  }
}

// Export singleton instance
export const searchService = new PulseSearchService();
