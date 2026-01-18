// ============================================================================
// CONTENT SERVICE - Templates & SOPs Management
// ============================================================================

import { ContentTemplate, SOP, ContentType, SOPType, TeamMember } from '../types';
import { ContentService, CreateTemplateInput } from './index';

const generateId = () => Math.random().toString(36).substring(2, 15);

// In-memory storage
let templates: ContentTemplate[] = [];
let sops: SOP[] = [];

// Default team member for created content
const systemUser: TeamMember = {
  id: 'system',
  email: 'system@nexus.app',
  name: 'System',
  role: 'admin',
  permissions: [],
  assignedAccounts: [],
  capacity: { maxAccounts: 0, currentAccounts: 0 },
  performance: { responsesThisWeek: 0, avgResponseTime: 0, meetingsBooked: 0 }
};

// Sample templates
const SAMPLE_TEMPLATES: ContentTemplate[] = [
  {
    id: 'tpl_1',
    type: 'social_comment',
    name: 'Helpful Value Add',
    category: 'Community Engagement',
    content: "Great insights here! At {{companyName}}, we've seen similar patterns. Would love to connect and share notes on {{topic}}.",
    variables: ['companyName', 'topic'],
    usageCount: 45,
    performance: { sent: 45, replies: 18, replyRate: 0.4, avgSentiment: 0.75 },
    tags: ['high-performing', 'engagement'],
    createdBy: systemUser,
    createdAt: new Date(Date.now() - 30 * 86400000),
    updatedAt: new Date()
  },
  {
    id: 'tpl_2',
    type: 'social_comment',
    name: 'Curious Question',
    category: 'Community Engagement',
    content: "This resonates! Curious - how are you handling {{challenge}}? We've been exploring a few approaches.",
    variables: ['challenge'],
    usageCount: 32,
    performance: { sent: 32, replies: 14, replyRate: 0.44, avgSentiment: 0.8 },
    tags: ['high-performing', 'question'],
    createdBy: systemUser,
    createdAt: new Date(Date.now() - 25 * 86400000),
    updatedAt: new Date()
  },
  {
    id: 'tpl_3',
    type: 'linkedin_message',
    name: 'Warm Connection Request',
    category: 'Outreach',
    content: "Hi {{firstName}}, I noticed you're doing great work at {{company}} in {{area}}. Would love to connect and exchange ideas on {{topic}}.",
    variables: ['firstName', 'company', 'area', 'topic'],
    usageCount: 78,
    performance: { sent: 78, replies: 31, replyRate: 0.4, avgSentiment: 0.65 },
    tags: ['outreach', 'linkedin'],
    createdBy: systemUser,
    createdAt: new Date(Date.now() - 60 * 86400000),
    updatedAt: new Date()
  },
  {
    id: 'tpl_4',
    type: 'email_outreach',
    name: 'Intent-Based Outreach',
    category: 'Outreach',
    content: "Hi {{firstName}},\n\nI noticed {{company}} has been researching {{intentTopic}}. Given your role as {{title}}, I thought you might be interested in how we've helped similar companies.\n\nWould you be open to a 15-minute call this week?\n\nBest,\n{{senderName}}",
    variables: ['firstName', 'company', 'intentTopic', 'title', 'senderName'],
    usageCount: 120,
    performance: { sent: 120, replies: 36, replyRate: 0.3, avgSentiment: 0.55 },
    tags: ['outreach', 'email', 'intent-based'],
    createdBy: systemUser,
    createdAt: new Date(Date.now() - 90 * 86400000),
    updatedAt: new Date()
  },
  {
    id: 'tpl_5',
    type: 'follow_up',
    name: 'Gentle Nudge',
    category: 'Follow-up',
    content: "Hi {{firstName}}, wanted to circle back on my previous message. I understand you're busy - would a quick 10-minute call work better? Happy to work around your schedule.",
    variables: ['firstName'],
    usageCount: 55,
    performance: { sent: 55, replies: 11, replyRate: 0.2, avgSentiment: 0.5 },
    tags: ['follow-up'],
    createdBy: systemUser,
    createdAt: new Date(Date.now() - 45 * 86400000),
    updatedAt: new Date()
  },
  {
    id: 'tpl_6',
    type: 'objection_handler',
    name: 'Not the Right Time',
    category: 'Objection Handling',
    content: "Totally understand, {{firstName}}. Would it be helpful if I sent over some resources you could review when the timing is better? Happy to reconnect in {{timeframe}}.",
    variables: ['firstName', 'timeframe'],
    usageCount: 28,
    performance: { sent: 28, replies: 15, replyRate: 0.54, avgSentiment: 0.7 },
    tags: ['objection', 'timing'],
    createdBy: systemUser,
    createdAt: new Date(Date.now() - 20 * 86400000),
    updatedAt: new Date()
  },
  {
    id: 'tpl_7',
    type: 'case_study_snippet',
    name: 'Results Teaser',
    category: 'Social Proof',
    content: "We helped {{customerType}} achieve {{result}} in just {{timeframe}}. Happy to share how if you're interested!",
    variables: ['customerType', 'result', 'timeframe'],
    usageCount: 22,
    performance: { sent: 22, replies: 8, replyRate: 0.36, avgSentiment: 0.72 },
    tags: ['social-proof', 'case-study'],
    createdBy: systemUser,
    createdAt: new Date(Date.now() - 15 * 86400000),
    updatedAt: new Date()
  }
];

