// ============================================================================
// AI SERVICE - Gemini/Claude/OpenAI Integration
// ============================================================================

import { GoogleGenAI } from '@google/genai';
import {
  SocialPost, Account, Contact, SOP, ContentTemplate, Channel, Sentiment, PostCategory
} from '../types';
import { AIService, GeneratedContent, AIGenerateCommentParams, AIGenerateOutreachParams, InsightResult } from './index';

// Load API key from localStorage or environment (Vite-compatible)
const getApiKey = (): string => {
  // First check localStorage (user-configured in Settings)
  if (typeof window !== 'undefined') {
    const settings = localStorage.getItem('nexus-settings');
    if (settings) {
      try {
        const parsed = JSON.parse(settings);
        if (parsed.state?.aiConfig?.apiKey) {
          return parsed.state.aiConfig.apiKey;
        }
      } catch (e) {
        console.warn('Error parsing settings from localStorage:', e);
      }
    }
  }

  // Fall back to environment variables (Vite syntax for browser)
  // VITE_ prefix is required for client-side access
  return import.meta.env.VITE_GEMINI_API_KEY ||
         import.meta.env.VITE_API_KEY ||
         '';
};

export class GeminiAIService implements AIService {
  private client: GoogleGenAI | null = null;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    const apiKey = getApiKey();
    if (apiKey) {
      this.client = new GoogleGenAI({ apiKey });
    }
  }

  private async generate(prompt: string): Promise<string> {
    // Re-initialize if client is null but API key is now available
    if (!this.client) {
      this.initializeClient();
    }

    if (!this.client) {
      throw new Error('AI client not initialized. Please add your Gemini API key in Settings.');
    }

    const response = await this.client.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    return response.text || '';
  }

  // Simple comment generation for ReplyModal
  async generateSimpleComment(params: {
    post: SocialPost;
    tone?: string;
    sop?: SOP;
    maxLength?: number;
  }): Promise<string> {
    const { post, tone = 'helpful', sop, maxLength = 280 } = params;

    const sopInstructions = sop
      ? `\nFollow this SOP: ${sop.name}\n${sop.content}`
      : '';

    const prompt = `Generate a ${tone} reply to this ${post.platform} post.

POST:
Author: ${post.author.name} (${post.author.title || 'Professional'})
Content: "${post.content}"
${sopInstructions}

RULES:
- Keep it under ${maxLength} characters
- Be ${tone} in tone
- Add genuine value, don't just agree
- No hashtags or emojis unless natural
- Sound human, not like AI
- Encourage further conversation

Generate ONLY the reply text, nothing else:`;

    try {
      const response = await this.generate(prompt);
      return response.trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
    } catch (error) {
      console.error('Error generating comment:', error);
      throw error;
    }
  }

  async generateComment(params: AIGenerateCommentParams): Promise<GeneratedContent> {
    const { post, account, sops, template, tone } = params;

    const activeSOPs = sops.filter(s => s.isActive);
    const sopInstructions = activeSOPs.map(s => `- ${s.name}: ${s.content}`).join('\n');

    const contextInfo = account
      ? `\nContext: This post is from someone at ${account.company.name}, a ${account.score.tier} priority account in our pipeline.`
      : '';

    const templateInfo = template
      ? `\nUse this template as a base: ${template.content}`
      : '';

    const prompt = `You are a B2B social media engagement specialist. Generate a thoughtful, authentic comment for this social media post.

POST TO COMMENT ON:
Platform: ${post.platform}
Author: ${post.author.name} (${post.author.title || 'Professional'})
Content: "${post.content}"
${contextInfo}

GUIDELINES:
${sopInstructions || '- Be professional yet conversational\n- Add value, don\'t just agree\n- Keep it concise (2-3 sentences max)'}

${tone ? `Tone: ${tone}` : ''}
${templateInfo}

IMPORTANT:
- Don't be salesy or pitch anything directly
- Add genuine value or insight
- Be conversational, not corporate
- No hashtags unless natural
- Match the platform's tone (${post.platform})

Generate a single comment that would naturally encourage further conversation:`;

    try {
      const content = await this.generate(prompt);

      return {
        content: content.trim(),
        confidence: 0.85,
        appliedSOPs: activeSOPs.map(s => s.id),
        alternatives: []
      };
    } catch (error) {
      console.error('Error generating comment:', error);
      return {
        content: "Great insights here! Would love to hear more about your experience with this approach.",
        confidence: 0.5,
        appliedSOPs: [],
        alternatives: []
      };
    }
  }

  async generateOutreach(params: AIGenerateOutreachParams): Promise<GeneratedContent> {
    const { contact, account, channel, template, context } = params;

    const channelGuidelines: Record<Channel, string> = {
      linkedin: 'Keep it professional but personable. Max 300 characters for connection request, longer for InMail.',
      twitter: 'Very casual and brief. Max 280 characters.',
      email: 'Professional email format with clear subject line suggestion.',
      phone: 'Generate a call script with key talking points.',
      meeting: 'Generate meeting agenda and talking points.',
      other: 'Professional and clear communication.'
    };

    const intentSignals = account.intentSignals
      .slice(0, 3)
      .map(s => `- ${s.description}`)
      .join('\n');

    const prompt = `You are a B2B sales development representative. Generate personalized outreach for this contact.

CONTACT:
Name: ${contact.firstName} ${contact.lastName}
Title: ${contact.title}
Company: ${account.company.name}
Industry: ${account.company.industry}
Company Size: ${account.company.size}

INTENT SIGNALS:
${intentSignals || '- No specific signals detected'}

CHANNEL: ${channel}
GUIDELINES: ${channelGuidelines[channel]}

${template ? `TEMPLATE TO USE:\n${template.content}` : ''}
${context ? `ADDITIONAL CONTEXT:\n${context}` : ''}

Generate personalized outreach that:
1. References something specific about them or their company
2. Mentions a relevant pain point or opportunity
3. Provides a clear, low-friction call to action
4. Sounds human, not automated

Output format:
${channel === 'email' ? 'Subject: [subject line]\n\n[email body]' : '[message]'}`;

    try {
      const content = await this.generate(prompt);

      return {
        content: content.trim(),
        confidence: 0.8,
        appliedSOPs: [],
        alternatives: []
      };
    } catch (error) {
      console.error('Error generating outreach:', error);
      return {
        content: `Hi ${contact.firstName}, I noticed ${account.company.name} has been exploring solutions in this space. Would you be open to a quick chat?`,
        confidence: 0.4,
        appliedSOPs: [],
        alternatives: []
      };
    }
  }

  async generateInsight(brand: string, posts: SocialPost[], type: 'strategic' | 'competitive' | 'crisis'): Promise<InsightResult> {
    const postSummaries = posts.slice(0, 10).map(p =>
      `- [${p.platform}] ${p.author.name}: "${p.content.substring(0, 150)}..." (${p.sentiment} sentiment, ${p.engagement.likes} likes)`
    ).join('\n');

    const typeInstructions = {
      strategic: 'Identify opportunities, trends, and strategic recommendations for brand positioning.',
      competitive: 'Analyze competitor mentions, market positioning, and competitive threats/opportunities.',
      crisis: 'Assess potential PR risks, negative sentiment patterns, and crisis mitigation strategies.'
    };

    const prompt = `You are a strategic brand analyst. Analyze these social mentions for ${brand}.

RECENT MENTIONS:
${postSummaries}

ANALYSIS TYPE: ${type}
FOCUS: ${typeInstructions[type]}

Provide a structured analysis with:
1. SUMMARY: 2-3 sentence executive summary
2. KEY POINTS: 3-5 bullet points of important findings
3. RECOMMENDATIONS: 3-5 actionable next steps
4. URGENCY: Rate as low/medium/high based on findings

Format your response as JSON:
{
  "summary": "...",
  "keyPoints": ["...", "..."],
  "recommendations": ["...", "..."],
  "urgency": "low|medium|high"
}`;

    try {
      const response = await this.generate(prompt);
      const parsed = JSON.parse(response);

      return {
        summary: parsed.summary || 'Unable to generate summary.',
        keyPoints: parsed.keyPoints || [],
        recommendations: parsed.recommendations || [],
        urgency: parsed.urgency || 'medium'
      };
    } catch (error) {
      console.error('Error generating insight:', error);
      return {
        summary: `Analysis of ${posts.length} mentions for ${brand}. Mixed sentiment detected across platforms.`,
        keyPoints: [
          'Multiple discussions detected across platforms',
          'Engagement levels vary by content type',
          'Further monitoring recommended'
        ],
        recommendations: [
          'Continue monitoring key conversations',
          'Engage with high-relevance posts',
          'Track sentiment trends over time'
        ],
        urgency: 'medium'
      };
    }
  }

  async analyzeSentiment(content: string): Promise<{ sentiment: Sentiment; score: number }> {
    const prompt = `Analyze the sentiment of this text and respond with JSON only:
"${content}"

Response format: {"sentiment": "positive|neutral|negative", "score": 0.0-1.0}`;

    try {
      const response = await this.generate(prompt);
      const parsed = JSON.parse(response);
      return {
        sentiment: parsed.sentiment || 'neutral',
        score: parsed.score || 0.5
      };
    } catch {
      return { sentiment: 'neutral', score: 0.5 };
    }
  }

  async categorizePost(post: SocialPost): Promise<PostCategory> {
    const prompt = `Categorize this social media post into ONE of these categories:
- pain_point: User expressing a problem or frustration
- question: User asking for help or information
- comparison: Comparing products/services
- recommendation: Recommending something
- announcement: Company/product announcement
- thought_leadership: Industry insights/opinions
- competitor_mention: Mentions a competitor
- brand_mention: Mentions our brand

Post: "${post.content}"

Respond with just the category name:`;

    try {
      const response = await this.generate(prompt);
      const category = response.trim().toLowerCase().replace(/[^a-z_]/g, '');
      const validCategories: PostCategory[] = [
        'pain_point', 'question', 'comparison', 'recommendation',
        'announcement', 'thought_leadership', 'competitor_mention', 'brand_mention'
      ];
      return validCategories.includes(category as PostCategory)
        ? (category as PostCategory)
        : 'thought_leadership';
    } catch {
      return 'thought_leadership';
    }
  }

  async extractIntent(content: string): Promise<string[]> {
    const prompt = `Extract buying intent signals from this content. List any indicators that suggest the person might be:
- Researching solutions
- Comparing vendors
- Ready to buy
- Experiencing a problem we can solve
- Looking for recommendations

Content: "${content}"

Respond with a JSON array of intent signals found, or empty array if none:
["signal1", "signal2"]`;

    try {
      const response = await this.generate(prompt);
      return JSON.parse(response) || [];
    } catch {
      return [];
    }
  }

  async applySOP(content: string, sops: SOP[]): Promise<string> {
    const activeSOPs = sops.filter(s => s.isActive);
    if (activeSOPs.length === 0) return content;

    const sopRules = activeSOPs.map(s => `- ${s.name}: ${s.content}`).join('\n');

    const prompt = `Revise this message to comply with these guidelines:

GUIDELINES:
${sopRules}

ORIGINAL MESSAGE:
${content}

Provide the revised message only, no explanation:`;

    try {
      return await this.generate(prompt);
    } catch {
      return content;
    }
  }
}

// Export singleton instance
export const aiService = new GeminiAIService();
