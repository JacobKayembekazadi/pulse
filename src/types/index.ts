// ============================================================================
// NEXUS PLATFORM - UNIFIED TYPE DEFINITIONS
// ============================================================================

// ============================================
// COMMON TYPES
// ============================================

export type Platform = 'linkedin' | 'twitter' | 'reddit' | 'bluesky' | 'news' | 'web';
export type Channel = 'linkedin' | 'twitter' | 'email' | 'phone' | 'meeting' | 'other';
export type TimeFrame = 'live' | '24h' | '7d' | '30d' | '1y';
export type Sentiment = 'positive' | 'neutral' | 'negative';

// ============================================
// ACCOUNTS & COMPANIES
// ============================================

export type CompanySize = '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+';
export type AccountStage = 'prospect' | 'engaged' | 'opportunity' | 'customer' | 'churned';
export type AccountTier = 'hot' | 'warm' | 'cold' | 'ice';

export interface Company {
  id: string;
  name: string;
  domain: string;
  logo?: string;
  industry: string;
  size: CompanySize;
  location: {
    city: string;
    state: string;
    country: string;
    timezone: string;
  };
  techStack: string[];
  funding?: {
    stage: string;
    lastRound?: number;
    totalRaised?: number;
  };
  socialProfiles: {
    linkedin?: string;
    twitter?: string;
    website: string;
  };
  enrichedAt?: Date;
  enrichmentSource?: 'clay' | 'clearbit' | 'apollo' | 'zoominfo';
}