// Sample SOPs
const SAMPLE_SOPS: SOP[] = [
  {
    id: 'sop_1',
    name: 'Professional Friendly Tone',
    type: 'tone',
    category: 'Brand Voice',
    content: 'Maintain a helpful, professional, yet conversational tone. Avoid corporate jargon. Be human and approachable while remaining credible.',
    conditions: [],
    priority: 1,
    isActive: true,
    createdAt: new Date(Date.now() - 90 * 86400000),
    updatedAt: new Date()
  },
  {
    id: 'sop_2',
    name: 'No Direct Pitching',
    type: 'rule',
    category: 'Engagement Rules',
    content: 'Never pitch products or services directly in social comments. Focus on adding value, sharing insights, or asking thoughtful questions. Sales conversations should happen in DMs or calls.',
    conditions: [{ field: 'type', operator: 'equals', value: 'social_comment' }],
    priority: 2,
    isActive: true,
    createdAt: new Date(Date.now() - 90 * 86400000),
    updatedAt: new Date()
  },
  {
    id: 'sop_3',
    name: 'Crisis Escalation',
    type: 'escalation',
    category: 'Crisis Management',
    content: 'If the user is reporting a severe bug, outage, or expressing significant frustration, do not make jokes. Apologize sincerely, acknowledge their frustration, and offer to move to DM for direct support. Tag @support in internal notes.',
    conditions: [{ field: 'sentiment', operator: 'equals', value: 'negative' }],
    priority: 1,
    isActive: true,
    createdAt: new Date(Date.now() - 60 * 86400000),
    updatedAt: new Date()
  },
  {
    id: 'sop_4',
    name: 'Competitor Mention Guidelines',
    type: 'rule',
    category: 'Competitive',
    content: 'When competitors are mentioned: Never badmouth competitors. Acknowledge their strengths if relevant. Redirect focus to our unique value propositions. If asked for direct comparison, offer to share a detailed comparison doc via DM.',
    conditions: [{ field: 'category', operator: 'equals', value: 'competitor_mention' }],
    priority: 2,
    isActive: true,
    createdAt: new Date(Date.now() - 45 * 86400000),
    updatedAt: new Date()
  },
  {
    id: 'sop_5',
    name: 'VIP Account Treatment',
    type: 'approval_required',
    category: 'Account Handling',
    content: 'For accounts with score >= 90 or tagged as "enterprise": All outreach requires manager approval before sending. Responses should be prioritized and personalized. Flag for account executive review.',
    conditions: [
      { field: 'accountScore', operator: 'gt', value: 90 },
      { field: 'tags', operator: 'contains', value: 'enterprise' }
    ],
    priority: 1,
    isActive: true,
    createdAt: new Date(Date.now() - 30 * 86400000),
    updatedAt: new Date()
  },
  {
    id: 'sop_6',
    name: 'Influencer Engagement',
    type: 'template',
    category: 'Engagement Rules',
    content: 'For posts from authors with 10k+ followers: Be extra thoughtful with responses. Avoid anything that could be seen as promotional. Focus purely on adding value to the conversation. These interactions have high visibility.',
    conditions: [{ field: 'authorFollowers', operator: 'gt', value: 10000 }],
    priority: 2,
    isActive: true,
    createdAt: new Date(Date.now() - 20 * 86400000),
    updatedAt: new Date()
  },
  {
    id: 'sop_7',
    name: 'Response Time SLA',
    type: 'rule',
    category: 'Operations',
    content: 'Hot leads (score >= 80): Respond within 2 hours during business hours. Warm leads (score 60-79): Respond within 24 hours. Cold leads: Respond within 48 hours. All inbound messages should be acknowledged same day.',
    conditions: [],
    priority: 3,
    isActive: true,
    createdAt: new Date(Date.now() - 15 * 86400000),
    updatedAt: new Date()
  }
];

