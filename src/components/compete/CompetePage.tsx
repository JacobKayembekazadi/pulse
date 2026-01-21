// ============================================================================
// COMPETE PAGE - Competitive Intelligence
// Full featured competitor tracking, battle cards, and mention monitoring
// Uses Pulse Visual Design Language (glassmorphism, neon effects, gradients)
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Icons } from '../shared/Icons';
import { storage } from '../../services/storage.service';
import { Competitor, CompetitorMention, FeatureComparison, Platform, Sentiment } from '../../types';

// Extended interfaces for the page
interface CompetitorWithStats extends Competitor {
  stats: {
    totalMentions: number;
    positiveMentions: number;
    negativeMentions: number;
    winRate: number;
    lossRate: number;
    recentTrend: 'up' | 'down' | 'stable';
  };
  createdAt?: string;
  updatedAt?: string;
}

interface WinLossRecord {
  id: string;
  competitorId: string;
  type: 'win' | 'loss';
  accountName: string;
  dealValue: number;
  reason: string;
  date: string;
}

// Default sample competitors
const defaultCompetitors: CompetitorWithStats[] = [
  {
    id: 'comp-1',
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
    },
    stats: {
      totalMentions: 145,
      positiveMentions: 89,
      negativeMentions: 23,
      winRate: 62,
      lossRate: 38,
      recentTrend: 'up'
    }
  },
  {
    id: 'comp-2',
    name: 'Outreach',
    domain: 'outreach.io',
    logo: 'https://logo.clearbit.com/outreach.io',
    keywords: ['outreach', 'sales engagement', 'email sequences'],
    socialProfiles: {
      linkedin: 'https://linkedin.com/company/outreach-saas',
      twitter: 'https://twitter.com/outaborgg'
    },
    tracking: {
      mentions: true,
      pricing: false,
      features: true,
      reviews: true
    },
    stats: {
      totalMentions: 203,
      positiveMentions: 156,
      negativeMentions: 31,
      winRate: 55,
      lossRate: 45,
      recentTrend: 'stable'
    }
  },
  {
    id: 'comp-3',
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
    },
    stats: {
      totalMentions: 178,
      positiveMentions: 112,
      negativeMentions: 42,
      winRate: 48,
      lossRate: 52,
      recentTrend: 'down'
    }
  }
];

// Default sample mentions
const defaultMentions: CompetitorMention[] = [
  {
    id: 'mention-1',
    competitorId: 'comp-1',
    post: {
      id: 'post-m1',
      platform: 'linkedin' as Platform,
      author: {
        name: 'Sarah Chen',
        handle: 'sarahchen',
        title: 'VP of Sales, TechCorp',
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
      },
      content: 'Just evaluated Gong vs other solutions for our team. The conversation intelligence features are impressive but the pricing was a challenge for our budget...',
      engagement: { likes: 45, comments: 12, shares: 5 },
      url: 'https://linkedin.com/posts/example-1',
      postedAt: new Date('2024-01-15T10:30:00'),
      fetchedAt: new Date(),
      matchedKeywords: ['gong', 'conversation intelligence'],
      matchedAccounts: [],
      relevanceScore: 0.89,
      sentiment: 'neutral' as Sentiment,
      category: 'comparison'
    },
    context: 'comparison',
    priority: 'high',
    timestamp: new Date('2024-01-15T10:30:00')
  },
  {
    id: 'mention-2',
    competitorId: 'comp-2',
    post: {
      id: 'post-m2',
      platform: 'twitter' as Platform,
      author: {
        name: 'Mike Johnson',
        handle: 'mikejohnsontech',
        title: 'Sales Director',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
      },
      content: 'Switching from Outreach to a new platform next quarter. Anyone have recommendations for sales engagement tools? Looking for better LinkedIn integration.',
      engagement: { likes: 23, comments: 31, shares: 2 },
      url: 'https://twitter.com/example-2',
      postedAt: new Date('2024-01-14T15:45:00'),
      fetchedAt: new Date(),
      matchedKeywords: ['outreach', 'sales engagement'],
      matchedAccounts: [],
      relevanceScore: 0.95,
      sentiment: 'negative' as Sentiment,
      category: 'comparison'
    },
    context: 'switch_from',
    priority: 'urgent',
    timestamp: new Date('2024-01-14T15:45:00')
  },
  {
    id: 'mention-3',
    competitorId: 'comp-3',
    post: {
      id: 'post-m3',
      platform: 'reddit' as Platform,
      author: {
        name: 'anonymous_sales_leader',
        handle: 'u/anonymous_sales_leader',
        title: undefined,
        avatar: undefined
      },
      content: 'Salesloft has been great for our team of 50 SDRs. The cadence builder is intuitive and the analytics help us optimize our sequences. Highly recommend for mid-market teams.',
      engagement: { likes: 67, comments: 23, shares: 0 },
      url: 'https://reddit.com/r/sales/example-3',
      postedAt: new Date('2024-01-13T08:20:00'),
      fetchedAt: new Date(),
      matchedKeywords: ['salesloft', 'cadence'],
      matchedAccounts: [],
      relevanceScore: 0.72,
      sentiment: 'positive' as Sentiment,
      category: 'recommendation'
    },
    context: 'positive',
    priority: 'medium',
    timestamp: new Date('2024-01-13T08:20:00')
  }
];

