// ============================================================================
// DASHBOARD - Unified View with Pulse Feed, Hot Moments, Metrics & Activity
// Uses Pulse Visual Design Language (glassmorphism, neon effects, gradients)
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import { useAccountsStore, useInboxStore, usePulseStore, useNotificationsStore } from '../../store';
import { accountsService } from '../../services/accounts.service';
import { inboxService } from '../../services/inbox.service';
import { searchService } from '../../services/search.service';
import { Icons } from '../shared/Icons';
import { ReplyModal } from '../shared/ReplyModal';
import { Account, Conversation, HotMoment, SocialPost } from '../../types';

// Sample hot moments for demo
const SAMPLE_HOT_MOMENTS: HotMoment[] = [
  {
    id: 'hm_1',
    type: 'post_just_published',
    accountId: 'acc_3',
    description: 'CloudFirst (Hot Lead) just posted about scaling outreach',
    urgency: 'act_now',
    expiresAt: new Date(Date.now() + 3600000),
    createdAt: new Date(Date.now() - 120000)
  },
  {
    id: 'hm_2',
    type: 'high_engagement',
    postId: 'post_1',
    description: 'Your comment on ABM thread getting high engagement',
    urgency: 'within_hour',
    expiresAt: new Date(Date.now() + 7200000),
    createdAt: new Date(Date.now() - 600000)
  },
  {
    id: 'hm_3',
    type: 'competitor_active',
    accountId: 'acc_1',
    description: 'Competitor mentioned by TechCorp stakeholder',
    urgency: 'today',
    expiresAt: new Date(Date.now() + 86400000),
    createdAt: new Date(Date.now() - 1800000)
  }
];

