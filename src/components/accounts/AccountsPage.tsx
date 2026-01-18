// ============================================================================
// ACCOUNTS PAGE - Account Management with Lead Scoring
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
      case 'hot': return 'bg-red-500/20 text-red-400';
      case 'warm': return 'bg-orange-500/20 text-orange-400';
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
          <h1 className="text-2xl font-bold">Accounts</h1>
          <p className="text-gray-400 text-sm mt-1">{accounts.length} accounts tracked</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors">
          <Icons.Plus className="w-4 h-4" />
          Add Account
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search accounts..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadAccounts()}
            className="w-full pl-10 pr-4 py-2.5 bg-[#111113] border border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500"
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
              className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
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

      {/* Accounts Grid/List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid gap-4">
          {accounts.map(account => (
            <div
              key={account.id}
              onClick={() => setSelectedAccount(account)}
              className="bg-[#111113] border border-white/10 rounded-xl p-5 hover:border-white/20 cursor-pointer transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Company Logo */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {account.company.name[0]}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-lg">{account.company.name}</h3>
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
                          className="w-7 h-7 rounded-full bg-gray-700 border-2 border-[#111113] flex items-center justify-center text-xs font-medium"
                          title={`${contact.firstName} ${contact.lastName}`}
                        >
                          {contact.firstName[0]}{contact.lastName[0]}
                        </div>
                      ))}
                      {account.contacts.length > 4 && (
                        <div className="w-7 h-7 rounded-full bg-gray-600 border-2 border-[#111113] flex items-center justify-center text-xs">
                          +{account.contacts.length - 4}
                        </div>
                      )}
                    </div>
                    {account.contacts.some(c => c.isChampion) && (
                      <span className="ml-2 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                        Has Champion
                      </span>
                    )}
                  </div>
                </div>

                {/* Score & Signals */}
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end mb-2">
                    <span className="text-3xl font-bold">{account.score.total}</span>
                    {account.score.trend === 'rising' && <Icons.TrendingUp className="w-5 h-5 text-green-400" />}
                    {account.score.trend === 'falling' && <Icons.TrendingDown className="w-5 h-5 text-red-400" />}
                  </div>

                  <div className="flex flex-wrap gap-1 justify-end">
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
    <div className="fixed inset-y-0 right-0 w-[480px] bg-[#0a0a0b] border-l border-white/10 shadow-2xl z-40 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-[#0a0a0b] border-b border-white/10 p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
            {account.company.name[0]}
          </div>
          <div>
            <h2 className="font-semibold">{account.company.name}</h2>
            <p className="text-sm text-gray-400">{account.company.domain}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <Icons.X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Score */}
      <div className="p-5 border-b border-white/10">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Lead Score</h3>
        <div className="flex items-center gap-4 mb-4">
          <span className="text-4xl font-bold">{account.score.total}</span>
          <span className={`px-3 py-1 rounded-lg text-sm font-medium capitalize ${
            account.score.tier === 'hot' ? 'bg-red-500/20 text-red-400' :
            account.score.tier === 'warm' ? 'bg-orange-500/20 text-orange-400' :
            'bg-blue-500/20 text-blue-400'
          }`}>
            {account.score.tier}
          </span>
        </div>

        {/* Score Breakdown */}
        <div className="space-y-2">
          {Object.entries(account.score.breakdown).map(([key, value]) => (
            <div key={key} className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-20 capitalize">{key}</span>
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
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
        <h3 className="text-sm font-medium text-gray-400 mb-3">
          Buying Committee ({account.contacts.length})
        </h3>
        <div className="space-y-3">
          {account.contacts.map(contact => (
            <div key={contact.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-sm font-medium">
                {contact.firstName[0]}{contact.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{contact.firstName} {contact.lastName}</span>
                  {contact.isChampion && (
                    <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                      Champion
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">{contact.title}</p>
              </div>
              <div className="flex gap-1">
                {contact.socialProfiles.linkedin && (
                  <a href={`https://linkedin.com/in/${contact.socialProfiles.linkedin}`} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-[#0077b5]/20 text-[#0077b5] rounded">
                    <Icons.LinkedIn className="w-4 h-4" />
                  </a>
                )}
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="p-1.5 bg-white/10 text-gray-400 rounded">
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
        <h3 className="text-sm font-medium text-gray-400 mb-3">Intent Signals</h3>
        <div className="space-y-2">
          {account.intentSignals.map(signal => (
            <div key={signal.id} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
              <Icons.Zap className={`w-4 h-4 mt-0.5 ${
                signal.strength === 'critical' ? 'text-red-400' :
                signal.strength === 'high' ? 'text-orange-400' :
                'text-gray-400'
              }`} />
              <div>
                <p className="text-sm">{signal.description}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {signal.source} · {new Date(signal.timestamp).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AccountsPage;
