// ============================================================================
// COMPETE PAGE - Competitive Intelligence
// Uses Pulse Visual Design Language (glassmorphism, neon effects, gradients)
// ============================================================================

import React from 'react';
import { Icons } from '../shared/Icons';

export function CompetePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
            Competitive Intelligence
          </h1>
          <p className="text-gray-400 text-sm mt-1">Monitor competitors and track market positioning</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90 text-white text-sm font-medium rounded-lg transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.4)] hover:scale-105">
          <Icons.Plus className="w-4 h-4" />
          Add Competitor
        </button>
      </div>

      <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/30 to-red-500/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(249,115,22,0.3)] animate-pulse">
            <Icons.Compete className="w-8 h-8 text-orange-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">
            Competitive Intelligence Coming Soon
          </h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto mb-8">
            Track competitor mentions, compare features, analyze win/loss patterns, and get alerts
            when competitors engage with your target accounts.
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="glass-card p-4 rounded-xl group hover:border-orange-500/30">
              <Icons.Search className="w-6 h-6 text-orange-400 mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="font-medium text-sm mb-1">Mention Tracking</h3>
              <p className="text-xs text-gray-400">Monitor competitor mentions</p>
            </div>
            <div className="glass-card p-4 rounded-xl group hover:border-yellow-500/30">
              <Icons.Layers className="w-6 h-6 text-yellow-400 mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="font-medium text-sm mb-1">Battle Cards</h3>
              <p className="text-xs text-gray-400">Feature comparisons</p>
            </div>
            <div className="glass-card p-4 rounded-xl group hover:border-red-500/30">
              <Icons.TrendingUp className="w-6 h-6 text-red-400 mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="font-medium text-sm mb-1">Win/Loss</h3>
              <p className="text-xs text-gray-400">Track competitive outcomes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompetePage;
