// ============================================================================
// CAMPAIGNS PAGE - Full Campaign Management & Attribution
// Uses Pulse Visual Design Language (glassmorphism, neon effects, gradients)
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Icons } from '../shared/Icons';
import { storage } from '../../services/storage.service';

// Types
interface Campaign {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  type: 'engagement' | 'outreach' | 'awareness';
  targeting: {
    keywords: string[];
    platforms: ('linkedin' | 'twitter' | 'reddit')[];
    accounts?: string[];
    personas?: string[];
  };
  schedule: {
    startDate: string;
    endDate?: string;
    dailyLimit: number;
    timezone: string;
  };
  content: {
    templates: string[];
    sops: string[];
    tone: string;
  };
  metrics: {
    impressions: number;
    engagements: number;
    replies: number;
    meetings: number;
    pipeline: number;
  };
  createdAt: string;
  updatedAt: string;
}

const defaultCampaigns: Campaign[] = [
  {
    id: 'camp_1',
    name: 'Q1 ABM Outreach',
    description: 'Target high-intent accounts showing pricing page activity',
    status: 'active',
    type: 'engagement',
    targeting: {
      keywords: ['sales automation', 'revenue operations', 'ABM tools'],
      platforms: ['linkedin', 'twitter'],
      accounts: ['acc_1', 'acc_2']
    },
    schedule: {
      startDate: '2025-01-01',
      endDate: '2025-03-31',
      dailyLimit: 20,
      timezone: 'America/New_York'
    },
    content: {
      templates: ['temp_1'],
      sops: ['sop_1'],
      tone: 'professional'
    },
    metrics: {
      impressions: 1250,
      engagements: 342,
      replies: 89,
      meetings: 12,
      pipeline: 145000
    },
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'camp_2',
    name: 'Thought Leadership',
    description: 'Engage with industry conversations to build brand awareness',
    status: 'active',
    type: 'awareness',
    targeting: {
      keywords: ['B2B sales', 'social selling', 'sales engagement'],
      platforms: ['linkedin', 'twitter', 'reddit']
    },
    schedule: {
      startDate: '2025-01-15',
      dailyLimit: 30,
      timezone: 'America/New_York'
    },
    content: {
      templates: ['temp_2'],
      sops: ['sop_2'],
      tone: 'friendly'
    },
    metrics: {
      impressions: 3400,
      engagements: 890,
      replies: 156,
      meetings: 5,
      pipeline: 52000
    },
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: new Date().toISOString()
  }
];