templates = [...SAMPLE_TEMPLATES];
sops = [...SAMPLE_SOPS];

export class LocalContentService implements ContentService {

  // Templates
  async getTemplates(type?: ContentType[], category?: string): Promise<ContentTemplate[]> {
    let filtered = [...templates];

    if (type?.length) {
      filtered = filtered.filter(t => type.includes(t.type));
    }

    if (category) {
      filtered = filtered.filter(t => t.category === category);
    }

    // Sort by performance (reply rate)
    filtered.sort((a, b) => b.performance.replyRate - a.performance.replyRate);

    return filtered;
  }

  async getTemplate(id: string): Promise<ContentTemplate | null> {
    return templates.find(t => t.id === id) || null;
  }

  async createTemplate(data: CreateTemplateInput): Promise<ContentTemplate> {
    const now = new Date();
    const template: ContentTemplate = {
      id: generateId(),
      type: data.type,
      name: data.name,
      category: data.category,
      content: data.content,
      variables: data.variables || this.extractVariables(data.content),
      usageCount: 0,
      performance: { sent: 0, replies: 0, replyRate: 0, avgSentiment: 0 },
      tags: data.tags || [],
      createdBy: systemUser,
      createdAt: now,
      updatedAt: now
    };

    templates.push(template);
    return template;
  }

  async updateTemplate(id: string, data: Partial<ContentTemplate>): Promise<ContentTemplate> {
    const index = templates.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Template not found');

    templates[index] = {
      ...templates[index],
      ...data,
      updatedAt: new Date()
    };

    // Re-extract variables if content changed
    if (data.content) {
      templates[index].variables = this.extractVariables(data.content);
    }

    return templates[index];
  }

  async deleteTemplate(id: string): Promise<void> {
    const index = templates.findIndex(t => t.id === id);
    if (index !== -1) {
      templates.splice(index, 1);
    }
  }

  // SOPs
  async getSOPs(type?: SOPType[], activeOnly: boolean = false): Promise<SOP[]> {
    let filtered = [...sops];

    if (type?.length) {
      filtered = filtered.filter(s => type.includes(s.type));
    }

    if (activeOnly) {
      filtered = filtered.filter(s => s.isActive);
    }

    // Sort by priority
    filtered.sort((a, b) => a.priority - b.priority);

    return filtered;
  }

  async getSOP(id: string): Promise<SOP | null> {
    return sops.find(s => s.id === id) || null;
  }

  async createSOP(data: Omit<SOP, 'id' | 'createdAt' | 'updatedAt'>): Promise<SOP> {
    const now = new Date();
    const sop: SOP = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now
    };

    sops.push(sop);
    return sop;
  }

  async updateSOP(id: string, data: Partial<SOP>): Promise<SOP> {
    const index = sops.findIndex(s => s.id === id);
    if (index === -1) throw new Error('SOP not found');

    sops[index] = {
      ...sops[index],
      ...data,
      updatedAt: new Date()
    };

    return sops[index];
  }

  async deleteSOP(id: string): Promise<void> {
    const index = sops.findIndex(s => s.id === id);
    if (index !== -1) {
      sops.splice(index, 1);
    }
  }

  async toggleSOP(id: string): Promise<SOP> {
    const index = sops.findIndex(s => s.id === id);
    if (index === -1) throw new Error('SOP not found');

    sops[index].isActive = !sops[index].isActive;
    sops[index].updatedAt = new Date();

    return sops[index];
  }

  // Usage tracking
  async recordTemplateUsage(templateId: string, success: boolean): Promise<void> {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    template.usageCount++;
    template.performance.sent++;
    if (success) {
      template.performance.replies++;
    }
    template.performance.replyRate = template.performance.replies / template.performance.sent;
    template.updatedAt = new Date();
  }

  // Helper methods
  private extractVariables(content: string): string[] {
    const matches = content.match(/\{\{(\w+)\}\}/g) || [];
    return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))];
  }

  getCategories(): { templates: string[]; sops: string[] } {
    const templateCategories = [...new Set(templates.map(t => t.category))];
    const sopCategories = [...new Set(sops.map(s => s.category))];
    return { templates: templateCategories, sops: sopCategories };
  }

  getTopPerforming(limit: number = 5): ContentTemplate[] {
    return [...templates]
      .filter(t => t.performance.sent >= 10) // Minimum sample size
      .sort((a, b) => b.performance.replyRate - a.performance.replyRate)
      .slice(0, limit);
  }
}

// Export singleton instance
export const contentService = new LocalContentService();
