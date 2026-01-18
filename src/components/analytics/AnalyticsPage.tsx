// ============================================================================
// ANALYTICS PAGE - Performance & Attribution
// ============================================================================

import React from 'react';
import { Icons } from '../shared/Icons';

export function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
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
        <div className="bg-[#111113] border border-white/10 rounded-xl p-5">
          <h3 className="font-semibold mb-4">Engagement Trend</h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Icons.Analytics className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Chart visualization coming soon</p>
            </div>
          </div>
        </div>

        <div className="bg-[#111113] border border-white/10 rounded-xl p-5">
          <h3 className="font-semibold mb-4">Top Performing Content</h3>
          <div className="space-y-3">
            {[
              { name: 'Helpful Value Add', type: 'Template', replies: 18, rate: '40%' },
              { name: 'Curious Question', type: 'Template', replies: 14, rate: '44%' },
              { name: 'Professional Tone', type: 'SOP', replies: 45, rate: '35%' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
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
      <div className="bg-[#111113] border border-white/10 rounded-xl p-5">
        <h3 className="font-semibold mb-4">Attribution Report</h3>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex gap-3">
          <Icons.AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <div>
            <p className="text-sm text-yellow-200">
              Full attribution tracking will show which campaigns, keywords, and interactions
              contributed to pipeline and revenue.
            </p>
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
    <div className="bg-[#111113] border border-white/10 rounded-xl p-5">
      <p className="text-sm text-gray-400 mb-2">{label}</p>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold">{value}</span>
        <span className={`text-sm mb-1 ${positive ? 'text-green-400' : 'text-red-400'}`}>
          {change}
        </span>
      </div>
    </div>
  );
}

export default AnalyticsPage;