// Default feature comparison data
const defaultFeatureComparisons: FeatureComparison[] = [
  {
    feature: 'AI-Powered Reply Generation',
    us: { available: true, notes: 'Uses Gemini AI for contextual replies' },
    competitors: {
      'comp-1': { available: true, notes: 'Basic templates only' },
      'comp-2': { available: true, notes: 'Limited to email' },
      'comp-3': { available: false, notes: 'Coming soon' }
    }
  },
  {
    feature: 'Multi-Platform Social Listening',
    us: { available: true, notes: 'LinkedIn, Twitter, Reddit, Bluesky' },
    competitors: {
      'comp-1': { available: false, notes: 'Focuses on calls only' },
      'comp-2': { available: true, notes: 'Email & LinkedIn only' },
      'comp-3': { available: true, notes: 'Email & LinkedIn only' }
    }
  },
  {
    feature: 'Real-time Intent Signals',
    us: { available: true, notes: 'From social + web activity' },
    competitors: {
      'comp-1': { available: true, notes: 'From call transcripts' },
      'comp-2': { available: true, notes: 'Email engagement only' },
      'comp-3': { available: true, notes: 'Basic engagement tracking' }
    }
  },
  {
    feature: 'Chrome Extension',
    us: { available: true, notes: 'Full-featured engagement tool' },
    competitors: {
      'comp-1': { available: true, notes: 'Recording focused' },
      'comp-2': { available: true, notes: 'Excellent' },
      'comp-3': { available: true, notes: 'Good' }
    }
  },
  {
    feature: 'Competitive Intelligence',
    us: { available: true, notes: 'Built-in with battle cards' },
    competitors: {
      'comp-1': { available: true, notes: 'Market insights' },
      'comp-2': { available: false, notes: 'Not available' },
      'comp-3': { available: false, notes: 'Not available' }
    }
  }
];