// Activity feed item type
interface ActivityItem {
  id: string;
  type: 'comment' | 'reply' | 'signal' | 'meeting' | 'account';
  description: string;
  timestamp: Date;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const SAMPLE_ACTIVITIES: ActivityItem[] = [
  { id: 'act_1', type: 'comment', description: 'You commented on Sarah Chen\'s LinkedIn post', timestamp: new Date(Date.now() - 300000), icon: Icons.MessageSquare, color: 'text-blue-400' },
  { id: 'act_2', type: 'signal', description: 'New intent signal: CloudFirst viewed pricing 3x', timestamp: new Date(Date.now() - 720000), icon: Icons.Zap, color: 'text-yellow-400' },
  { id: 'act_3', type: 'reply', description: 'Amanda Torres replied to your message', timestamp: new Date(Date.now() - 1800000), icon: Icons.Inbox, color: 'text-green-400' },
  { id: 'act_4', type: 'meeting', description: 'Meeting booked: Michael Chen @ ScaleUp', timestamp: new Date(Date.now() - 3600000), icon: Icons.Calendar, color: 'text-purple-400' },
  { id: 'act_5', type: 'account', description: 'TechCorp score increased to 92 (Hot)', timestamp: new Date(Date.now() - 7200000), icon: Icons.TrendingUp, color: 'text-orange-400' },
];

// Platform Icon Component
const PlatformIcon = ({ platform }: { platform: string }) => {
  switch (platform) {
    case 'twitter': return <Icons.Twitter className="w-4 h-4 text-blue-400" />;
    case 'linkedin': return <Icons.LinkedIn className="w-4 h-4 text-blue-600" />;
    case 'reddit': return <Icons.Reddit className="w-4 h-4 text-orange-500" />;
    default: return <Icons.Globe className="w-4 h-4 text-gray-400" />;
  }
};

// Sentiment Indicator Component
const SentimentIndicator = ({ sentiment }: { sentiment: string }) => {
  const color = sentiment === 'positive' ? 'bg-green-500 shadow-[0_0_8px_#10b981]'
    : sentiment === 'negative' ? 'bg-red-500 shadow-[0_0_8px_#ef4444]'
    : 'bg-gray-500';
  return <div className={`w-1.5 h-1.5 rounded-full ${color}`} />;
};

export function Dashboard() {
  const { accounts, setAccounts } = useAccountsStore();
  const { conversations, setConversations } = useInboxStore();
  const { posts, addPosts, keywords, setKeywords, platforms, timeframe, isLive, setIsLive } = usePulseStore();
  const { hotMoments, setHotMoments, dismissHotMoment } = useNotificationsStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isPulseLoading, setIsPulseLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [replyPost, setReplyPost] = useState<SocialPost | null>(null);

  // Fetch social posts
  const fetchPosts = useCallback(async () => {
    const searchTerms = keywords.length > 0 ? keywords.join(' ') : searchInput;
    if (!searchTerms) return;
    setIsPulseLoading(true);
    try {
      const newPosts = await searchService.search({
        keywords: searchTerms,
        platforms: platforms,
        timeframe: timeframe
      });
      addPosts(newPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsPulseLoading(false);
    }
  }, [keywords, searchInput, platforms, timeframe, addPosts]);

  useEffect(() => {
    // Load initial data
    const loadData = async () => {
      try {
        const [accountsResult, conversationsResult] = await Promise.all([
          accountsService.getAccounts({}),
          inboxService.getConversations({})
        ]);
        setAccounts(accountsResult.data);
        setConversations(conversationsResult.data);
        setHotMoments(SAMPLE_HOT_MOMENTS);

        // Set default search input
        if (keywords.length === 0) {
          setSearchInput('ABM outbound sales');
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [setAccounts, setConversations, setHotMoments, keywords.length]);

  // Fetch posts when keywords change
  useEffect(() => {
    if (keywords.length > 0 || searchInput) {
      fetchPosts();
    }
  }, [keywords, fetchPosts]);

  // Live polling for posts
  useEffect(() => {
    if (!isLive) return;
    const intervalId = setInterval(fetchPosts, 60000);
    return () => clearInterval(intervalId);
  }, [isLive, fetchPosts]);

  // Calculate metrics
  const hotAccounts = accounts.filter(a => a.score.tier === 'hot').length;
  const openConversations = conversations.filter(c => c.status === 'open' || c.status === 'pending').length;
  const needsReply = conversations.filter(c => {
    if (c.messages.length === 0) return false;
    const lastMsg = c.messages[c.messages.length - 1];
    return lastMsg.sender.isExternal && c.status !== 'resolved';
  }).length;

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getUrgencyStyles = (urgency: HotMoment['urgency']) => {
    switch (urgency) {
      case 'act_now': return 'bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]';
      case 'within_hour': return 'bg-orange-500/10 border-orange-500/30 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.1)]';
      case 'today': return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.1)]';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-t-2 border-accent rounded-full animate-spin" style={{ animationDirection: 'reverse' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Metrics, Hot Moments, Activity (8 cols) */}
      <div className="lg:col-span-8 space-y-6">
        {/* Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            icon={Icons.Fire}
            label="Hot Accounts"
            value={hotAccounts}
            subtext={`+${Math.floor(Math.random() * 3)} today`}
            color="text-orange-400"
            gradient="from-orange-500/20 to-red-500/20"
          />
          <MetricCard
            icon={Icons.Inbox}
            label="Open Conversations"
            value={openConversations}
            subtext={`${needsReply} need reply`}
            color="text-blue-400"
            gradient="from-blue-500/20 to-cyan-500/20"
          />
          <MetricCard
            icon={Icons.Analytics}
            label="Pipeline"
            value="$234K"
            subtext="+$45K this week"
            color="text-green-400"
            gradient="from-green-500/20 to-emerald-500/20"
          />
          <MetricCard
            icon={Icons.Zap}
            label="Actions Pending"
            value={24}
            subtext="8 high priority"
            color="text-purple-400"
            gradient="from-purple-500/20 to-pink-500/20"
          />
        </div>

        {/* Hot Moments + Activity Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Hot Moments */}
          <div className="glass-panel rounded-xl p-5 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl"></div>

            <div className="flex items-center justify-between mb-4 relative z-10">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Icons.Fire className="w-5 h-5 text-orange-400 animate-pulse" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">
                  Hot Moments
                </span>
              </h2>
              <span className="text-xs text-gray-400 font-mono bg-white/5 px-2 py-1 rounded">
                {hotMoments.length} active
              </span>
            </div>

            <div className="space-y-3 relative z-10">
              {hotMoments.length === 0 ? (
                <div className="text-gray-400 text-sm py-8 text-center">
                  <Icons.Check className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No hot moments right now</p>
                </div>
              ) : (
                hotMoments.map(moment => (
                  <div
                    key={moment.id}
                    className={`glass-card border rounded-xl p-4 ${getUrgencyStyles(moment.urgency)} hover:scale-[1.02] transition-all`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold uppercase tracking-wider">
                            {moment.urgency.replace('_', ' ')}
                          </span>
                          <span className="text-xs opacity-60">
                            {formatTimeAgo(moment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-white">{moment.description}</p>
                      </div>
                      <button
                        onClick={() => dismissHotMoment(moment.id)}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                      >
                        <Icons.X className="w-4 h-4 opacity-60" />
                      </button>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button className="flex-1 text-xs font-medium py-1.5 px-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all hover:scale-105">
                        View
                      </button>
                      <button className="flex-1 text-xs font-medium py-1.5 px-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all hover:scale-105">
                        Take Action
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="glass-panel rounded-xl p-5 relative overflow-hidden">
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>

            <div className="flex items-center justify-between mb-4 relative z-10">
              <h2 className="text-lg font-semibold">Activity Feed</h2>
              <button className="text-sm text-primary hover:text-accent transition-colors">
                View All
              </button>
            </div>

            <div className="space-y-2 relative z-10">
              {SAMPLE_ACTIVITIES.map(activity => {
                const Icon = activity.icon;
                return (
                  <div
                    key={activity.id}
                    className="glass-card flex items-start gap-3 p-3 rounded-lg cursor-pointer group"
                  >
                    <div className={`p-2 rounded-lg bg-white/5 ${activity.color} group-hover:scale-110 transition-transform`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Hot Accounts Table */}
        <div className="glass-panel rounded-xl p-5 relative overflow-hidden">
          <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>

          <div className="flex items-center justify-between mb-4 relative z-10">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Icons.Target className="w-5 h-5 text-primary" />
              Hot Accounts
            </h2>
            <button className="text-sm text-primary hover:text-accent transition-colors flex items-center gap-1">
              View All <Icons.ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto relative z-10">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-400 border-b border-white/10">
                  <th className="pb-3 font-medium">Company</th>
                  <th className="pb-3 font-medium">Score</th>
                  <th className="pb-3 font-medium">Stage</th>
                  <th className="pb-3 font-medium">Intent Signals</th>
                  <th className="pb-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {accounts
                  .filter(a => a.score.tier === 'hot')
                  .slice(0, 4)
                  .map(account => (
                    <tr key={account.id} className="group hover:bg-white/5 transition-colors cursor-pointer">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-medium text-sm shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                            {account.company.name[0]}
                          </div>
                          <div>
                            <p className="font-medium group-hover:text-primary transition-colors">{account.company.name}</p>
                            <p className="text-xs text-gray-500">{account.company.domain}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">{account.score.total}</span>
                          {account.score.trend === 'rising' && (
                            <Icons.TrendingUp className="w-4 h-4 text-green-400" />
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-1 text-xs font-medium bg-primary/20 text-primary rounded capitalize">
                          {account.stage}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1">
                          {account.intentSignals.slice(0, 2).map(signal => (
                            <span
                              key={signal.id}
                              className={`px-2 py-0.5 text-xs rounded ${
                                signal.strength === 'critical' ? 'bg-red-500/20 text-red-400' :
                                signal.strength === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                'bg-gray-500/20 text-gray-400'
                              }`}
                            >
                              {signal.type.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3">
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                          <Icons.ChevronRight className="w-4 h-4 text-gray-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Column: Live Pulse Feed (4 cols) */}
      <div className="lg:col-span-4 h-[calc(100vh-8rem)] lg:sticky lg:top-24">
        <div className="h-full glass-panel rounded-xl border border-primary/20 shadow-[0_0_50px_-12px_rgba(99,102,241,0.2)] overflow-hidden flex flex-col">
          {/* Feed Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLive ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? 'bg-green-500 shadow-[0_0_10px_#10b981]' : 'bg-gray-500'}`}></span>
                </span>
                Pulse Feed
              </h2>
              <button
                onClick={() => setIsLive(!isLive)}
                className={`text-xs font-mono px-2 py-1 rounded transition-colors ${
                  isLive ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-400'
                }`}
              >
                {isLive ? 'LIVE' : 'PAUSED'}
              </button>
            </div>

            {/* Search Input */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchPosts()}
                  placeholder="Track keywords..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <button
                onClick={fetchPosts}
                disabled={isPulseLoading}
                className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors disabled:opacity-50"
              >
                <Icons.RefreshCw className={`w-4 h-4 text-gray-400 ${isPulseLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Posts List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isPulseLoading && posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500 space-y-4">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin"></div>
                  <div className="absolute inset-2 border-t-2 border-accent rounded-full animate-spin" style={{ animationDirection: 'reverse' }}></div>
                </div>
                <p className="text-sm font-mono">Scanning social feeds...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500 space-y-4">
                <Icons.Pulse className="w-12 h-12 opacity-30" />
                <p className="text-sm text-center">
                  Enter keywords to start<br />tracking social mentions
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <div
                  key={post.id}
                  className="glass-card rounded-xl p-4 border-l-2 border-l-transparent hover:border-l-primary transition-all group cursor-pointer"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="relative flex-shrink-0">
                      <img
                        src={post.author.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${post.author.name}`}
                        alt={post.author.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-background p-0.5 rounded-full">
                        <PlatformIcon platform={post.platform} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm text-white truncate">{post.author.name}</h3>
                        <SentimentIndicator sentiment={post.sentiment} />
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        @{post.author.handle} · {formatTimeAgo(post.postedAt)}
                      </p>
                    </div>
                    {post.url && (
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-primary transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Icons.ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  <p className="text-sm text-gray-300 leading-relaxed mb-3 line-clamp-3">
                    {post.content}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-white/5 pt-2">
                    <span className="flex items-center gap-1 group-hover:text-pink-400 transition-colors">
                      <Icons.Zap className="w-3 h-3" />
                      {post.engagement.likes}
                    </span>
                    <span className="flex items-center gap-1 group-hover:text-blue-400 transition-colors">
                      <Icons.MessageSquare className="w-3 h-3" />
                      {post.engagement.comments}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setReplyPost(post); }}
                      className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/10 text-primary transition-colors"
                    >
                      <Icons.Sparkles className="w-3 h-3" />
                      <span className="font-medium">Reply AI</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Reply Modal */}
      {replyPost && (
        <ReplyModal
          post={replyPost}
          onClose={() => setReplyPost(null)}
        />
      )}
    </div>
  );
}

// Metric Card Component with Pulse Visual Style
interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  subtext: string;
  color: string;
  gradient: string;
}

function MetricCard({ icon: Icon, label, value, subtext, color, gradient }: MetricCardProps) {
  return (
    <div className="glass-panel rounded-xl p-5 relative overflow-hidden group hover:scale-[1.02] transition-all">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity`}></div>

      <div className="flex items-center justify-between mb-3 relative z-10">
        <span className="text-sm text-gray-400">{label}</span>
        <div className={`p-2 rounded-lg bg-white/5 group-hover:scale-110 transition-transform`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <div className="text-3xl font-bold mb-1 relative z-10">{value}</div>
      <p className="text-sm text-gray-400 relative z-10">{subtext}</p>
    </div>
  );
}

export default Dashboard;
