// ============================================================================
// LIBRARY PAGE - Content Templates & SOPs
// Uses Pulse Visual Design Language (glassmorphism, neon effects, gradients)
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useContentStore } from '../../store';
import { contentService } from '../../services/content.service';
import { Icons } from '../shared/Icons';
import { ContentTemplate, SOP } from '../../types';

type Tab = 'templates' | 'sops';

export function LibraryPage() {
  const { templates, setTemplates, sops, setSOPs } = useContentStore();
  const [activeTab, setActiveTab] = useState<Tab>('templates');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    setIsLoading(true);
    try {
      const [templatesData, sopsData] = await Promise.all([
        contentService.getTemplates(),
        contentService.getSOPs()
      ]);
      setTemplates(templatesData);
      setSOPs(sopsData);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSOP = async (sopId: string) => {
    try {
      const updated = await contentService.toggleSOP(sopId);
      setSOPs(sops.map(s => s.id === sopId ? updated : s));
    } catch (error) {
      console.error('Error toggling SOP:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
            Content Library
          </h1>
          <p className="text-gray-400 text-sm mt-1">Manage templates and SOPs for AI-guided responses</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white text-sm font-medium rounded-lg transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] hover:scale-105">
          <Icons.Plus className="w-4 h-4" />
          {activeTab === 'templates' ? 'New Template' : 'New SOP'}
        </button>
      </div>

      {/* Tabs */}
      <div className="glass-panel flex gap-1 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'templates'
              ? 'bg-gradient-to-r from-primary/20 to-accent/10 text-white shadow-[0_0_15px_rgba(99,102,241,0.15)]'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Icons.FileText className="w-4 h-4 inline mr-2" />
          Templates ({templates.length})
        </button>
        <button
          onClick={() => setActiveTab('sops')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'sops'
              ? 'bg-gradient-to-r from-primary/20 to-accent/10 text-white shadow-[0_0_15px_rgba(99,102,241,0.15)]'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Icons.Library className="w-4 h-4 inline mr-2" />
          SOPs ({sops.length})
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-t-2 border-accent rounded-full animate-spin" style={{ animationDirection: 'reverse' }}></div>
          </div>
        </div>
      ) : activeTab === 'templates' ? (
        /* Templates Grid */
        <div className="grid grid-cols-2 gap-4">
          {templates.map(template => (
            <div key={template.id} className="glass-card rounded-xl p-5 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div className="flex items-start justify-between mb-3 relative z-10">
                <div>
                  <h3 className="font-semibold group-hover:text-primary transition-colors">{template.name}</h3>
                  <p className="text-sm text-gray-400">{template.category}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded capitalize ${
                  template.type === 'social_comment' ? 'bg-blue-500/20 text-blue-400' :
                  template.type === 'email_outreach' ? 'bg-green-500/20 text-green-400' :
                  'bg-purple-500/20 text-purple-400'
                }`}>
                  {template.type.replace(/_/g, ' ')}
                </span>
              </div>

              <p className="text-sm text-gray-300 mb-4 line-clamp-3 relative z-10">{template.content}</p>

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>{template.usageCount} uses</span>
                  <span className="text-green-400 flex items-center gap-1">
                    <Icons.TrendingUp className="w-3 h-3" />
                    {(template.performance.replyRate * 100).toFixed(0)}% reply rate
                  </span>
                </div>
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                  <Icons.MoreHorizontal className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* SOPs List */
        <div className="space-y-3">
          {sops.map(sop => (
            <div key={sop.id} className="glass-card rounded-xl p-5 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div className="flex items-start gap-4 relative z-10">
                <label className="relative inline-flex items-center cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={sop.isActive}
                    onChange={() => handleToggleSOP(sop.id)}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 rounded-full peer transition-colors ${
                    sop.isActive
                      ? 'bg-gradient-to-r from-primary to-accent shadow-[0_0_10px_rgba(99,102,241,0.3)]'
                      : 'bg-gray-700'
                  } after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full`} />
                </label>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold group-hover:text-primary transition-colors">{sop.name}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded capitalize ${
                      sop.type === 'tone' ? 'bg-blue-500/20 text-blue-400' :
                      sop.type === 'rule' ? 'bg-yellow-500/20 text-yellow-400' :
                      sop.type === 'escalation' ? 'bg-red-500/20 text-red-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {sop.type}
                    </span>
                    <span className="text-xs text-gray-400">{sop.category}</span>
                  </div>
                  <p className="text-sm text-gray-300">{sop.content}</p>

                  {sop.conditions.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      <span className="text-xs text-gray-400">Conditions:</span>
                      {sop.conditions.map((c, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white/5 text-xs rounded hover:bg-primary/20 transition-colors">
                          {c.field} {c.operator} {String(c.value)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                  <Icons.MoreHorizontal className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LibraryPage;
