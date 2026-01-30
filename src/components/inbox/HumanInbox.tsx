// ============================================================================
// HUMAN INBOX
// Review and approve/reject prospects before sending
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Icons } from '../shared/Icons';
import { getProspects, updateProspect, transitionProspect, getPipelineStats } from '../../services/db.service';
import { STATE_COLORS, STATE_LABELS } from '../../lib/pipeline';
import type { Prospect, ProspectState } from '../../lib/database.types';

type TabState = 'pending_human' | 'approved' | 'rejected' | 'sent';

export function HumanInbox() {
  const [activeTab, setActiveTab] = useState<TabState>('pending_human');
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<Record<ProspectState, number>>({} as Record<ProspectState, number>);
  const [editingDraft, setEditingDraft] = useState(false);
  const [draftText, setDraftText] = useState('');

  // Load prospects and stats
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prospectData, statsData] = await Promise.all([
        getProspects({ state: activeTab, limit: 50 }),
        getPipelineStats(),
      ]);
      setProspects(prospectData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading inbox data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingDraft) return;

      if (e.key === 'j') {
        // Next prospect
        const currentIndex = prospects.findIndex(p => p.id === selectedProspect?.id);
        if (currentIndex < prospects.length - 1) {
          setSelectedProspect(prospects[currentIndex + 1]);
        }
      } else if (e.key === 'k') {
        // Previous prospect
        const currentIndex = prospects.findIndex(p => p.id === selectedProspect?.id);
        if (currentIndex > 0) {
          setSelectedProspect(prospects[currentIndex - 1]);
        }
      } else if (e.key === 'a' && selectedProspect && activeTab === 'pending_human') {
        handleApprove(selectedProspect.id);
      } else if (e.key === 'r' && selectedProspect && activeTab === 'pending_human') {
        handleReject(selectedProspect.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProspect, prospects, activeTab, editingDraft]);

  const handleApprove = async (id: string) => {
    try {
      await transitionProspect(id, 'approved');
      setProspects(prev => prev.filter(p => p.id !== id));
      setSelectedProspect(null);
      loadData(); // Refresh stats
    } catch (error) {
      console.error('Error approving prospect:', error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await transitionProspect(id, 'rejected');
      setProspects(prev => prev.filter(p => p.id !== id));
      setSelectedProspect(null);
      loadData();
    } catch (error) {
      console.error('Error rejecting prospect:', error);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedProspect) return;

    try {
      await updateProspect(selectedProspect.id, { draft_message: draftText });
      setSelectedProspect({ ...selectedProspect, draft_message: draftText });
      setEditingDraft(false);
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  const tabs: { id: TabState; label: string; count: number }[] = [
    { id: 'pending_human', label: 'Pending Review', count: stats.pending_human || 0 },
    { id: 'approved', label: 'Approved', count: stats.approved || 0 },
    { id: 'rejected', label: 'Rejected', count: stats.rejected || 0 },
    { id: 'sent', label: 'Sent', count: stats.sent || 0 },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div>
          <h1 className="text-xl font-bold">Human Inbox</h1>
          <p className="text-sm text-gray-400">Review and approve messages before sending</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded">j/k</kbd> navigate
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded">a</kbd> approve
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded">r</kbd> reject
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-2 border-b border-white/10 bg-white/5">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSelectedProspect(null);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                activeTab === tab.id ? 'bg-white/20' : 'bg-white/10'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Prospect List */}
        <div className="w-1/3 border-r border-white/10 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Icons.RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : prospects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <Icons.Inbox className="w-8 h-8 mb-2 opacity-50" />
              <p>No prospects in this queue</p>
            </div>
          ) : (
            prospects.map(prospect => (
              <button
                key={prospect.id}
                onClick={() => {
                  setSelectedProspect(prospect);
                  setDraftText(prospect.draft_message || '');
                  setEditingDraft(false);
                }}
                className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${
                  selectedProspect?.id === prospect.id ? 'bg-white/10' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    prospect.platform === 'reddit' ? 'bg-orange-500/20 text-orange-400' :
                    prospect.platform === 'twitter' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-blue-600/20 text-blue-500'
                  }`}>
                    {prospect.platform === 'reddit' && <Icons.Reddit className="w-4 h-4" />}
                    {prospect.platform === 'twitter' && <Icons.Twitter className="w-4 h-4" />}
                    {prospect.platform === 'linkedin' && <Icons.LinkedIn className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {prospect.author_data?.name || 'Unknown'}
                      </span>
                      {prospect.quality_score && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          prospect.quality_score >= 80 ? 'bg-green-500/20 text-green-400' :
                          prospect.quality_score >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {prospect.quality_score}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {prospect.post_data?.title || prospect.post_data?.body?.slice(0, 50)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(prospect.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Prospect Detail */}
        <div className="flex-1 overflow-y-auto">
          {selectedProspect ? (
            <div className="p-6">
              {/* Author Info */}
              <div className="flex items-start gap-4 mb-6">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  selectedProspect.platform === 'reddit' ? 'bg-orange-500/20 text-orange-400' :
                  selectedProspect.platform === 'twitter' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-blue-600/20 text-blue-500'
                }`}>
                  {selectedProspect.platform === 'reddit' && <Icons.Reddit className="w-6 h-6" />}
                  {selectedProspect.platform === 'twitter' && <Icons.Twitter className="w-6 h-6" />}
                  {selectedProspect.platform === 'linkedin' && <Icons.LinkedIn className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">
                    {selectedProspect.author_data?.name || 'Unknown'}
                  </h2>
                  <p className="text-sm text-gray-400">
                    @{selectedProspect.author_data?.handle}
                    {selectedProspect.author_data?.karma && (
                      <span className="ml-2">• {selectedProspect.author_data.karma.toLocaleString()} karma</span>
                    )}
                  </p>
                  {selectedProspect.author_data?.title && (
                    <p className="text-sm text-gray-500 mt-1">{selectedProspect.author_data.title}</p>
                  )}
                </div>
                <div className={`px-3 py-1 rounded-full text-xs ${STATE_COLORS[selectedProspect.state].bg} ${STATE_COLORS[selectedProspect.state].text}`}>
                  {STATE_LABELS[selectedProspect.state]}
                </div>
              </div>

              {/* Original Post */}
              <div className="bg-white/5 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <span>{selectedProspect.post_data?.subreddit && `r/${selectedProspect.post_data.subreddit}`}</span>
                  <span>•</span>
                  <span>{new Date(selectedProspect.created_at).toLocaleString()}</span>
                </div>
                {selectedProspect.post_data?.title && (
                  <h3 className="font-medium mb-2">{selectedProspect.post_data.title}</h3>
                )}
                <p className="text-sm text-gray-300 whitespace-pre-wrap">
                  {selectedProspect.post_data?.body}
                </p>
                {selectedProspect.post_data?.url && (
                  <a
                    href={selectedProspect.post_data.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary mt-3 hover:underline"
                  >
                    View Original <Icons.ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Quality Score */}
              {selectedProspect.qualification_data && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Qualification</h4>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="text-2xl font-bold">
                        {selectedProspect.qualification_data.score}/100
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        selectedProspect.qualification_data.icpMatch === 'high' ? 'bg-green-500/20 text-green-400' :
                        selectedProspect.qualification_data.icpMatch === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {selectedProspect.qualification_data.icpMatch} ICP match
                      </span>
                    </div>
                    <div className="space-y-1">
                      {selectedProspect.qualification_data.reasons?.map((reason, i) => (
                        <p key={i} className="text-xs text-gray-400">• {reason}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Draft Message */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-400">Draft Reply</h4>
                  {!editingDraft && selectedProspect.draft_message && (
                    <button
                      onClick={() => setEditingDraft(true)}
                      className="text-xs text-primary hover:underline"
                    >
                      Edit
                    </button>
                  )}
                </div>
                {editingDraft ? (
                  <div>
                    <textarea
                      value={draftText}
                      onChange={(e) => setDraftText(e.target.value)}
                      className="w-full h-32 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-primary/50"
                      placeholder="Write your reply..."
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={handleSaveDraft}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/80"
                      >
                        Save Draft
                      </button>
                      <button
                        onClick={() => {
                          setEditingDraft(false);
                          setDraftText(selectedProspect.draft_message || '');
                        }}
                        className="px-4 py-2 bg-white/10 text-gray-300 rounded-lg text-sm hover:bg-white/20"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : selectedProspect.draft_message ? (
                  <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-xl p-4">
                    <p className="text-sm whitespace-pre-wrap">{selectedProspect.draft_message}</p>
                  </div>
                ) : (
                  <div className="bg-white/5 rounded-xl p-4 text-center text-gray-500 text-sm">
                    No draft generated yet
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {activeTab === 'pending_human' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(selectedProspect.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors"
                  >
                    <Icons.Check className="w-5 h-5" />
                    Approve & Send
                  </button>
                  <button
                    onClick={() => handleReject(selectedProspect.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-medium transition-colors"
                  >
                    <Icons.X className="w-5 h-5" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Icons.Inbox className="w-12 h-12 mb-3 opacity-30" />
              <p>Select a prospect to review</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HumanInbox;
