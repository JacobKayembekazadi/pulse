// ============================================================================
// AI SERVICE - Multi-Provider Support (Gemini, OpenAI, Anthropic)
// Production-ready with proper provider switching
// ============================================================================

import { GoogleGenAI } from '@google/genai';
import {
  SocialPost, Account, Contact, SOP, ContentTemplate, Channel, Sentiment, PostCategory
} from '../types';
import { AIService, GeneratedContent, AIGenerateCommentParams, AIGenerateOutreachParams, InsightResult } from './index';

type AIProvider = 'google' | 'openai' | 'anthropic';

interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
  settings: {
    temperature: number;
    maxTokens?: number;
    defaultTone: string;
  };
}

// Get AI config from localStorage or environment
const getAIConfig = (): AIConfig => {
  const defaults: AIConfig = {
    provider: 'google',
    apiKey: '',
    model: 'gemini-2.0-flash',
    settings: {
      temperature: 0.7,
      maxTokens: 1000,
      defaultTone: 'professional'
    }
  };

  // Check localStorage first (user-configured in Settings)
  if (typeof window !== 'undefined') {
    const settings = localStorage.getItem('nexus-settings');
    if (settings) {
      try {
        const parsed = JSON.parse(settings);
        if (parsed.state?.aiConfig) {
          return {
            provider: parsed.state.aiConfig.provider || defaults.provider,
            apiKey: parsed.state.aiConfig.apiKey || '',
            model: parsed.state.aiConfig.model || defaults.model,
            settings: {
              temperature: parsed.state.aiConfig.settings?.temperature ?? defaults.settings.temperature,
              maxTokens: parsed.state.aiConfig.settings?.maxTokens ?? defaults.settings.maxTokens,
              defaultTone: parsed.state.aiConfig.settings?.defaultTone || defaults.settings.defaultTone
            }
          };
        }
      } catch (e) {
        console.warn('Error parsing AI config from localStorage:', e);
      }
    }
  }

  // Fall back to environment variables
  const envKey = import.meta.env.VITE_GEMINI_API_KEY ||
                 import.meta.env.VITE_OPENAI_API_KEY ||
                 import.meta.env.VITE_ANTHROPIC_API_KEY || '';

  if (import.meta.env.VITE_OPENAI_API_KEY) {
    defaults.provider = 'openai';
    defaults.model = 'gpt-4o-mini';
  } else if (import.meta.env.VITE_ANTHROPIC_API_KEY) {
    defaults.provider = 'anthropic';
    defaults.model = 'claude-3-5-haiku-20241022';
  }

  defaults.apiKey = envKey;
  return defaults;
};

// ============================================================================
// GEMINI PROVIDER
// ============================================================================
class GeminiProvider {
  private client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async generate(prompt: string, model: string, temperature: number): Promise<string> {
    const response = await this.client.models.generateContent({
      model: model || 'gemini-2.0-flash',
      contents: prompt,
      config: {
        temperature
      }
    });
    return response.text || '';
  }
}

// ============================================================================
// OPENAI PROVIDER
// ============================================================================
class OpenAIProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generate(prompt: string, model: string, temperature: number): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API error');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }
}

// ============================================================================
// ANTHROPIC PROVIDER
// ============================================================================
class AnthropicProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generate(prompt: string, model: string, temperature: number): Promise<string> {
    // Note: Anthropic requires server-side calls due to CORS
    // For browser-based apps, you'd need a proxy endpoint
    // This implementation assumes a proxy at /api/anthropic or direct server usage
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true' // For development only
      },
      body: JSON.stringify({
        model: model || 'claude-3-5-haiku-20241022',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
        temperature
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Anthropic API error');
    }

    const data = await response.json();
    return data.content[0]?.text || '';
  }
}

// ============================================================================
// MULTI-PROVIDER AI SERVICE
// ============================================================================
export class MultiProviderAIService implements AIService {
  private config: AIConfig;
  private provider: GeminiProvider | OpenAIProvider | AnthropicProvider | null = null;

  constructor() {
    this.config = getAIConfig();
    this.initializeProvider();
  }

  private initializeProvider() {
    if (!this.config.apiKey) {
      this.provider = null;
      return;
    }

    switch (this.config.provider) {
      case 'google':
        this.provider = new GeminiProvider(this.config.apiKey);
        break;
      case 'openai':
        this.provider = new OpenAIProvider(this.config.apiKey);
        break;
      case 'anthropic':
        this.provider = new AnthropicProvider(this.config.apiKey);
        break;
    }
  }

  // Refresh config and provider (call when settings change)
  public refresh() {
    this.config = getAIConfig();
    this.initializeProvider();
  }

  private async generate(prompt: string): Promise<string> {
    // Re-check config in case it changed
    const currentConfig = getAIConfig();
    if (currentConfig.apiKey !== this.config.apiKey || currentConfig.provider !== this.config.provider) {
      this.config = currentConfig;
      this.initializeProvider();
    }

    if (!this.provider) {
      throw new Error(`AI not configured. Please add your ${this.config.provider === 'google' ? 'Gemini' : this.config.provider === 'openai' ? 'OpenAI' : 'Anthropic'} API key in Settings.`);
    }

    return this.provider.generate(prompt, this.config.model, this.config.settings.temperature);
  }

  // Get current provider name for UI display
  getProviderName(): string {
    const names = { google: 'Gemini', openai: 'OpenAI', anthropic: 'Claude' };
    return names[this.config.provider];
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
      // Try to parse JSON, handling potential markdown code blocks
      const jsonStr = response.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(jsonStr);

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
      const jsonStr = response.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(jsonStr);
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
      const jsonStr = response.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(jsonStr) || [];
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
export const aiService = new MultiProviderAIService();
