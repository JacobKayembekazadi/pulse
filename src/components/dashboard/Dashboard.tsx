// ============================================================================
// DASHBOARD - Overview with Hot Moments, Metrics, and Activity Feed
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useAccountsStore, useInboxStore, usePulseStore, useNotificationsStore } from '../../store';
import { accountsService } from '../../services/accounts.service';
import { inboxService } from '../../services/inbox.service';
import { Icons } from '../shared/Icons';
import { Account, Conversation, HotMoment } from '../../types';

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

export function Dashboard() {
  const { accounts, setAccounts } = useAccountsStore();
  const { conversations, setConversations } = useInboxStore();
  const { posts } = usePulseStore();
  const { hotMoments, setHotMoments, dismissHotMoment } = useNotificationsStore();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load data on mount
    const loadData = async () => {
      try {
        const [accountsResult, conversationsResult] = await Promise.all([
          accountsService.getAccounts({}),
          inboxService.getConversations({})
        ]);
        setAccounts(accountsResult.data);
        setConversations(conversationsResult.data);
        setHotMoments(SAMPLE_HOT_MOMENTS);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [setAccounts, setConversations, setHotMoments]);

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
      case 'act_now': return 'bg-red-500/10 border-red-500/30 text-red-400';
      case 'within_hour': return 'bg-orange-500/10 border-orange-500/30 text-orange-400';
      case 'today': return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          icon={Icons.Fire}
          label="Hot Accounts"
          value={hotAccounts}
          subtext={`+${Math.floor(Math.random() * 3)} today`}
          color="text-orange-400"
          bgColor="bg-orange-500/10"
        />
        <MetricCard
          icon={Icons.Inbox}
          label="Open Conversations"
          value={openConversations}
          subtext={`${needsReply} need reply`}
          color="text-blue-400"
          bgColor="bg-blue-500/10"
        />
        <MetricCard
          icon={Icons.Analytics}
          label="Pipeline"
          value="$234K"
          subtext="+$45K this week"
          color="text-green-400"
          bgColor="bg-green-500/10"
        />
        <MetricCard
          icon={Icons.Zap}
          label="Actions Pending"
          value={24}
          subtext="8 high priority"
          color="text-purple-400"
          bgColor="bg-purple-500/10"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Hot Moments */}
        <div className="bg-[#111113] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Icons.Fire className="w-5 h-5 text-orange-400" />
              Hot Moments
            </h2>
            <span className="text-sm text-gray-400">{hotMoments.length} active</span>
          </div>

          <div className="space-y-3">
            {hotMoments.length === 0 ? (
              <p className="text-gray-400 text-sm py-8 text-center">No hot moments right now</p>
            ) : (
              hotMoments.map(moment => (
                <div
                  key={moment.id}
                  className={`border rounded-lg p-4 ${getUrgencyStyles(moment.urgency)}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium uppercase">
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
                    <button className="flex-1 text-xs font-medium py-1.5 px-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                      View
                    </button>
                    <button className="flex-1 text-xs font-medium py-1.5 px-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                      Take Action
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-[#111113] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Activity Feed</h2>
            <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              View All
            </button>
          </div>

          <div className="space-y-3">
            {SAMPLE_ACTIVITIES.map(activity => {
              const Icon = activity.icon;
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                >
                  <div className={`p-2 rounded-lg bg-white/5 ${activity.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">{activity.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
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
      <div className="bg-[#111113] border border-white/10 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Hot Accounts</h2>
          <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
            View All Accounts
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-400 border-b border-white/10">
                <th className="pb-3 font-medium">Company</th>
                <th className="pb-3 font-medium">Score</th>
                <th className="pb-3 font-medium">Stage</th>
                <th className="pb-3 font-medium">Intent Signals</th>
                <th className="pb-3 font-medium">Last Activity</th>
                <th className="pb-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {accounts
                .filter(a => a.score.tier === 'hot')
                .slice(0, 5)
                .map(account => (
                  <tr key={account.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                          {account.company.name[0]}
                        </div>
                        <div>
                          <p className="font-medium">{account.company.name}</p>
                          <p className="text-sm text-gray-400">{account.company.domain}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold">{account.score.total}</span>
                        {account.score.trend === 'rising' && (
                          <Icons.TrendingUp className="w-4 h-4 text-green-400" />
                        )}
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-500/20 text-blue-400 rounded capitalize">
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
                    <td className="py-3 text-sm text-gray-400">
                      {formatTimeAgo(account.updatedAt)}
                    </td>
                    <td className="py-3">
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
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
  );
}

// Metric Card Component
interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  subtext: string;
  color: string;
  bgColor: string;
}

function MetricCard({ icon: Icon, label, value, subtext, color, bgColor }: MetricCardProps) {
  return (
    <div className="bg-[#111113] border border-white/10 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-400">{label}</span>
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <p className="text-sm text-gray-400">{subtext}</p>
    </div>
  );
}

export default Dashboard;
