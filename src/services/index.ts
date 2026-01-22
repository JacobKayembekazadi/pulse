// ============================================================================
// NEXUS PLATFORM - SERVICE INTERFACES & IMPLEMENTATIONS
// ============================================================================

import {
  Account, AccountFilters, Contact, SocialPost, PostFilters, Conversation,
  ConversationFilters, Campaign, CampaignMetrics, Competitor, CompetitorMention,
  ContentTemplate, SOP, IntentSignal, LeadScore, Engagement, HotMoment,
  TimingInsight, Attribution, PaginatedResult, Platform, TimeFrame, Channel,
  WorkspaceSettings, Integration, Message, Company, Sentiment, PostCategory
} from '../types';

// ============================================
// SEARCH SERVICE
// ============================================

export interface SearchParams {
  keywords: string[];
  platforms: Platform[];
  timeframe: TimeFrame;
  accountFilter?: string[];
  maxResults?: number;
}

export interface SearchService {
  search(params: SearchParams): Promise<SocialPost[]>;
  searchWithPulse(params: SearchParams): Promise<SocialPost[]>;
  searchWithApify(params: SearchParams): Promise<SocialPost[]>;
  subscribeToKeywords(keywords: string[], callback: (post: SocialPost) => void): () => void;
}

// ============================================
// ACCOUNTS SERVICE
// ============================================

export interface CreateAccountInput {
  company: Partial<Company>;
  tags?: string[];
  lists?: string[];
}

export interface UpdateAccountInput {
  company?: Partial<Company>;
  stage?: Account['stage'];
  tags?: string[];
  lists?: string[];
  ownerId?: string;
}

export interface CreateContactInput {
  firstName: string;
  lastName: string;
  email?: string;
  title: string;
  role: Contact['role'];
  seniority: Contact['seniority'];
  department: Contact['department'];
  socialProfiles?: Contact['socialProfiles'];
}

export interface AccountsService {
  getAccounts(filters: AccountFilters, page?: number, pageSize?: number): Promise<PaginatedResult<Account>>;
  getAccount(id: string): Promise<Account | null>;
  createAccount(data: CreateAccountInput): Promise<Account>;
  updateAccount(id: string, data: UpdateAccountInput): Promise<Account>;
  deleteAccount(id: string): Promise<void>;

  // Contacts
  addContact(accountId: string, contact: CreateContactInput): Promise<Contact>;
  updateContact(contactId: string, data: Partial<Contact>): Promise<Contact>;
  removeContact(contactId: string): Promise<void>;

  // Scoring
  recalculateScore(accountId: string): Promise<LeadScore>;
  getScoreHistory(accountId: string, days?: number): Promise<{ date: Date; score: number }[]>;

  // Intent
  getIntentSignals(accountId: string): Promise<IntentSignal[]>;
  addIntentSignal(accountId: string, signal: Omit<IntentSignal, 'id' | 'accountId'>): Promise<IntentSignal>;

  // Matching
  matchPostToAccount(post: SocialPost): Promise<Account | null>;
  findSimilarAccounts(accountId: string): Promise<Account[]>;
}

// ============================================
// AI SERVICE
// ============================================

export interface GeneratedContent {
  content: string;
  confidence: number;
  alternatives?: string[];
  appliedSOPs: string[];
}

export interface AIGenerateCommentParams {
  post: SocialPost;
  account?: Account;
  sops: SOP[];
  template?: ContentTemplate;
  tone?: string;
}

export interface AIGenerateOutreachParams {
  contact: Contact;
  account: Account;
  channel: Channel;
  template?: ContentTemplate;
  context?: string;
}

export interface InsightResult {
  summary: string;
  keyPoints: string[];
  recommendations: string[];
  urgency: 'low' | 'medium' | 'high';
}

export interface AIService {
  generateComment(params: AIGenerateCommentParams): Promise<GeneratedContent>;
  generateOutreach(params: AIGenerateOutreachParams): Promise<GeneratedContent>;
  generateInsight(brand: string, posts: SocialPost[], type: 'strategic' | 'competitive' | 'crisis'): Promise<InsightResult>;
  analyzeSentiment(content: string): Promise<{ sentiment: Sentiment; score: number }>;
  categorizePost(post: SocialPost): Promise<PostCategory>;
  extractIntent(content: string): Promise<string[]>;
  applySOP(content: string, sops: SOP[]): Promise<string>;
}

// ============================================
// INBOX SERVICE
// ============================================

export interface CreateConversationInput {
  accountId?: string;
  contactId?: string;
  channel: Channel;
  subject?: string;
  initialMessage: string;
}

export interface CreateMessageInput {
  content: string;
  attachments?: { name: string; url: string; type: string; size: number }[];
}

export interface InboxService {
  getConversations(filters: ConversationFilters, page?: number, pageSize?: number): Promise<PaginatedResult<Conversation>>;
  getConversation(id: string): Promise<Conversation | null>;
  createConversation(params: CreateConversationInput): Promise<Conversation>;

  // Messages
  addMessage(conversationId: string, message: CreateMessageInput): Promise<Message>;

  // Actions
  assignConversation(id: string, teamMemberId: string): Promise<void>;
  updateStatus(id: string, status: Conversation['status']): Promise<void>;
  updatePriority(id: string, priority: Conversation['priority']): Promise<void>;
  addTag(id: string, tag: string): Promise<void>;
  removeTag(id: string, tag: string): Promise<void>;

  // Sync
  syncFromPlatform(platform: Platform): Promise<{ added: number; updated: number }>;
}

// ============================================
// ENRICHMENT SERVICE
// ============================================