export function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = () => {
    setIsLoading(true);
    const stored = storage.get<Campaign[]>('nexus-campaigns', []);
    if (stored.length === 0) {
      // Initialize with defaults
      storage.set('nexus-campaigns', defaultCampaigns);
      setCampaigns(defaultCampaigns);
    } else {
      setCampaigns(stored);
    }
    setIsLoading(false);
  };

  const toggleCampaignStatus = (campaign: Campaign) => {
    const newStatus = campaign.status === 'active' ? 'paused' : 'active';
    const updated = storage.updateItem<Campaign>('nexus-campaigns', campaign.id, { status: newStatus });
    if (updated) {
      setCampaigns(prev => prev.map(c => c.id === campaign.id ? updated : c));
    }
  };

  const deleteCampaign = (id: string) => {
    storage.removeItem('nexus-campaigns', id);
    setCampaigns(prev => prev.filter(c => c.id !== id));
    if (selectedCampaign?.id === id) {
      setSelectedCampaign(null);
    }
  };

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]';
      case 'paused': return 'bg-yellow-500/20 text-yellow-400';
      case 'draft': return 'bg-gray-500/20 text-gray-400';
      case 'completed': return 'bg-blue-500/20 text-blue-400';
    }
  };

  const getTypeIcon = (type: Campaign['type']) => {
    switch (type) {
      case 'engagement': return <Icons.MessageSquare className="w-4 h-4" />;
      case 'outreach': return <Icons.Send className="w-4 h-4" />;
      case 'awareness': return <Icons.Eye className="w-4 h-4" />;
    }
  };

  const totalMetrics = campaigns.reduce((acc, c) => ({
    impressions: acc.impressions + c.metrics.impressions,
    engagements: acc.engagements + c.metrics.engagements,
    replies: acc.replies + c.metrics.replies,
    meetings: acc.meetings + c.metrics.meetings,
    pipeline: acc.pipeline + c.metrics.pipeline
  }), { impressions: 0, engagements: 0, replies: 0, meetings: 0, pipeline: 0 });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
            Campaigns
          </h1>
          <p className="text-gray-400 text-sm mt-1">{campaigns.length} campaigns • {campaigns.filter(c => c.status === 'active').length} active</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white text-sm font-medium rounded-lg transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] hover:scale-105"
        >
          <Icons.Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard label="Impressions" value={totalMetrics.impressions.toLocaleString()} icon={<Icons.Eye className="w-5 h-5" />} color="blue" />
        <StatCard label="Engagements" value={totalMetrics.engagements.toLocaleString()} icon={<Icons.MessageSquare className="w-5 h-5" />} color="purple" />
        <StatCard label="Replies" value={totalMetrics.replies.toLocaleString()} icon={<Icons.Reply className="w-5 h-5" />} color="green" />
        <StatCard label="Meetings" value={totalMetrics.meetings.toLocaleString()} icon={<Icons.Calendar className="w-5 h-5" />} color="orange" />
        <StatCard label="Pipeline" value={`$${(totalMetrics.pipeline / 1000).toFixed(0)}K`} icon={<Icons.DollarSign className="w-5 h-5" />} color="emerald" />
      </div>

      {/* Campaigns List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-t-2 border-accent rounded-full animate-spin" style={{ animationDirection: 'reverse' }}></div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {campaigns.map(campaign => (
            <div
              key={campaign.id}
              className="glass-card rounded-xl p-5 group relative overflow-hidden cursor-pointer"
              onClick={() => setSelectedCampaign(campaign)}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div className="flex items-start gap-4 relative z-10">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-primary flex-shrink-0 group-hover:scale-110 transition-transform">
                  {getTypeIcon(campaign.type)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{campaign.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${getStatusColor(campaign.status)}`}>
                      {campaign.status}
                    </span>
                    <span className="px-2 py-0.5 bg-white/10 text-gray-300 rounded text-xs capitalize">
                      {campaign.type}
                    </span>
                  </div>

                  <p className="text-sm text-gray-400 mb-3">{campaign.description}</p>

                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Icons.Target className="w-3 h-3" />
                      {campaign.targeting.keywords.length} keywords
                    </span>
                    <span className="flex items-center gap-1">
                      {campaign.targeting.platforms.map(p => (
                        <span key={p} className="capitalize">{p}</span>
                      )).reduce((prev, curr, i) => i === 0 ? [curr] : [...prev, ', ', curr], [] as React.ReactNode[])}
                    </span>
                    <span>·</span>
                    <span>{campaign.schedule.dailyLimit}/day limit</span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="text-right">
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
                        {campaign.metrics.engagements}
                      </p>
                      <p className="text-xs text-gray-400">Engaged</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-green-400">{campaign.metrics.replies}</p>
                      <p className="text-xs text-gray-400">Replies</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-blue-400">{campaign.metrics.meetings}</p>
                      <p className="text-xs text-gray-400">Meetings</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-emerald-400">${(campaign.metrics.pipeline / 1000).toFixed(0)}K</p>
                      <p className="text-xs text-gray-400">Pipeline</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleCampaignStatus(campaign); }}
                    className={`p-2 rounded-lg transition-colors ${
                      campaign.status === 'active'
                        ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                        : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                    }`}
                    title={campaign.status === 'active' ? 'Pause' : 'Activate'}
                  >
                    {campaign.status === 'active' ? <Icons.Pause className="w-4 h-4" /> : <Icons.Play className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteCampaign(campaign.id); }}
                    className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Icons.Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <CreateCampaignModal
          onClose={() => setShowCreateModal(false)}
          onCreate={(campaign) => {
            const newCampaign = storage.addItem<Campaign>('nexus-campaigns', campaign);
            setCampaigns(prev => [...prev, newCampaign]);
            setShowCreateModal(false);
          }}
        />
      )}

      {/* Campaign Detail Sidebar */}
      {selectedCampaign && (
        <CampaignDetailSidebar
          campaign={selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
          onUpdate={(updated) => {
            setCampaigns(prev => prev.map(c => c.id === updated.id ? updated : c));
            setSelectedCampaign(updated);
          }}
        />
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'from-blue-500/20 to-blue-600/10 text-blue-400',
    purple: 'from-purple-500/20 to-purple-600/10 text-purple-400',
    green: 'from-green-500/20 to-green-600/10 text-green-400',
    orange: 'from-orange-500/20 to-orange-600/10 text-orange-400',
    emerald: 'from-emerald-500/20 to-emerald-600/10 text-emerald-400'
  };

  return (
    <div className="glass-panel rounded-xl p-4 relative overflow-hidden group hover:scale-[1.02] transition-all">
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
      <div className="relative z-10">
        <div className={`${colorClasses[color].split(' ').pop()} mb-2`}>{icon}</div>
        <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">{value}</p>
        <p className="text-xs text-gray-400">{label}</p>
      </div>
    </div>
  );
}

// Create Campaign Modal
function CreateCampaignModal({ onClose, onCreate }: { onClose: () => void; onCreate: (campaign: Campaign) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'engagement' as Campaign['type'],
    keywords: '',
    platforms: ['linkedin'] as ('linkedin' | 'twitter' | 'reddit')[],
    dailyLimit: 20,
    tone: 'professional'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const campaign: Campaign = {
      id: storage.generateId(),
      name: formData.name,
      description: formData.description,
      status: 'draft',
      type: formData.type,
      targeting: {
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
        platforms: formData.platforms
      },
      schedule: {
        startDate: new Date().toISOString().split('T')[0],
        dailyLimit: formData.dailyLimit,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      content: {
        templates: [],
        sops: [],
        tone: formData.tone
      },
      metrics: {
        impressions: 0,
        engagements: 0,
        replies: 0,
        meetings: 0,
        pipeline: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onCreate(campaign);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-panel rounded-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold">Create Campaign</h2>
          <p className="text-sm text-gray-400 mt-1">Set up a new engagement campaign</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Campaign Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Q1 ABM Outreach"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of campaign goals..."
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as Campaign['type'] })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50"
              >
                <option value="engagement">Engagement</option>
                <option value="outreach">Outreach</option>
                <option value="awareness">Awareness</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Daily Limit</label>
              <input
                type="number"
                value={formData.dailyLimit}
                onChange={e => setFormData({ ...formData, dailyLimit: parseInt(e.target.value) || 20 })}
                min={1}
                max={100}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Target Keywords</label>
            <input
              type="text"
              value={formData.keywords}
              onChange={e => setFormData({ ...formData, keywords: e.target.value })}
              placeholder="sales automation, ABM, revenue ops"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50"
            />
            <p className="text-xs text-gray-400 mt-1">Comma-separated keywords</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Platforms</label>
            <div className="flex gap-2">
              {(['linkedin', 'twitter', 'reddit'] as const).map(platform => (
                <button
                  key={platform}
                  type="button"
                  onClick={() => {
                    const platforms = formData.platforms.includes(platform)
                      ? formData.platforms.filter(p => p !== platform)
                      : [...formData.platforms, platform];
                    setFormData({ ...formData, platforms });
                  }}
                  className={`px-4 py-2 rounded-lg text-sm capitalize transition-all ${
                    formData.platforms.includes(platform)
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {platform}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white text-sm font-medium rounded-lg transition-all"
            >
              Create Campaign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Campaign Detail Sidebar
function CampaignDetailSidebar({ campaign, onClose, onUpdate }: {
  campaign: Campaign;
  onClose: () => void;
  onUpdate: (campaign: Campaign) => void;
}) {
  const replyRate = campaign.metrics.engagements > 0
    ? ((campaign.metrics.replies / campaign.metrics.engagements) * 100).toFixed(1)
    : '0';

  const meetingRate = campaign.metrics.replies > 0
    ? ((campaign.metrics.meetings / campaign.metrics.replies) * 100).toFixed(1)
    : '0';

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-[480px] glass-panel border-l border-primary/20 shadow-[0_0_50px_rgba(99,102,241,0.15)] z-50 overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 glass-panel border-b border-white/10 p-5 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">{campaign.name}</h2>
            <p className="text-sm text-gray-400 capitalize">{campaign.type} Campaign</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <Icons.X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Performance Overview */}
        <div className="p-5 border-b border-white/10">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Performance</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-4 rounded-xl">
              <p className="text-2xl font-bold text-green-400">{replyRate}%</p>
              <p className="text-xs text-gray-400">Reply Rate</p>
            </div>
            <div className="glass-card p-4 rounded-xl">
              <p className="text-2xl font-bold text-blue-400">{meetingRate}%</p>
              <p className="text-xs text-gray-400">Meeting Rate</p>
            </div>
          </div>

          {/* Funnel */}
          <div className="mt-4 space-y-2">
            <FunnelStep label="Impressions" value={campaign.metrics.impressions} total={campaign.metrics.impressions} />
            <FunnelStep label="Engagements" value={campaign.metrics.engagements} total={campaign.metrics.impressions} />
            <FunnelStep label="Replies" value={campaign.metrics.replies} total={campaign.metrics.impressions} />
            <FunnelStep label="Meetings" value={campaign.metrics.meetings} total={campaign.metrics.impressions} />
          </div>
        </div>

        {/* Targeting */}
        <div className="p-5 border-b border-white/10">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Targeting</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-400 mb-2">Keywords</p>
              <div className="flex flex-wrap gap-2">
                {campaign.targeting.keywords.map((kw, i) => (
                  <span key={i} className="px-2 py-1 bg-primary/20 text-primary text-xs rounded">{kw}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-2">Platforms</p>
              <div className="flex gap-2">
                {campaign.targeting.platforms.map(p => (
                  <span key={p} className="px-3 py-1 bg-white/10 text-sm rounded capitalize">{p}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="p-5 border-b border-white/10">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Schedule</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400">Start Date</p>
              <p>{new Date(campaign.schedule.startDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Daily Limit</p>
              <p>{campaign.schedule.dailyLimit} engagements/day</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-5">
          <div className="flex gap-3">
            <button
              onClick={() => {
                const newStatus = campaign.status === 'active' ? 'paused' : 'active';
                const updated = storage.updateItem<Campaign>('nexus-campaigns', campaign.id, { status: newStatus });
                if (updated) onUpdate(updated);
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                campaign.status === 'active'
                  ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                  : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
              }`}
            >
              {campaign.status === 'active' ? (
                <><Icons.Pause className="w-4 h-4" /> Pause Campaign</>
              ) : (
                <><Icons.Play className="w-4 h-4" /> Activate Campaign</>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Funnel Step Component
function FunnelStep({ label, value, total }: { label: string; value: number; total: number }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span>{value.toLocaleString()}</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default CampaignsPage;
