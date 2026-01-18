// ============================================================================
// ANALYTICS PAGE - Performance & Attribution
// Uses Pulse Visual Design Language (glassmorphism, neon effects, gradients)
// ============================================================================

import React from 'react';
import { Icons } from '../shared/Icons';

export function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
          Analytics
        </h1>
        <p className="text-gray-400 text-sm mt-1">Track performance and attribution</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Comments Sent" value="342" change="+12%" positive />
        <StatCard label="Reply Rate" value="34%" change="+5%" positive />
        <StatCard label="Meetings Booked" value="28" change="+8" positive />
        <StatCard label="Pipeline Influenced" value="$234K" change="+$45K" positive />
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-2 gap-6">
        <div className="glass-panel rounded-xl p-5 relative overflow-hidden">
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>

          <h3 className="font-semibold mb-4 relative z-10 flex items-center gap-2">
            <span className="w-1 h-4 bg-gradient-to-b from-primary to-accent rounded-full"></span>
            Engagement Trend
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-400 relative z-10">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
                <Icons.Analytics className="w-8 h-8 text-primary opacity-70" />
              </div>
              <p className="text-sm">Chart visualization coming soon</p>
              <p className="text-xs text-gray-500 mt-1">Powered by real-time data</p>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-5 relative overflow-hidden">
          <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-green-500/10 rounded-full blur-3xl"></div>

          <h3 className="font-semibold mb-4 relative z-10 flex items-center gap-2">
            <span className="w-1 h-4 bg-gradient-to-b from-green-400 to-emerald-500 rounded-full"></span>
            Top Performing Content
          </h3>
          <div className="space-y-3 relative z-10">
            {[
              { name: 'Helpful Value Add', type: 'Template', replies: 18, rate: '40%' },
              { name: 'Curious Question', type: 'Template', replies: 14, rate: '44%' },
              { name: 'Professional Tone', type: 'SOP', replies: 45, rate: '35%' },
            ].map((item, i) => (
              <div key={i} className="glass-card flex items-center justify-between p-3 rounded-lg group hover:border-green-500/30">
                <div>
                  <p className="font-medium text-sm group-hover:text-green-400 transition-colors">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.type}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm text-green-400">{item.rate}</p>
                  <p className="text-xs text-gray-400">{item.replies} replies</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attribution */}
      <div className="glass-panel rounded-xl p-5 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-yellow-500/5 rounded-full blur-3xl"></div>

        <h3 className="font-semibold mb-4 relative z-10 flex items-center gap-2">
          <span className="w-1 h-4 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full"></span>
          Attribution Report
        </h3>
        <div className="glass-card border-yellow-500/20 rounded-lg p-4 flex gap-3 relative z-10 group hover:border-yellow-500/40">
          <Icons.AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
          <div>
            <p className="text-sm text-yellow-200">
              Full attribution tracking will show which campaigns, keywords, and interactions
              contributed to pipeline and revenue.
            </p>
            <button className="mt-3 text-xs text-yellow-400 hover:text-yellow-300 transition-colors flex items-center gap-1">
              Learn more <Icons.ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, change, positive }: {
  label: string;
  value: string;
  change: string;
  positive: boolean;
}) {
  return (
    <div className="glass-panel rounded-xl p-5 relative overflow-hidden group hover:scale-[1.02] transition-all">
      <div className={`absolute inset-0 bg-gradient-to-br ${positive ? 'from-green-500/5 to-emerald-500/5' : 'from-red-500/5 to-orange-500/5'} opacity-0 group-hover:opacity-100 transition-opacity`}></div>

      <p className="text-sm text-gray-400 mb-2 relative z-10">{label}</p>
      <div className="flex items-end gap-2 relative z-10">
        <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">{value}</span>
        <span className={`text-sm mb-1 flex items-center gap-1 ${positive ? 'text-green-400' : 'text-red-400'}`}>
          {positive ? <Icons.TrendingUp className="w-3 h-3" /> : <Icons.TrendingDown className="w-3 h-3" />}
          {change}
        </span>
      </div>
    </div>
  );
}

export default AnalyticsPage;