export interface EnrichmentService {
  enrichCompany(domain: string): Promise<Partial<Company>>;
  enrichContact(email: string): Promise<Partial<Contact>>;
  findContacts(domain: string, roles?: string[]): Promise<Partial<Contact>[]>;
  detectTechStack(domain: string): Promise<string[]>;
  batchEnrich(domains: string[]): Promise<Map<string, Partial<Company>>>;
}

// ============================================
// CAMPAIGN SERVICE
// ============================================

export interface CreateCampaignInput {
  name: string;
  type: Campaign['type'];
  targeting: Campaign['targeting'];
  templates?: string[];
  sops?: string[];
  startDate?: Date;
  endDate?: Date;
}

export interface CampaignService {
  getCampaigns(status?: Campaign['status'][]): Promise<Campaign[]>;
  getCampaign(id: string): Promise<Campaign | null>;
  createCampaign(data: CreateCampaignInput): Promise<Campaign>;
  updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign>;
  deleteCampaign(id: string): Promise<void>;

  // Execution
  launchCampaign(id: string): Promise<void>;
  pauseCampaign(id: string): Promise<void>;
  completeCampaign(id: string): Promise<void>;

  // Metrics
  getCampaignMetrics(id: string): Promise<CampaignMetrics>;
  getAttribution(campaignId: string): Promise<Attribution[]>;
}

// ============================================
// COMPETITIVE SERVICE
// ============================================

export interface CreateCompetitorInput {
  name: string;
  domain: string;
  keywords?: string[];
  tracking?: Competitor['tracking'];
}

export interface CompetitiveService {
  getCompetitors(): Promise<Competitor[]>;
  getCompetitor(id: string): Promise<Competitor | null>;
  addCompetitor(data: CreateCompetitorInput): Promise<Competitor>;
  updateCompetitor(id: string, data: Partial<Competitor>): Promise<Competitor>;
  removeCompetitor(id: string): Promise<void>;

  // Monitoring
  getMentions(competitorId: string, timeframe: TimeFrame): Promise<CompetitorMention[]>;
  getAllMentions(timeframe: TimeFrame): Promise<CompetitorMention[]>;

  // Analysis
  getWinLossAnalysis(timeframe: TimeFrame): Promise<{
    wins: number;
    losses: number;
    reasons: { reason: string; count: number }[];
  }>;
}

// ============================================
// CONTENT SERVICE
// ============================================

export interface CreateTemplateInput {
  type: ContentTemplate['type'];
  name: string;
  category: string;
  content: string;
  variables?: string[];
  tags?: string[];
}

export interface ContentService {
  getTemplates(type?: ContentTemplate['type'][], category?: string): Promise<ContentTemplate[]>;
  getTemplate(id: string): Promise<ContentTemplate | null>;
  createTemplate(data: CreateTemplateInput): Promise<ContentTemplate>;
  updateTemplate(id: string, data: Partial<ContentTemplate>): Promise<ContentTemplate>;
  deleteTemplate(id: string): Promise<void>;

  // SOPs
  getSOPs(type?: SOP['type'][], activeOnly?: boolean): Promise<SOP[]>;
  getSOP(id: string): Promise<SOP | null>;
  createSOP(data: Omit<SOP, 'id' | 'createdAt' | 'updatedAt'>): Promise<SOP>;
  updateSOP(id: string, data: Partial<SOP>): Promise<SOP>;
  deleteSOP(id: string): Promise<void>;
  toggleSOP(id: string): Promise<SOP>;

  // Usage
  recordTemplateUsage(templateId: string, success: boolean): Promise<void>;
}

// ============================================
// TIMING SERVICE
// ============================================

export interface TimingService {
  getBestTimes(platform: Platform): Promise<TimingInsight>;
  getHotMoments(): Promise<HotMoment[]>;
  createHotMoment(data: Omit<HotMoment, 'id' | 'createdAt'>): Promise<HotMoment>;
  dismissHotMoment(id: string): Promise<void>;
  getOptimalSendTime(contact: Contact, channel: Channel): Promise<Date>;
}

// ============================================
// SETTINGS SERVICE
// ============================================

export interface SettingsService {
  getSettings(): Promise<WorkspaceSettings>;
  updateSettings(data: Partial<WorkspaceSettings>): Promise<WorkspaceSettings>;

  // Integrations
  getIntegrations(): Promise<Integration[]>;
  connectIntegration(provider: Integration['provider'], credentials: Integration['credentials']): Promise<Integration>;
  disconnectIntegration(id: string): Promise<void>;
  testIntegration(id: string): Promise<{ success: boolean; error?: string }>;
  syncIntegration(id: string): Promise<{ success: boolean; recordsUpdated: number }>;
}

// ============================================
// ANALYTICS SERVICE
// ============================================

export interface AnalyticsMetrics {
  accounts: {
    total: number;
    byTier: Record<string, number>;
    newThisWeek: number;
  };
  engagement: {
    commentsSent: number;
    repliesReceived: number;
    replyRate: number;
    avgResponseTime: number;
  };
  pipeline: {
    totalValue: number;
    newThisWeek: number;
    influenced: number;
  };
  team: {
    activeMembers: number;
    avgPerformance: number;
  };
}

export interface AnalyticsService {
  getDashboardMetrics(timeframe: TimeFrame): Promise<AnalyticsMetrics>;
  getEngagementTrend(days: number): Promise<{ date: string; value: number }[]>;
  getTopPerformingContent(limit: number): Promise<ContentTemplate[]>;
  getTeamLeaderboard(): Promise<{ member: string; score: number }[]>;
  getAttributionReport(timeframe: TimeFrame): Promise<Attribution[]>;
}

// ============================================
// NOTE: Service instances should be imported directly from their respective files
// e.g., import { campaignService } from './campaign.service';
// Do NOT re-export here to avoid circular dependencies
// ============================================
