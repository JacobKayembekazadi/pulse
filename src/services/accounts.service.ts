// ============================================================================
// ACCOUNTS SERVICE - Account & Contact Management with Lead Scoring
// ============================================================================

import {
  Account, AccountFilters, Contact, Company, LeadScore, IntentSignal,
  SocialPost, PaginatedResult, AccountStage, AccountTier, BuyingRole,
  Seniority, Department, IntentType, IntentStrength
} from '../types';
import { AccountsService, CreateAccountInput, UpdateAccountInput, CreateContactInput } from './index';

// In-memory storage (replace with database in production)
let accounts: Account[] = [];
let contacts: Contact[] = [];

// Generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

// Sample data for initial state
const SAMPLE_ACCOUNTS: Account[] = [
  {
    id: 'acc_1',
    company: {
      id: 'comp_1',
      name: 'TechCorp Industries',
      domain: 'techcorp.io',
      industry: 'SaaS',
      size: '51-200',
      location: { city: 'San Francisco', state: 'CA', country: 'USA', timezone: 'America/Los_Angeles' },
      techStack: ['React', 'Node.js', 'AWS', 'Stripe'],
      funding: { stage: 'Series B', lastRound: 25000000, totalRaised: 40000000 },
      socialProfiles: { linkedin: 'techcorp-industries', twitter: 'techcorp', website: 'https://techcorp.io' }
    },
    contacts: [],
    engagements: [],
    intentSignals: [
      { id: 'sig_1', accountId: 'acc_1', type: 'pricing_view', source: 'leadfeeder', strength: 'high', description: 'Viewed pricing page 3 times today', data: { pageViews: 3 }, timestamp: new Date() },
      { id: 'sig_2', accountId: 'acc_1', type: 'content_download', source: 'leadfeeder', strength: 'medium', description: 'Downloaded ABM Playbook whitepaper', data: { asset: 'ABM Playbook' }, timestamp: new Date(Date.now() - 86400000) }
    ],
    score: {
      total: 92,
      breakdown: { fit: 85, engagement: 90, intent: 98, timing: 88, relationship: 65 },
      tier: 'hot',
      trend: 'rising',
      lastCalculated: new Date(),
      factors: [
        { label: 'High intent signals', impact: 25, reason: '3 pricing page views in 24h' },
        { label: 'Good ICP fit', impact: 20, reason: 'SaaS, Series B, 51-200 employees' },
        { label: 'Content engagement', impact: 15, reason: 'Downloaded whitepaper' }
      ]
    },
    stage: 'engaged',
    tags: ['high-intent', 'saas'],
    lists: ['Target Accounts Q1'],
    notes: [],
    createdAt: new Date(Date.now() - 7 * 86400000),
    updatedAt: new Date()
  },
  {
    id: 'acc_2',
    company: {
      id: 'comp_2',
      name: 'ScaleUp Ventures',
      domain: 'scaleupvc.com',
      industry: 'Venture Capital',
      size: '11-50',
      location: { city: 'New York', state: 'NY', country: 'USA', timezone: 'America/New_York' },
      techStack: ['Notion', 'Slack', 'Airtable'],
      socialProfiles: { linkedin: 'scaleup-ventures', twitter: 'scaleupvc', website: 'https://scaleupvc.com' }
    },
    contacts: [],
    engagements: [],
    intentSignals: [
      { id: 'sig_3', accountId: 'acc_2', type: 'demo_request', source: 'leadfeeder', strength: 'critical', description: 'Submitted demo request form', data: {}, timestamp: new Date() }
    ],
    score: {
      total: 87,
      breakdown: { fit: 70, engagement: 85, intent: 95, timing: 90, relationship: 50 },
      tier: 'hot',
      trend: 'rising',
      lastCalculated: new Date(),
      factors: [
        { label: 'Demo requested', impact: 30, reason: 'Direct demo request submitted' },
        { label: 'Active engagement', impact: 20, reason: 'Multiple page visits' }
      ]
    },
    stage: 'opportunity',
    tags: ['demo-requested'],
    lists: ['Target Accounts Q1'],
    notes: [],
    createdAt: new Date(Date.now() - 14 * 86400000),
    updatedAt: new Date()
  },
  {
    id: 'acc_3',
    company: {
      id: 'comp_3',
      name: 'CloudFirst Solutions',
      domain: 'cloudfirst.dev',
      industry: 'Cloud Infrastructure',
      size: '201-500',
      location: { city: 'Austin', state: 'TX', country: 'USA', timezone: 'America/Chicago' },
      techStack: ['Kubernetes', 'Terraform', 'Go', 'PostgreSQL'],
      funding: { stage: 'Series C', lastRound: 50000000, totalRaised: 85000000 },
      socialProfiles: { linkedin: 'cloudfirst-solutions', twitter: 'cloudfirst', website: 'https://cloudfirst.dev' }
    },
    contacts: [],
    engagements: [],
    intentSignals: [
      { id: 'sig_4', accountId: 'acc_3', type: 'compared_vendors', source: 'g2', strength: 'high', description: 'Compared us vs competitors on G2', data: { competitors: ['Outreach', 'Salesloft'] }, timestamp: new Date(Date.now() - 172800000) },
      { id: 'sig_5', accountId: 'acc_3', type: 'contract_renewal', source: 'manual', strength: 'critical', description: 'Current vendor contract expires Q1', data: { renewalDate: '2025-03-15' }, timestamp: new Date() }
    ],
    score: {
      total: 95,
      breakdown: { fit: 95, engagement: 88, intent: 100, timing: 100, relationship: 70 },
      tier: 'hot',
      trend: 'rising',
      lastCalculated: new Date(),
      factors: [
        { label: 'Contract renewal timing', impact: 30, reason: 'Current vendor contract expires in 2 months' },
        { label: 'Vendor comparison', impact: 25, reason: 'Actively comparing solutions on G2' },
        { label: 'Excellent ICP fit', impact: 20, reason: 'Enterprise, well-funded, right tech stack' }
      ]
    },
    stage: 'engaged',
    tags: ['enterprise', 'high-intent', 'renewal-timing'],
    lists: ['Target Accounts Q1', 'Enterprise Targets'],
    notes: [],
    createdAt: new Date(Date.now() - 30 * 86400000),
    updatedAt: new Date()
  }
];

