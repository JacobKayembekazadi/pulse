// ============================================================================
// CAMPAIGNS PAGE - Campaign Management & Attribution
// ============================================================================

import React from 'react';
import { Icons } from '../shared/Icons';

export function CampaignsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-gray-400 text-sm mt-1">Create and manage outreach campaigns</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors">
          <Icons.Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {/* Coming Soon */}
      <div className="bg-[#111113] border border-white/10 rounded-xl p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6">
          <Icons.Campaign className="w-8 h-8 text-blue-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Campaign Builder Coming Soon</h2>
        <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
          Create targeted outreach campaigns with keyword targeting, automated comment generation,
          and full attribution tracking.
        </p>
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
          <div className="p-4 bg-white/5 rounded-lg">
            <Icons.Target className="w-6 h-6 text-blue-400 mb-2" />
            <h3 className="font-medium text-sm mb-1">Targeting</h3>
            <p className="text-xs text-gray-400">Keywords, accounts, personas</p>
          </div>
          <div className="p-4 bg-white/5 rounded-lg">
            <Icons.Sparkles className="w-6 h-6 text-purple-400 mb-2" />
            <h3 className="font-medium text-sm mb-1">AI Generation</h3>
            <p className="text-xs text-gray-400">SOP-guided responses</p>
          </div>
          <div className="p-4 bg-white/5 rounded-lg">
            <Icons.Analytics className="w-6 h-6 text-green-400 mb-2" />
            <h3 className="font-medium text-sm mb-1">Attribution</h3>
            <p className="text-xs text-gray-400">Pipeline contribution tracking</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CampaignsPage;
