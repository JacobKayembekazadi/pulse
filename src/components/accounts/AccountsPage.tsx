// ============================================================================
// ACCOUNTS PAGE - Account Management with Lead Scoring
// Uses Pulse Visual Design Language (glassmorphism, neon effects, gradients)
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useAccountsStore } from '../../store';
import { accountsService } from '../../services/accounts.service';
import { Icons } from '../shared/Icons';
import { Account, AccountTier } from '../../types';

export function AccountsPage() {
  const { accounts, setAccounts, selectedAccount, setSelectedAccount, filters, setFilters } = useAccountsStore();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAccounts();
  }, [filters]);

  const loadAccounts = async () => {
    setIsLoading(true);
    try {
      const result = await accountsService.getAccounts({ ...filters, search: searchQuery });
      setAccounts(result.data);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTierColor = (tier: AccountTier) => {
    switch (tier) {
      case 'hot': return 'bg-red-500/20 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]';
      case 'warm': return 'bg-orange-500/20 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.2)]';
      case 'cold': return 'bg-blue-500/20 text-blue-400';
      case 'ice': return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const hours = Math.floor((Date.now() - date.getTime()) / 3600000);
    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
            Accounts
          </h1>
          <p className="text-gray-400 text-sm mt-1">{accounts.length} accounts tracked</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white text-sm font-medium rounded-lg transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] hover:scale-105">
          <Icons.Plus className="w-4 h-4" />
          Add Account
        </button>
      </div>

      {/* Filters */}
      <div className="glass-panel rounded-xl p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search accounts..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadAccounts()}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Tier:</span>
            {(['hot', 'warm', 'cold'] as AccountTier[]).map(tier => (
              <button
                key={tier}
                onClick={() => setFilters({
                  ...filters,
                  tier: filters.tier?.includes(tier)
                    ? filters.tier.filter(t => t !== tier)
                    : [...(filters.tier || []), tier]
                })}
                className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-all hover:scale-105 ${
                  filters.tier?.includes(tier)
                    ? getTierColor(tier)
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Accounts Grid/List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-t-2 border-accent rounded-full animate-spin" style={{ animationDirection: 'reverse' }}></div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {accounts.map(account => (
            <div
              key={account.id}
              onClick={() => setSelectedAccount(account)}
              className="glass-card rounded-xl p-5 cursor-pointer group relative overflow-hidden"
            >
              {/* Hover gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div className="flex items-start gap-4 relative z-10">
                {/* Company Logo */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-[0_0_20px_rgba(99,102,241,0.3)] group-hover:scale-110 transition-transform">
                  {account.company.name[0]}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{account.company.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${getTierColor(account.score.tier)}`}>
                      {account.score.tier}
                    </span>
                    <span className="px-2 py-0.5 bg-white/10 text-gray-300 rounded text-xs capitalize">
                      {account.stage}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                    <span>{account.company.domain}</span>
                    <span>·</span>
                    <span>{account.company.industry}</span>
                    <span>·</span>
                    <span>{account.company.size} employees</span>
                  </div>

                  {/* Contacts */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{account.contacts.length} contacts:</span>
                    <div className="flex -space-x-2">
                      {account.contacts.slice(0, 4).map((contact, i) => (
                        <div
                          key={contact.id}
                          className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 border-2 border-background flex items-center justify-center text-xs font-medium group-hover:scale-110 transition-transform"
                          style={{ transitionDelay: `${i * 50}ms` }}
                          title={`${contact.firstName} ${contact.lastName}`}
                        >
                          {contact.firstName[0]}{contact.lastName[0]}
                        </div>
                      ))}
                      {account.contacts.length > 4 && (
                        <div className="w-7 h-7 rounded-full bg-gray-600 border-2 border-background flex items-center justify-center text-xs">
                          +{account.contacts.length - 4}
                        </div>
                      )}
                    </div>
                    {account.contacts.some(c => c.isChampion) && (
                      <span className="ml-2 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                        Has Champion
                      </span>
                    )}
                  </div>
                </div>

                {/* Score & Signals */}
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end mb-2">
                    <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">{account.score.total}</span>
                    {account.score.trend === 'rising' && <Icons.TrendingUp className="w-5 h-5 text-green-400 animate-pulse" />}
                    {account.score.trend === 'falling' && <Icons.TrendingDown className="w-5 h-5 text-red-400" />}
                  </div>

                  <div className="flex flex-wrap gap-1 justify-end">
                    {account.intentSignals.slice(0, 2).map(signal => (
                      <span
                        key={signal.id}
                        className={`px-2 py-0.5 text-xs rounded transition-transform group-hover:scale-105 ${
                          signal.strength === 'critical' ? 'bg-red-500/20 text-red-400' :
                          signal.strength === 'high' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {signal.type.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs text-gray-400 mt-2">
                    Updated {formatTimeAgo(account.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Account Detail Sidebar */}
      {selectedAccount && (
        <AccountDetailSidebar
          account={selectedAccount}
          onClose={() => setSelectedAccount(null)}
        />
      )}
    </div>
  );
}

// Account Detail Sidebar Component
function AccountDetailSidebar({ account, onClose }: { account: Account; onClose: () => void }) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Sidebar */}
      <div className="fixed inset-y-0 right-0 w-[480px] glass-panel border-l border-primary/20 shadow-[0_0_50px_rgba(99,102,241,0.15)] z-50 overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 glass-panel border-b border-white/10 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shadow-[0_0_15px_rgba(99,102,241,0.3)]">
              {account.company.name[0]}
            </div>
            <div>
              <h2 className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">{account.company.name}</h2>
              <p className="text-sm text-gray-400">{account.company.domain}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors group">
            <Icons.X className="w-5 h-5 text-gray-400 group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* Score */}
        <div className="p-5 border-b border-white/10 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>

          <h3 className="text-sm font-medium text-gray-400 mb-3 relative z-10">Lead Score</h3>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">{account.score.total}</span>
            <span className={`px-3 py-1 rounded-lg text-sm font-medium capitalize ${
              account.score.tier === 'hot' ? 'bg-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]' :
              account.score.tier === 'warm' ? 'bg-orange-500/20 text-orange-400' :
              'bg-blue-500/20 text-blue-400'
            }`}>
              {account.score.tier}
            </span>
          </div>

          {/* Score Breakdown */}
          <div className="space-y-2 relative z-10">
            {Object.entries(account.score.breakdown).map(([key, value]) => (
              <div key={key} className="flex items-center gap-3 group">
                <span className="text-xs text-gray-400 w-20 capitalize">{key}</span>
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all group-hover:shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                    style={{ width: `${value}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-8">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Buying Committee */}
        <div className="p-5 border-b border-white/10">
          <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
            <Icons.Users className="w-4 h-4" />
            Buying Committee ({account.contacts.length})
          </h3>
          <div className="space-y-3">
            {account.contacts.map(contact => (
              <div key={contact.id} className="glass-card flex items-center gap-3 p-3 rounded-lg group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-sm font-medium group-hover:scale-110 transition-transform">
                  {contact.firstName[0]}{contact.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{contact.firstName} {contact.lastName}</span>
                    {contact.isChampion && (
                      <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs shadow-[0_0_8px_rgba(234,179,8,0.2)]">
                        Champion
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{contact.title}</p>
                </div>
                <div className="flex gap-1">
                  {contact.socialProfiles.linkedin && (
                    <a href={`https://linkedin.com/in/${contact.socialProfiles.linkedin}`} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-[#0077b5]/20 text-[#0077b5] rounded hover:bg-[#0077b5]/30 transition-colors hover:scale-110">
                      <Icons.LinkedIn className="w-4 h-4" />
                    </a>
                  )}
                  {contact.email && (
                    <a href={`mailto:${contact.email}`} className="p-1.5 bg-white/10 text-gray-400 rounded hover:bg-white/20 transition-colors hover:scale-110">
                      <Icons.Mail className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Intent Signals */}
        <div className="p-5">
          <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
            <Icons.Zap className="w-4 h-4 text-yellow-400" />
            Intent Signals
          </h3>
          <div className="space-y-2">
            {account.intentSignals.map(signal => (
              <div key={signal.id} className="glass-card flex items-start gap-3 p-3 rounded-lg group hover:border-primary/30">
                <Icons.Zap className={`w-4 h-4 mt-0.5 group-hover:scale-110 transition-transform ${
                  signal.strength === 'critical' ? 'text-red-400' :
                  signal.strength === 'high' ? 'text-orange-400' :
                  'text-gray-400'
                }`} />
                <div>
                  <p className="text-sm">{signal.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {signal.source} · {new Date(signal.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default AccountsPage;
