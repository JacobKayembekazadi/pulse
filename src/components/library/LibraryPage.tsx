// ============================================================================
// LIBRARY PAGE - Content Templates & SOPs
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
          <h1 className="text-2xl font-bold">Content Library</h1>
          <p className="text-gray-400 text-sm mt-1">Manage templates and SOPs for AI-guided responses</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors">
          <Icons.Plus className="w-4 h-4" />
          {activeTab === 'templates' ? 'New Template' : 'New SOP'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'templates' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Icons.FileText className="w-4 h-4 inline mr-2" />
          Templates ({templates.length})
        </button>
        <button
          onClick={() => setActiveTab('sops')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'sops' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Icons.Library className="w-4 h-4 inline mr-2" />
          SOPs ({sops.length})
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : activeTab === 'templates' ? (
        /* Templates Grid */
        <div className="grid grid-cols-2 gap-4">
          {templates.map(template => (
            <div key={template.id} className="bg-[#111113] border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{template.name}</h3>
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

              <p className="text-sm text-gray-300 mb-4 line-clamp-3">{template.content}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>{template.usageCount} uses</span>
                  <span className="text-green-400">{(template.performance.replyRate * 100).toFixed(0)}% reply rate</span>
                </div>
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
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
            <div key={sop.id} className="bg-[#111113] border border-white/10 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <label className="relative inline-flex items-center cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={sop.isActive}
                    onChange={() => handleToggleSOP(sop.id)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-blue-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                </label>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{sop.name}</h3>
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
                        <span key={i} className="px-2 py-0.5 bg-white/5 text-xs rounded">
                          {c.field} {c.operator} {String(c.value)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
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