export function CompetePage() {
  // State
  const [competitors, setCompetitors] = useState<CompetitorWithStats[]>([]);
  const [mentions, setMentions] = useState<CompetitorMention[]>([]);
  const [featureComparisons, setFeatureComparisons] = useState<FeatureComparison[]>([]);
  const [winLossRecords, setWinLossRecords] = useState<WinLossRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'battlecards' | 'mentions' | 'winloss'>('overview');
  const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorWithStats | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWinLossModal, setShowWinLossModal] = useState(false);

  // Form state for new competitor
  const [newCompetitor, setNewCompetitor] = useState({
    name: '',
    domain: '',
    keywords: '',
    linkedin: '',
    twitter: ''
  });

  // Form state for win/loss record
  const [newWinLoss, setNewWinLoss] = useState({
    competitorId: '',
    type: 'win' as 'win' | 'loss',
    accountName: '',
    dealValue: '',
    reason: ''
  });

  // Load data on mount
  useEffect(() => {
    const savedCompetitors = storage.get<CompetitorWithStats[]>('nexus-competitors', []);
    if (savedCompetitors.length === 0) {
      setCompetitors(defaultCompetitors);
      storage.set('nexus-competitors', defaultCompetitors);
    } else {
      setCompetitors(savedCompetitors);
    }

    // Load mentions (would be from API in production)
    setMentions(defaultMentions);
    setFeatureComparisons(defaultFeatureComparisons);

    // Load win/loss records
    const savedWinLoss = storage.get<WinLossRecord[]>('nexus-winloss', []);
    setWinLossRecords(savedWinLoss);
  }, []);

  // Add new competitor
  const handleAddCompetitor = () => {
    if (!newCompetitor.name || !newCompetitor.domain) return;

    const competitor: CompetitorWithStats = {
      id: storage.generateId(),
      name: newCompetitor.name,
      domain: newCompetitor.domain,
      keywords: newCompetitor.keywords.split(',').map(k => k.trim()).filter(Boolean),
      socialProfiles: {
        linkedin: newCompetitor.linkedin || undefined,
        twitter: newCompetitor.twitter || undefined
      },
      tracking: {
        mentions: true,
        pricing: true,
        features: true,
        reviews: true
      },
      stats: {
        totalMentions: 0,
        positiveMentions: 0,
        negativeMentions: 0,
        winRate: 0,
        lossRate: 0,
        recentTrend: 'stable'
      },
      createdAt: new Date().toISOString()
    };

    const updated = [...competitors, competitor];
    setCompetitors(updated);
    storage.set('nexus-competitors', updated);
    setShowAddModal(false);
    setNewCompetitor({ name: '', domain: '', keywords: '', linkedin: '', twitter: '' });
  };

  // Delete competitor
  const handleDeleteCompetitor = (id: string) => {
    const updated = competitors.filter(c => c.id !== id);
    setCompetitors(updated);
    storage.set('nexus-competitors', updated);
    if (selectedCompetitor?.id === id) {
      setSelectedCompetitor(null);
    }
  };

  // Toggle tracking setting
  const toggleTracking = (id: string, setting: keyof Competitor['tracking']) => {
    const updated = competitors.map(c => {
      if (c.id === id) {
        return {
          ...c,
          tracking: {
            ...c.tracking,
            [setting]: !c.tracking[setting]
          }
        };
      }
      return c;
    });
    setCompetitors(updated);
    storage.set('nexus-competitors', updated);
  };

  // Add win/loss record
  const handleAddWinLoss = () => {
    if (!newWinLoss.competitorId || !newWinLoss.accountName) return;

    const record: WinLossRecord = {
      id: storage.generateId(),
      competitorId: newWinLoss.competitorId,
      type: newWinLoss.type,
      accountName: newWinLoss.accountName,
      dealValue: parseFloat(newWinLoss.dealValue) || 0,
      reason: newWinLoss.reason,
      date: new Date().toISOString()
    };

    const updated = [...winLossRecords, record];
    setWinLossRecords(updated);
    storage.set('nexus-winloss', updated);
    setShowWinLossModal(false);
    setNewWinLoss({ competitorId: '', type: 'win', accountName: '', dealValue: '', reason: '' });

    // Update competitor stats
    updateCompetitorStats(newWinLoss.competitorId, newWinLoss.type);
  };

  // Update competitor win/loss stats
  const updateCompetitorStats = (competitorId: string, type: 'win' | 'loss') => {
    const updated = competitors.map(c => {
      if (c.id === competitorId) {
        const totalRecords = winLossRecords.filter(r => r.competitorId === competitorId).length + 1;
        const wins = winLossRecords.filter(r => r.competitorId === competitorId && r.type === 'win').length + (type === 'win' ? 1 : 0);
        const losses = totalRecords - wins;

        return {
          ...c,
          stats: {
            ...c.stats,
            winRate: Math.round((wins / totalRecords) * 100),
            lossRate: Math.round((losses / totalRecords) * 100)
          }
        };
      }
      return c;
    });
    setCompetitors(updated);
    storage.set('nexus-competitors', updated);
  };

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Get context badge
  const getContextBadge = (context: string) => {
    switch (context) {
      case 'switch_from': return { label: 'Switching Away', color: 'bg-green-500/20 text-green-400' };
      case 'switch_to': return { label: 'Switching To', color: 'bg-red-500/20 text-red-400' };
      case 'comparison': return { label: 'Comparing', color: 'bg-blue-500/20 text-blue-400' };
      case 'positive': return { label: 'Positive', color: 'bg-emerald-500/20 text-emerald-400' };
      case 'negative': return { label: 'Negative', color: 'bg-red-500/20 text-red-400' };
      default: return { label: context, color: 'bg-gray-500/20 text-gray-400' };
    }
  };

  // Calculate overall stats
  const totalMentions = competitors.reduce((sum, c) => sum + c.stats.totalMentions, 0);
  const avgWinRate = competitors.length > 0
    ? Math.round(competitors.reduce((sum, c) => sum + c.stats.winRate, 0) / competitors.length)
    : 0;
  const urgentMentions = mentions.filter(m => m.priority === 'urgent').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
            Competitive Intelligence
          </h1>
          <p className="text-gray-400 text-sm mt-1">Monitor competitors and track market positioning</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowWinLossModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 glass-card hover:border-yellow-500/30 text-white text-sm font-medium rounded-lg transition-all"
          >
            <Icons.TrendingUp className="w-4 h-4" />
            Log Win/Loss
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90 text-white text-sm font-medium rounded-lg transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.4)] hover:scale-105"
          >
            <Icons.Plus className="w-4 h-4" />
            Add Competitor
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/30 to-red-500/30 flex items-center justify-center">
              <Icons.Compete className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{competitors.length}</p>
              <p className="text-xs text-gray-400">Competitors Tracked</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/30 to-cyan-500/30 flex items-center justify-center">
              <Icons.MessageSquare className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalMentions}</p>
              <p className="text-xs text-gray-400">Total Mentions</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/30 to-emerald-500/30 flex items-center justify-center">
              <Icons.TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{avgWinRate}%</p>
              <p className="text-xs text-gray-400">Avg Win Rate</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500/30 to-pink-500/30 flex items-center justify-center">
              <Icons.AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{urgentMentions}</p>
              <p className="text-xs text-gray-400">Urgent Mentions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        {[
          { id: 'overview', label: 'Overview', icon: Icons.Layers },
          { id: 'battlecards', label: 'Battle Cards', icon: Icons.Grid },
          { id: 'mentions', label: 'Mentions', icon: Icons.MessageSquare },
          { id: 'winloss', label: 'Win/Loss', icon: Icons.TrendingUp }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-400 border border-orange-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-3 gap-6">
          {/* Competitors List */}
          <div className="col-span-2 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Icons.Compete className="w-5 h-5 text-orange-400" />
              Tracked Competitors
            </h3>
            {competitors.map(competitor => (
              <div
                key={competitor.id}
                onClick={() => setSelectedCompetitor(competitor)}
                className={`glass-card p-4 rounded-xl cursor-pointer transition-all hover:border-orange-500/30 ${
                  selectedCompetitor?.id === competitor.id ? 'border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.2)]' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden">
                      {competitor.logo ? (
                        <img src={competitor.logo} alt={competitor.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-gray-400">{competitor.name.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold">{competitor.name}</h4>
                      <p className="text-sm text-gray-400">{competitor.domain}</p>
                      <div className="flex gap-2 mt-1">
                        {competitor.keywords.slice(0, 3).map(kw => (
                          <span key={kw} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{competitor.stats.totalMentions} mentions</p>
                      <div className="flex items-center gap-1 text-xs">
                        {competitor.stats.recentTrend === 'up' && (
                          <><Icons.TrendingUp className="w-3 h-3 text-green-400" /><span className="text-green-400">Trending up</span></>
                        )}
                        {competitor.stats.recentTrend === 'down' && (
                          <><Icons.TrendingDown className="w-3 h-3 text-red-400" /><span className="text-red-400">Trending down</span></>
                        )}
                        {competitor.stats.recentTrend === 'stable' && (
                          <><Icons.Minus className="w-3 h-3 text-gray-400" /><span className="text-gray-400">Stable</span></>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCompetitor(competitor.id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Icons.Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Stats bar */}
                <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-400">Win Rate</p>
                    <p className="text-lg font-semibold text-green-400">{competitor.stats.winRate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Loss Rate</p>
                    <p className="text-lg font-semibold text-red-400">{competitor.stats.lossRate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Positive</p>
                    <p className="text-lg font-semibold text-emerald-400">{competitor.stats.positiveMentions}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Negative</p>
                    <p className="text-lg font-semibold text-orange-400">{competitor.stats.negativeMentions}</p>
                  </div>
                </div>

                {/* Tracking toggles */}
                <div className="mt-4 flex gap-2">
                  {Object.entries(competitor.tracking).map(([key, enabled]) => (
                    <button
                      key={key}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTracking(competitor.id, key as keyof Competitor['tracking']);
                      }}
                      className={`text-xs px-3 py-1 rounded-full transition-all ${
                        enabled
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          : 'bg-white/5 text-gray-500 border border-white/10'
                      }`}
                    >
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {competitors.length === 0 && (
              <div className="glass-panel p-8 rounded-xl text-center">
                <Icons.Compete className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No competitors tracked yet</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 text-orange-400 text-sm hover:underline"
                >
                  Add your first competitor
                </button>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Icons.Activity className="w-5 h-5 text-blue-400" />
              Recent Activity
            </h3>
            <div className="glass-card rounded-xl p-4 space-y-4 max-h-[600px] overflow-y-auto">
              {mentions.slice(0, 5).map(mention => {
                const competitor = competitors.find(c => c.id === mention.competitorId);
                const contextBadge = getContextBadge(mention.context);

                return (
                  <div key={mention.id} className="pb-4 border-b border-white/10 last:border-0 last:pb-0">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {mention.post.author.avatar ? (
                          <img src={mention.post.author.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Icons.User className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{mention.post.author.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(mention.priority)}`}>
                            {mention.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 line-clamp-2">{mention.post.content}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${contextBadge.color}`}>
                            {contextBadge.label}
                          </span>
                          <span className="text-xs text-gray-500">
                            {competitor?.name}
                          </span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-500 capitalize">
                            {mention.post.platform}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'battlecards' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Feature</th>
                  <th className="text-center p-4 text-sm font-medium text-orange-400 bg-orange-500/10">
                    NEXUS (Us)
                  </th>
                  {competitors.map(c => (
                    <th key={c.id} className="text-center p-4 text-sm font-medium text-gray-400">
                      {c.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {featureComparisons.map((fc, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-4 text-sm font-medium">{fc.feature}</td>
                    <td className="p-4 text-center bg-orange-500/5">
                      <div className="flex flex-col items-center gap-1">
                        {fc.us.available ? (
                          <Icons.Check className="w-5 h-5 text-green-400" />
                        ) : (
                          <Icons.X className="w-5 h-5 text-red-400" />
                        )}
                        {fc.us.notes && (
                          <span className="text-xs text-gray-400">{fc.us.notes}</span>
                        )}
                      </div>
                    </td>
                    {competitors.map(c => {
                      const compFeature = fc.competitors[c.id];
                      return (
                        <td key={c.id} className="p-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            {compFeature?.available ? (
                              <Icons.Check className="w-5 h-5 text-green-400" />
                            ) : (
                              <Icons.X className="w-5 h-5 text-red-400" />
                            )}
                            {compFeature?.notes && (
                              <span className="text-xs text-gray-400">{compFeature.notes}</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="glass-card p-6 rounded-xl">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Icons.Lightbulb className="w-5 h-5 text-yellow-400" />
              Quick Battle Card Notes
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {competitors.map(c => (
                <div key={c.id} className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <h4 className="font-medium mb-2">{c.name}</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-green-400">Strengths:</span>
                      <p className="text-gray-400">Brand recognition, enterprise features</p>
                    </div>
                    <div>
                      <span className="text-red-400">Weaknesses:</span>
                      <p className="text-gray-400">Expensive, complex setup</p>
                    </div>
                    <div>
                      <span className="text-blue-400">Counter:</span>
                      <p className="text-gray-400">Emphasize ease of use and social listening capabilities</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'mentions' && (
        <div className="space-y-4">
          {mentions.map(mention => {
            const competitor = competitors.find(c => c.id === mention.competitorId);
            const contextBadge = getContextBadge(mention.context);

            return (
              <div key={mention.id} className="glass-card p-4 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {mention.post.author.avatar ? (
                      <img src={mention.post.author.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Icons.User className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{mention.post.author.name}</span>
                      {mention.post.author.title && (
                        <span className="text-sm text-gray-400">{mention.post.author.title}</span>
                      )}
                    </div>
                    <p className="text-gray-300 mb-3">{mention.post.content}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(mention.priority)}`}>
                        {mention.priority.toUpperCase()}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${contextBadge.color}`}>
                        {contextBadge.label}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-gray-400">
                        {competitor?.name}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-gray-400 capitalize flex items-center gap-1">
                        {mention.post.platform === 'linkedin' && <Icons.Linkedin className="w-3 h-3" />}
                        {mention.post.platform === 'twitter' && <Icons.Twitter className="w-3 h-3" />}
                        {mention.post.platform}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(mention.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10">
                      <span className="text-sm text-gray-400">
                        {mention.post.engagement.likes} likes
                      </span>
                      <span className="text-sm text-gray-400">
                        {mention.post.engagement.comments} comments
                      </span>
                      <span className="text-sm text-gray-400">
                        {mention.post.engagement.shares} shares
                      </span>
                      <div className="flex-1" />
                      <button className="text-sm text-orange-400 hover:text-orange-300 flex items-center gap-1">
                        <Icons.MessageSquare className="w-4 h-4" />
                        Engage
                      </button>
                      <button className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                        <Icons.ExternalLink className="w-4 h-4" />
                        View
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'winloss' && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-4 gap-4">
            {competitors.map(c => (
              <div key={c.id} className="glass-card p-4 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden">
                    {c.logo ? (
                      <img src={c.logo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-gray-400">{c.name.charAt(0)}</span>
                    )}
                  </div>
                  <span className="font-medium">{c.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${c.stats.winRate}%` }}
                      />
                      <div
                        className="h-full bg-red-500"
                        style={{ width: `${c.stats.lossRate}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-green-400">{c.stats.winRate}%</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {winLossRecords.filter(r => r.competitorId === c.id).length} total records
                </p>
              </div>
            ))}
          </div>

          {/* Records Table */}
          <div className="glass-panel rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Date</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Result</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Competitor</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Account</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Deal Value</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Reason</th>
                </tr>
              </thead>
              <tbody>
                {winLossRecords.map(record => {
                  const competitor = competitors.find(c => c.id === record.competitorId);
                  return (
                    <tr key={record.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-4 text-sm">{new Date(record.date).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          record.type === 'win'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {record.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-sm">{competitor?.name || 'Unknown'}</td>
                      <td className="p-4 text-sm font-medium">{record.accountName}</td>
                      <td className="p-4 text-sm">${record.dealValue.toLocaleString()}</td>
                      <td className="p-4 text-sm text-gray-400">{record.reason}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {winLossRecords.length === 0 && (
              <div className="p-8 text-center">
                <Icons.TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No win/loss records yet</p>
                <button
                  onClick={() => setShowWinLossModal(true)}
                  className="mt-4 text-orange-400 text-sm hover:underline"
                >
                  Log your first record
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Competitor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Add Competitor</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <Icons.X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Company Name *</label>
                <input
                  type="text"
                  value={newCompetitor.name}
                  onChange={e => setNewCompetitor({ ...newCompetitor, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-orange-500/50"
                  placeholder="e.g., Competitor Inc"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Domain *</label>
                <input
                  type="text"
                  value={newCompetitor.domain}
                  onChange={e => setNewCompetitor({ ...newCompetitor, domain: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-orange-500/50"
                  placeholder="e.g., competitor.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Keywords (comma-separated)</label>
                <input
                  type="text"
                  value={newCompetitor.keywords}
                  onChange={e => setNewCompetitor({ ...newCompetitor, keywords: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-orange-500/50"
                  placeholder="e.g., keyword1, keyword2, keyword3"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">LinkedIn URL</label>
                  <input
                    type="text"
                    value={newCompetitor.linkedin}
                    onChange={e => setNewCompetitor({ ...newCompetitor, linkedin: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-orange-500/50"
                    placeholder="https://linkedin.com/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Twitter URL</label>
                  <input
                    type="text"
                    value={newCompetitor.twitter}
                    onChange={e => setNewCompetitor({ ...newCompetitor, twitter: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-orange-500/50"
                    placeholder="https://twitter.com/..."
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 border border-white/10 rounded-lg hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCompetitor}
                disabled={!newCompetitor.name || !newCompetitor.domain}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Competitor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Win/Loss Modal */}
      {showWinLossModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Log Win/Loss</h2>
              <button
                onClick={() => setShowWinLossModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <Icons.X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Result *</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setNewWinLoss({ ...newWinLoss, type: 'win' })}
                    className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
                      newWinLoss.type === 'win'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-white/5 text-gray-400 border border-white/10'
                    }`}
                  >
                    WIN
                  </button>
                  <button
                    onClick={() => setNewWinLoss({ ...newWinLoss, type: 'loss' })}
                    className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
                      newWinLoss.type === 'loss'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-white/5 text-gray-400 border border-white/10'
                    }`}
                  >
                    LOSS
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Competitor *</label>
                <select
                  value={newWinLoss.competitorId}
                  onChange={e => setNewWinLoss({ ...newWinLoss, competitorId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-orange-500/50"
                >
                  <option value="">Select competitor...</option>
                  {competitors.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Account Name *</label>
                <input
                  type="text"
                  value={newWinLoss.accountName}
                  onChange={e => setNewWinLoss({ ...newWinLoss, accountName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-orange-500/50"
                  placeholder="e.g., Acme Corporation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Deal Value ($)</label>
                <input
                  type="number"
                  value={newWinLoss.dealValue}
                  onChange={e => setNewWinLoss({ ...newWinLoss, dealValue: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-orange-500/50"
                  placeholder="e.g., 50000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Reason/Notes</label>
                <textarea
                  value={newWinLoss.reason}
                  onChange={e => setNewWinLoss({ ...newWinLoss, reason: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-orange-500/50 h-24 resize-none"
                  placeholder="Why did we win/lose this deal?"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowWinLossModal(false)}
                className="flex-1 px-4 py-2.5 border border-white/10 rounded-lg hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleAddWinLoss}
                disabled={!newWinLoss.competitorId || !newWinLoss.accountName}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Log Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompetePage;
