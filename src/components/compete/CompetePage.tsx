// ============================================================================
// COMPETE PAGE - Competitive Intelligence
// ============================================================================

import React from 'react';
import { Icons } from '../shared/Icons';

export function CompetePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Competitive Intelligence</h1>
          <p className="text-gray-400 text-sm mt-1">Monitor competitors and track market positioning</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors">
          <Icons.Plus className="w-4 h-4" />
          Add Competitor
        </button>
      </div>

      <div className="bg-[#111113] border border-white/10 rounded-xl p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center mx-auto mb-6">
          <Icons.Compete className="w-8 h-8 text-orange-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Competitive Intelligence Coming Soon</h2>
        <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
          Track competitor mentions, compare features, analyze win/loss patterns, and get alerts
          when competitors engage with your target accounts.
        </p>
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
          <div className="p-4 bg-white/5 rounded-lg">
            <Icons.Search className="w-6 h-6 text-orange-400 mb-2" />
            <h3 className="font-medium text-sm mb-1">Mention Tracking</h3>
            <p className="text-xs text-gray-400">Monitor competitor mentions</p>
          </div>
          <div className="p-4 bg-white/5 rounded-lg">
            <Icons.Layers className="w-6 h-6 text-yellow-400 mb-2" />
            <h3 className="font-medium text-sm mb-1">Battle Cards</h3>
            <p className="text-xs text-gray-400">Feature comparisons</p>
          </div>
          <div className="p-4 bg-white/5 rounded-lg">
            <Icons.TrendingUp className="w-6 h-6 text-red-400 mb-2" />
            <h3 className="font-medium text-sm mb-1">Win/Loss</h3>
            <p className="text-xs text-gray-400">Track competitive outcomes</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompetePage;