const SAMPLE_CONTACTS: Contact[] = [
  {
    id: 'con_1', accountId: 'acc_1', firstName: 'David', lastName: 'Miller', email: 'david@techcorp.io',
    title: 'CTO', role: 'decision_maker', seniority: 'c_level', department: 'engineering',
    socialProfiles: { linkedin: 'davidmiller' }, isChampion: false, engagementScore: 45,
    lastContactedAt: new Date(Date.now() - 5 * 86400000), preferences: { preferredChannel: 'linkedin' }
  },
  {
    id: 'con_2', accountId: 'acc_1', firstName: 'Sarah', lastName: 'Johnson', email: 'sarah@techcorp.io',
    title: 'VP Engineering', role: 'influencer', seniority: 'vp', department: 'engineering',
    socialProfiles: { linkedin: 'sarahjohnson', twitter: 'sarahj_tech' }, isChampion: true, engagementScore: 78,
    lastEngagedAt: new Date(), preferences: { preferredChannel: 'email' }
  },
  {
    id: 'con_3', accountId: 'acc_2', firstName: 'Michael', lastName: 'Chen', email: 'mchen@scaleupvc.com',
    title: 'Managing Partner', role: 'decision_maker', seniority: 'c_level', department: 'executive',
    socialProfiles: { linkedin: 'michaelchen' }, isChampion: false, engagementScore: 60,
    preferences: { preferredChannel: 'linkedin' }
  },
  {
    id: 'con_4', accountId: 'acc_3', firstName: 'Amanda', lastName: 'Torres', email: 'amanda@cloudfirst.dev',
    title: 'Head of Growth', role: 'champion', seniority: 'director', department: 'marketing',
    socialProfiles: { linkedin: 'amandatorres', twitter: 'amanda_growth' }, isChampion: true, engagementScore: 92,
    lastEngagedAt: new Date(), lastContactedAt: new Date(Date.now() - 86400000),
    preferences: { preferredChannel: 'email', bestTimeToContact: '10:00-14:00 CT' }
  },
  {
    id: 'con_5', accountId: 'acc_3', firstName: 'Jason', lastName: 'Park', email: 'jason@cloudfirst.dev',
    title: 'CEO', role: 'decision_maker', seniority: 'c_level', department: 'executive',
    socialProfiles: { linkedin: 'jasonpark' }, isChampion: false, engagementScore: 35,
    preferences: { preferredChannel: 'email' }
  }
];

