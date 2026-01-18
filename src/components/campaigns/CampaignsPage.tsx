// ============================================================================
// CAMPAIGNS PAGE - Campaign Management & Attribution
// Uses Pulse Visual Design Language (glassmorphism, neon effects, gradients)
// ============================================================================

import React from 'react';
import { Icons } from '../shared/Icons';

export function CampaignsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
            Campaigns
          </h1>
          <p className="text-gray-400 text-sm mt-1">Create and manage outreach campaigns</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white text-sm font-medium rounded-lg transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] hover:scale-105">
          <Icons.Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {/* Coming Soon */}
      <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(99,102,241,0.3)] animate-pulse">
            <Icons.Campaign className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
            Campaign Builder Coming Soon
          </h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto mb-8">
            Create targeted outreach campaigns with keyword targeting, automated comment generation,
            and full attribution tracking.
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="glass-card p-4 rounded-xl group hover:border-primary/30">
              <Icons.Target className="w-6 h-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="font-medium text-sm mb-1">Targeting</h3>
              <p className="text-xs text-gray-400">Keywords, accounts, personas</p>
            </div>
            <div className="glass-card p-4 rounded-xl group hover:border-purple-500/30">
              <Icons.Sparkles className="w-6 h-6 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="font-medium text-sm mb-1">AI Generation</h3>
              <p className="text-xs text-gray-400">SOP-guided responses</p>
            </div>
            <div className="glass-card p-4 rounded-xl group hover:border-green-500/30">
              <Icons.Analytics className="w-6 h-6 text-green-400 mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="font-medium text-sm mb-1">Attribution</h3>
              <p className="text-xs text-gray-400">Pipeline contribution tracking</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CampaignsPage;