export interface Account {
  id: string;
  company: Company;
  contacts: Contact[];
  engagements: Engagement[];
  intentSignals: IntentSignal[];
  score: LeadScore;
  stage: AccountStage;
  owner?: TeamMember;
  tags: string[];
  lists: string[];
  notes: Note[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// CONTACTS & BUYING COMMITTEE
// ============================================

export type BuyingRole =
  | 'decision_maker'
  | 'influencer'
  | 'champion'
  | 'blocker'
  | 'end_user'
  | 'evaluator'
  | 'budget_holder';

export type Seniority = 'c_level' | 'vp' | 'director' | 'manager' | 'individual';
export type Department = 'engineering' | 'marketing' | 'sales' | 'product' | 'finance' | 'operations' | 'hr' | 'it' | 'executive' | 'other';

export interface Contact {
  id: string;
  accountId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  title: string;
  role: BuyingRole;
  seniority: Seniority;
  department: Department;
  socialProfiles: {
    linkedin?: string;
    twitter?: string;
  };
  avatar?: string;
  isChampion: boolean;
  engagementScore: number;
  lastContactedAt?: Date;
  lastEngagedAt?: Date;
  preferences: {
    bestTimeToContact?: string;
    preferredChannel?: Channel;
  };
}

// ============================================
// INTENT SIGNALS
// ============================================

export type IntentType =
  | 'page_view'
  | 'pricing_view'
  | 'demo_request'
  | 'content_download'
  | 'repeated_visits'
  | 'mentioned_brand'
  | 'mentioned_competitor'
  | 'asked_question'
  | 'shared_pain_point'
  | 'engaged_with_content'
  | 'searched_category'
  | 'reviewed_on_g2'
  | 'compared_vendors'
  | 'contract_renewal'
  | 'budget_cycle'
  | 'new_hire'
  | 'tech_change'
  | 'funding_event';

export type IntentSource =
  | 'leadfeeder'
  | 'google_search'
  | 'linkedin'
  | 'twitter'
  | 'g2'
  | 'builtwith'
  | 'manual';

export type IntentStrength = 'low' | 'medium' | 'high' | 'critical';

export interface IntentSignal {
  id: string;
  accountId: string;
  contactId?: string;
  type: IntentType;
  source: IntentSource;
  strength: IntentStrength;
  description: string;
  data: Record<string, any>;
  timestamp: Date;
  expiresAt?: Date;
}

// ============================================
// LEAD SCORING
// ============================================

export interface ScoreFactor {
  label: string;
  impact: number;
  reason: string;
}

export interface LeadScore {
  total: number;
  breakdown: {
    fit: number;
    engagement: number;
    intent: number;
    timing: number;
    relationship: number;
  };
  tier: AccountTier;
  trend: 'rising' | 'stable' | 'falling';
  lastCalculated: Date;
  factors: ScoreFactor[];
}

// ============================================
// ENGAGEMENTS
// ============================================

export type EngagementType =
  | 'social_comment'
  | 'social_reply'
  | 'social_dm'
  | 'email_outbound'
  | 'email_reply'
  | 'linkedin_message'
  | 'meeting'
  | 'call'
  | 'note';

export type EngagementStatus =
  | 'draft'
  | 'scheduled'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'replied'
  | 'bounced'
  | 'failed';

export interface Engagement {
  id: string;
  accountId: string;
  contactId?: string;
  type: EngagementType;
  channel: Channel;
  direction: 'inbound' | 'outbound';
  content: {
    subject?: string;
    body: string;
    attachments?: string[];
  };
  metadata: {
    postUrl?: string;
    emailThreadId?: string;
    linkedinConversationId?: string;
  };
  status: EngagementStatus;
  sentiment?: Sentiment;
  createdBy?: TeamMember;
  createdAt: Date;
  respondedAt?: Date;
}

// ============================================
// SOCIAL POSTS
// ============================================

export type PostCategory =
  | 'pain_point'
  | 'question'
  | 'comparison'
  | 'recommendation'
  | 'announcement'
  | 'thought_leadership'
  | 'competitor_mention'
  | 'brand_mention';

export interface SocialPost {
  id: string;
  platform: Platform;
  author: {
    id?: string;
    name: string;
    handle: string;
    title?: string;
    avatar?: string;
    followers?: number;
    isVerified?: boolean;
  };
  content: string;
  media?: {
    type: 'image' | 'video' | 'link';
    url: string;
  }[];
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views?: number;
  };
  url: string;
  postedAt: Date;
  fetchedAt: Date;
  matchedKeywords: string[];
  matchedAccounts: string[];
  relevanceScore: number;
  sentiment: Sentiment;
  category: PostCategory;
  ourComment?: {
    id: string;
    content: string;
    status: 'draft' | 'posted' | 'replied';
    postedAt?: Date;
    engagement?: { likes: number; replies: number };
  };
}

// ============================================
// CONVERSATIONS (UNIFIED INBOX)
// ============================================

export type ConversationStatus = 'open' | 'pending' | 'resolved' | 'archived';
export type ConversationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Participant {
  id: string;
  name: string;
  avatar?: string;
  isExternal: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: Participant;
  content: string;
  attachments?: Attachment[];
  sentAt: Date;
  readAt?: Date;
  metadata?: Record<string, any>;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface Conversation {
  id: string;
  accountId?: string;
  contactId?: string;
  channel: Channel;
  subject?: string;
  participants: Participant[];
  messages: Message[];
  status: ConversationStatus;
  priority: ConversationPriority;
  assignedTo?: TeamMember;
  tags: string[];
  lastMessageAt: Date;
  createdAt: Date;
}

// ============================================
// CAMPAIGNS & ATTRIBUTION
// ============================================

export type CampaignType =
  | 'social_listening'
  | 'abm_outreach'
  | 'community_engagement'
  | 'competitor_monitoring';

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';

export interface CampaignMetrics {
  postsFound: number;
  commentsGenerated: number;
  commentsSent: number;
  repliesReceived: number;
  conversationsStarted: number;
  meetingsBooked: number;
  pipelineGenerated: number;
  revenueInfluenced: number;
}

export interface Campaign {
  id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  targeting: {
    keywords: string[];
    accounts: string[];
    personas: string[];
    platforms: Platform[];
  };
  templates: string[];
  sops: string[];
  dateRange: {
    start: Date;
    end?: Date;
  };
  metrics: CampaignMetrics;
  createdBy: TeamMember;
  createdAt: Date;
  updatedAt: Date;
}

export type AttributionModel = 'first_touch' | 'last_touch' | 'linear' | 'time_decay';

export interface Touchpoint {
  type: EngagementType;
  channel: Channel;
  campaignId?: string;
  description: string;
  timestamp: Date;
  weight: number;
}

export interface Attribution {
  id: string;
  accountId: string;
  dealId?: string;
  touchpoints: Touchpoint[];
  model: AttributionModel;
  totalValue: number;
  createdAt: Date;
}

// ============================================
// COMPETITIVE INTELLIGENCE
// ============================================

export type CompetitorMentionContext = 'positive' | 'negative' | 'comparison' | 'switch_from' | 'switch_to';

export interface Competitor {
  id: string;
  name: string;
  domain: string;
  logo?: string;
  keywords: string[];
  socialProfiles: {
    linkedin?: string;
    twitter?: string;
  };
  tracking: {
    mentions: boolean;
    pricing: boolean;
    features: boolean;
    reviews: boolean;
  };
}

export interface CompetitorMention {
  id: string;
  competitorId: string;
  post: SocialPost;
  context: CompetitorMentionContext;
  accountId?: string;
  priority: ConversationPriority;
  actionTaken?: string;
  timestamp: Date;
}

export interface FeatureComparison {
  feature: string;
  us: { available: boolean; notes?: string };
  competitors: { [competitorId: string]: { available: boolean; notes?: string } };
}

// ============================================
// CONTENT LIBRARY & SOPS
// ============================================

export type ContentType =
  | 'social_comment'
  | 'linkedin_message'
  | 'email_outreach'
  | 'follow_up'
  | 'objection_handler'
  | 'case_study_snippet'
  | 'social_proof';

export interface ContentTemplate {
  id: string;
  type: ContentType;
  name: string;
  category: string;
  content: string;
  variables: string[];
  usageCount: number;
  performance: {
    sent: number;
    replies: number;
    replyRate: number;
    avgSentiment: number;
  };
  tags: string[];
  createdBy: TeamMember;
  createdAt: Date;
  updatedAt: Date;
}

export type SOPType =
  | 'tone'
  | 'template'
  | 'rule'
  | 'escalation'
  | 'approval_required';

export interface SOPCondition {
  field: string;
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'in';
  value: any;
}

export interface SOP {
  id: string;
  name: string;
  type: SOPType;
  category: string;
  content: string;
  conditions: SOPCondition[];
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// TEAM & PERMISSIONS
// ============================================

export type TeamRole = 'admin' | 'manager' | 'sdr' | 'ae' | 'viewer';

export type Permission =
  | 'manage_team'
  | 'manage_integrations'
  | 'manage_sops'
  | 'view_all_accounts'
  | 'edit_accounts'
  | 'send_messages'
  | 'approve_messages'
  | 'view_analytics'
  | 'export_data';

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: TeamRole;
  permissions: Permission[];
  assignedAccounts: string[];
  capacity: {
    maxAccounts: number;
    currentAccounts: number;
  };
  performance: {
    responsesThisWeek: number;
    avgResponseTime: number;
    meetingsBooked: number;
  };
}

// ============================================
// TIMING INTELLIGENCE
// ============================================

export type HotMomentType = 'post_just_published' | 'high_engagement' | 'trending_topic' | 'competitor_active';
export type HotMomentUrgency = 'act_now' | 'within_hour' | 'today';

export interface TimingInsight {
  platform: Platform;
  bestTimes: {
    dayOfWeek: number;
    hourOfDay: number;
    timezone: string;
    engagementMultiplier: number;
  }[];
}

export interface HotMoment {
  id: string;
  type: HotMomentType;
  accountId?: string;
  postId?: string;
  description: string;
  urgency: HotMomentUrgency;
  expiresAt: Date;
  createdAt: Date;
}

// ============================================
// SETTINGS & INTEGRATIONS
// ============================================

export type IntegrationProvider =
  | 'leadfeeder' | 'clearbit' | 'apollo' | 'zoominfo' | 'clay'
  | 'linkedin' | 'twitter' | 'apify' | 'phantombuster'
  | 'hubspot' | 'salesforce' | 'pipedrive'
  | 'gmail' | 'outlook' | 'slack'
  | 'anthropic' | 'openai' | 'google';

export type IntegrationStatus = 'connected' | 'disconnected' | 'error';

export interface Integration {
  id: string;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  credentials: {
    apiKey?: string;
    accessToken?: string;
    refreshToken?: string;
    mcpServerUrl?: string;
  };
  settings: Record<string, any>;
  lastSyncAt?: Date;
  error?: string;
}

export interface AIConfig {
  provider: 'anthropic' | 'openai' | 'google';
  model: string;
  apiKey: string;
  settings: {
    temperature: number;
    maxTokens: number;
    defaultTone: string;
  };
}

export interface NotificationSettings {
  email: {
    hotMoments: boolean;
    newLeads: boolean;
    replies: boolean;
    weeklyDigest: boolean;
  };
  push: {
    hotMoments: boolean;
    newLeads: boolean;
    replies: boolean;
  };
  slack: {
    enabled: boolean;
    channelId?: string;
  };
}

export interface WorkspaceSettings {
  id: string;
  name: string;
  domain: string;
  branding: {
    logo?: string;
    primaryColor: string;
  };
  integrations: Integration[];
  aiConfig: AIConfig;
  notifications: NotificationSettings;
}

// ============================================
// NOTES
// ============================================

export interface Note {
  id: string;
  content: string;
  createdBy: TeamMember;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// ============================================
// FILTERS
// ============================================

export interface AccountFilters {
  search?: string;
  stage?: AccountStage[];
  tier?: AccountTier[];
  tags?: string[];
  lists?: string[];
  owner?: string;
  minScore?: number;
  maxScore?: number;
}

export interface PostFilters {
  platforms?: Platform[];
  keywords?: string[];
  sentiment?: Sentiment[];
  category?: PostCategory[];
  timeframe?: TimeFrame;
  minRelevance?: number;
  hasAccount?: boolean;
}

export interface ConversationFilters {
  status?: ConversationStatus[];
  channel?: Channel[];
  priority?: ConversationPriority[];
  assignedTo?: string;
  accountId?: string;
}