// Initialize with sample data
accounts = SAMPLE_ACCOUNTS.map(acc => ({
  ...acc,
  contacts: SAMPLE_CONTACTS.filter(c => c.accountId === acc.id)
}));
contacts = SAMPLE_CONTACTS;

export class LocalAccountsService implements AccountsService {

  async getAccounts(
    filters: AccountFilters,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResult<Account>> {
    let filtered = [...accounts];

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(a =>
        a.company.name.toLowerCase().includes(search) ||
        a.company.domain.toLowerCase().includes(search)
      );
    }

    if (filters.stage?.length) {
      filtered = filtered.filter(a => filters.stage!.includes(a.stage));
    }

    if (filters.tier?.length) {
      filtered = filtered.filter(a => filters.tier!.includes(a.score.tier));
    }

    if (filters.tags?.length) {
      filtered = filtered.filter(a => filters.tags!.some(t => a.tags.includes(t)));
    }

    if (filters.lists?.length) {
      filtered = filtered.filter(a => filters.lists!.some(l => a.lists.includes(l)));
    }

    if (filters.minScore !== undefined) {
      filtered = filtered.filter(a => a.score.total >= filters.minScore!);
    }

    if (filters.maxScore !== undefined) {
      filtered = filtered.filter(a => a.score.total <= filters.maxScore!);
    }

    // Sort by score descending
    filtered.sort((a, b) => b.score.total - a.score.total);

    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
      data: filtered.slice(start, end),
      total: filtered.length,
      page,
      pageSize,
      hasMore: end < filtered.length
    };
  }

  async getAccount(id: string): Promise<Account | null> {
    return accounts.find(a => a.id === id) || null;
  }

  async createAccount(data: CreateAccountInput): Promise<Account> {
    const id = generateId();
    const now = new Date();

    const company: Company = {
      id: generateId(),
      name: data.company.name || 'Unknown Company',
      domain: data.company.domain || '',
      industry: data.company.industry || 'Unknown',
      size: data.company.size || '1-10',
      location: data.company.location || { city: '', state: '', country: '', timezone: 'UTC' },
      techStack: data.company.techStack || [],
      socialProfiles: data.company.socialProfiles || { website: '' },
      ...data.company
    };

    const newAccount: Account = {
      id,
      company,
      contacts: [],
      engagements: [],
      intentSignals: [],
      score: this.calculateInitialScore(company),
      stage: 'prospect',
      tags: data.tags || [],
      lists: data.lists || [],
      notes: [],
      createdAt: now,
      updatedAt: now
    };

    accounts.push(newAccount);
    return newAccount;
  }

  async updateAccount(id: string, data: UpdateAccountInput): Promise<Account> {
    const index = accounts.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Account not found');

    const account = accounts[index];

    if (data.company) {
      account.company = { ...account.company, ...data.company };
    }
    if (data.stage) account.stage = data.stage;
    if (data.tags) account.tags = data.tags;
    if (data.lists) account.lists = data.lists;
    account.updatedAt = new Date();

    accounts[index] = account;
    return account;
  }

  async deleteAccount(id: string): Promise<void> {
    const index = accounts.findIndex(a => a.id === id);
    if (index !== -1) {
      accounts.splice(index, 1);
      contacts = contacts.filter(c => c.accountId !== id);
    }
  }

  async addContact(accountId: string, data: CreateContactInput): Promise<Contact> {
    const account = accounts.find(a => a.id === accountId);
    if (!account) throw new Error('Account not found');

    const contact: Contact = {
      id: generateId(),
      accountId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      title: data.title,
      role: data.role,
      seniority: data.seniority,
      department: data.department,
      socialProfiles: data.socialProfiles || {},
      isChampion: false,
      engagementScore: 0,
      preferences: {}
    };

    contacts.push(contact);
    account.contacts.push(contact);

    return contact;
  }

  async updateContact(contactId: string, data: Partial<Contact>): Promise<Contact> {
    const index = contacts.findIndex(c => c.id === contactId);
    if (index === -1) throw new Error('Contact not found');

    contacts[index] = { ...contacts[index], ...data };

    // Update in account as well
    const account = accounts.find(a => a.id === contacts[index].accountId);
    if (account) {
      const accContactIndex = account.contacts.findIndex(c => c.id === contactId);
      if (accContactIndex !== -1) {
        account.contacts[accContactIndex] = contacts[index];
      }
    }

    return contacts[index];
  }

  async removeContact(contactId: string): Promise<void> {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;

    contacts = contacts.filter(c => c.id !== contactId);

    const account = accounts.find(a => a.id === contact.accountId);
    if (account) {
      account.contacts = account.contacts.filter(c => c.id !== contactId);
    }
  }

  async recalculateScore(accountId: string): Promise<LeadScore> {
    const account = accounts.find(a => a.id === accountId);
    if (!account) throw new Error('Account not found');

    const score = this.calculateScore(account);
    account.score = score;
    account.updatedAt = new Date();

    return score;
  }

  async getScoreHistory(accountId: string, days: number = 30): Promise<{ date: Date; score: number }[]> {
    // Mock historical data
    const history: { date: Date; score: number }[] = [];
    const account = accounts.find(a => a.id === accountId);
    const currentScore = account?.score.total || 50;

    for (let i = days; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000);
      // Simulate score progression towards current score
      const baseScore = currentScore - 20 + (20 * (days - i)) / days;
      const variance = Math.random() * 10 - 5;
      history.push({
        date,
        score: Math.min(100, Math.max(0, Math.round(baseScore + variance)))
      });
    }

    return history;
  }

  async getIntentSignals(accountId: string): Promise<IntentSignal[]> {
    const account = accounts.find(a => a.id === accountId);
    return account?.intentSignals || [];
  }

  async addIntentSignal(
    accountId: string,
    signal: Omit<IntentSignal, 'id' | 'accountId'>
  ): Promise<IntentSignal> {
    const account = accounts.find(a => a.id === accountId);
    if (!account) throw new Error('Account not found');

    const newSignal: IntentSignal = {
      ...signal,
      id: generateId(),
      accountId
    };

    account.intentSignals.unshift(newSignal);

    // Recalculate score after new signal
    await this.recalculateScore(accountId);

    return newSignal;
  }

  async matchPostToAccount(post: SocialPost): Promise<Account | null> {
    // Try to match by author
    const authorName = post.author.name.toLowerCase();
    const authorHandle = post.author.handle?.toLowerCase();

    for (const account of accounts) {
      // Check contacts
      for (const contact of account.contacts) {
        const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
        const linkedinHandle = contact.socialProfiles.linkedin?.toLowerCase();
        const twitterHandle = contact.socialProfiles.twitter?.toLowerCase();

        if (
          fullName === authorName ||
          (linkedinHandle && authorHandle?.includes(linkedinHandle)) ||
          (twitterHandle && authorHandle?.includes(twitterHandle))
        ) {
          return account;
        }
      }

      // Check company name/domain in content
      if (
        post.content.toLowerCase().includes(account.company.name.toLowerCase()) ||
        post.content.toLowerCase().includes(account.company.domain.toLowerCase())
      ) {
        return account;
      }
    }

    return null;
  }

  async findSimilarAccounts(accountId: string): Promise<Account[]> {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return [];

    // Find accounts with similar characteristics
    return accounts
      .filter(a => a.id !== accountId)
      .filter(a =>
        a.company.industry === account.company.industry ||
        a.company.size === account.company.size ||
        a.tags.some(t => account.tags.includes(t))
      )
      .slice(0, 5);
  }

  private calculateInitialScore(company: Company): LeadScore {
    // Calculate fit score based on ICP criteria
    let fit = 50;
    if (['SaaS', 'Technology', 'Cloud Infrastructure'].includes(company.industry)) fit += 20;
    if (['51-200', '201-500', '501-1000'].includes(company.size)) fit += 15;
    if (company.funding?.stage) fit += 10;

    return {
      total: Math.min(fit, 100),
      breakdown: {
        fit,
        engagement: 0,
        intent: 0,
        timing: 50,
        relationship: 0
      },
      tier: fit >= 70 ? 'warm' : 'cold',
      trend: 'stable',
      lastCalculated: new Date(),
      factors: [
        { label: 'Initial assessment', impact: fit, reason: 'Based on company profile' }
      ]
    };
  }

  private calculateScore(account: Account): LeadScore {
    const factors: { label: string; impact: number; reason: string }[] = [];

    // Fit score (based on ICP)
    let fit = 50;
    if (['SaaS', 'Technology', 'Cloud Infrastructure'].includes(account.company.industry)) {
      fit += 20;
      factors.push({ label: 'Target industry', impact: 20, reason: account.company.industry });
    }
    if (['51-200', '201-500', '501-1000'].includes(account.company.size)) {
      fit += 15;
      factors.push({ label: 'Ideal company size', impact: 15, reason: `${account.company.size} employees` });
    }
    if (account.company.funding) {
      fit += 10;
      factors.push({ label: 'Funded company', impact: 10, reason: account.company.funding.stage });
    }

    // Engagement score
    let engagement = 0;
    const recentEngagements = account.engagements.filter(
      e => e.createdAt > new Date(Date.now() - 30 * 86400000)
    );
    engagement = Math.min(recentEngagements.length * 15, 100);

    // Champion bonus
    const hasChampion = account.contacts.some(c => c.isChampion);
    if (hasChampion) {
      engagement += 20;
      factors.push({ label: 'Has champion', impact: 20, reason: 'Internal advocate identified' });
    }

    // Intent score
    let intent = 0;
    const strengthWeights: Record<IntentStrength, number> = {
      critical: 30,
      high: 20,
      medium: 10,
      low: 5
    };
    for (const signal of account.intentSignals.slice(0, 5)) {
      intent += strengthWeights[signal.strength];
      if (signal.strength === 'critical' || signal.strength === 'high') {
        factors.push({ label: signal.type.replace(/_/g, ' '), impact: strengthWeights[signal.strength], reason: signal.description });
      }
    }
    intent = Math.min(intent, 100);

    // Timing score
    let timing = 50;
    const hasRenewalSignal = account.intentSignals.some(s => s.type === 'contract_renewal');
    if (hasRenewalSignal) {
      timing = 100;
      factors.push({ label: 'Contract renewal timing', impact: 30, reason: 'Current vendor contract expiring' });
    }

    // Relationship score
    let relationship = 0;
    for (const contact of account.contacts) {
      relationship += contact.engagementScore / 10;
    }
    relationship = Math.min(relationship, 100);

    // Calculate total
    const total = Math.round(
      fit * 0.25 +
      engagement * 0.2 +
      intent * 0.3 +
      timing * 0.15 +
      relationship * 0.1
    );

    // Determine tier
    let tier: AccountTier;
    if (total >= 80) tier = 'hot';
    else if (total >= 60) tier = 'warm';
    else if (total >= 40) tier = 'cold';
    else tier = 'ice';

    // Determine trend (compare to previous)
    const previousTotal = account.score.total;
    let trend: 'rising' | 'stable' | 'falling';
    if (total > previousTotal + 5) trend = 'rising';
    else if (total < previousTotal - 5) trend = 'falling';
    else trend = 'stable';

    return {
      total,
      breakdown: {
        fit: Math.min(fit, 100),
        engagement: Math.min(engagement, 100),
        intent,
        timing,
        relationship
      },
      tier,
      trend,
      lastCalculated: new Date(),
      factors: factors.slice(0, 5)
    };
  }
}

// Export singleton instance
export const accountsService = new LocalAccountsService();
