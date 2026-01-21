// ============================================================================
// ANALYTICS PAGE - Performance & Attribution
// Full featured analytics with SVG charts and data visualization
// Uses Pulse Visual Design Language (glassmorphism, neon effects, gradients)
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { Icons } from '../shared/Icons';
import { storage } from '../../services/storage.service';

// Types for analytics data
interface EngagementData {
  date: string;
  comments: number;
  replies: number;
  meetings: number;
}

interface PlatformData {
  platform: string;
  engagements: number;
  replyRate: number;
  color: string;
}

interface TopContent {
  id: string;
  name: string;
  type: 'template' | 'sop' | 'campaign';
  uses: number;
  replies: number;
  replyRate: number;
}

interface AttributionRecord {
  id: string;
  accountName: string;
  campaign: string;
  touchpoints: number;
  pipelineValue: number;
  status: 'prospect' | 'opportunity' | 'closed';
  date: string;
}

// Generate sample analytics data
const generateEngagementData = (): EngagementData[] => {
  const data: EngagementData[] = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      comments: Math.floor(Math.random() * 30) + 10,
      replies: Math.floor(Math.random() * 15) + 3,
      meetings: Math.floor(Math.random() * 5)
    });
  }
  return data;
};

const defaultPlatformData: PlatformData[] = [
  { platform: 'LinkedIn', engagements: 245, replyRate: 38, color: '#0077B5' },
  { platform: 'Twitter', engagements: 156, replyRate: 28, color: '#1DA1F2' },
  { platform: 'Reddit', engagements: 89, replyRate: 42, color: '#FF4500' },
  { platform: 'Bluesky', engagements: 34, replyRate: 35, color: '#0085FF' }
];

const defaultTopContent: TopContent[] = [
  { id: '1', name: 'Helpful Value Add', type: 'template', uses: 145, replies: 58, replyRate: 40 },
  { id: '2', name: 'Curious Question', type: 'template', uses: 98, replies: 43, replyRate: 44 },
  { id: '3', name: 'Professional Tone', type: 'sop', uses: 234, replies: 82, replyRate: 35 },
  { id: '4', name: 'Enterprise Outreach', type: 'campaign', uses: 67, replies: 31, replyRate: 46 },
  { id: '5', name: 'Problem Solver', type: 'template', uses: 112, replies: 39, replyRate: 35 }
];

const defaultAttribution: AttributionRecord[] = [
  { id: '1', accountName: 'Acme Corp', campaign: 'Q4 Enterprise Push', touchpoints: 12, pipelineValue: 85000, status: 'opportunity', date: '2024-01-10' },
  { id: '2', accountName: 'TechStart Inc', campaign: 'SaaS Outreach', touchpoints: 8, pipelineValue: 45000, status: 'prospect', date: '2024-01-08' },
  { id: '3', accountName: 'Global Systems', campaign: 'Q4 Enterprise Push', touchpoints: 15, pipelineValue: 120000, status: 'closed', date: '2024-01-05' },
  { id: '4', accountName: 'Innovate Labs', campaign: 'LinkedIn Campaign', touchpoints: 6, pipelineValue: 32000, status: 'prospect', date: '2024-01-12' },
  { id: '5', accountName: 'DataFlow Co', campaign: 'SaaS Outreach', touchpoints: 10, pipelineValue: 67000, status: 'opportunity', date: '2024-01-11' }
];

export function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [engagementData, setEngagementData] = useState<EngagementData[]>([]);
  const [platformData, setPlatformData] = useState<PlatformData[]>(defaultPlatformData);
  const [topContent, setTopContent] = useState<TopContent[]>(defaultTopContent);
  const [attribution, setAttribution] = useState<AttributionRecord[]>(defaultAttribution);
  const [activeChart, setActiveChart] = useState<'engagement' | 'platform' | 'sentiment'>('engagement');

  // Load or generate data
  useEffect(() => {
    const savedAnalytics = storage.get<{ engagementData: EngagementData[] }>('nexus-analytics', { engagementData: [] });
    if (savedAnalytics.engagementData.length === 0) {
      const newData = generateEngagementData();
      setEngagementData(newData);
      storage.set('nexus-analytics', { engagementData: newData });
    } else {
      setEngagementData(savedAnalytics.engagementData);
    }
  }, []);

  // Calculate summary stats
  const stats = useMemo(() => {
    const totalComments = engagementData.reduce((sum, d) => sum + d.comments, 0);
    const totalReplies = engagementData.reduce((sum, d) => sum + d.replies, 0);
    const totalMeetings = engagementData.reduce((sum, d) => sum + d.meetings, 0);
    const replyRate = totalComments > 0 ? Math.round((totalReplies / totalComments) * 100) : 0;
    const pipelineInfluenced = attribution.reduce((sum, a) => sum + a.pipelineValue, 0);

    return {
      totalComments,
      totalReplies,
      totalMeetings,
      replyRate,
      pipelineInfluenced
    };
  }, [engagementData, attribution]);

  // Filter data by time range
  const filteredData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    return engagementData.slice(-days);
  }, [engagementData, timeRange]);

  // Chart dimensions
  const chartWidth = 600;
  const chartHeight = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };

  // Scale calculations for line chart
  const xScale = (index: number) => {
    const width = chartWidth - padding.left - padding.right;
    return padding.left + (index / (filteredData.length - 1)) * width;
  };

  const yScale = (value: number, max: number) => {
    const height = chartHeight - padding.top - padding.bottom;
    return chartHeight - padding.bottom - (value / max) * height;
  };

  const maxValue = Math.max(...filteredData.map(d => Math.max(d.comments, d.replies)));

  // Generate line path
  const generatePath = (data: number[]) => {
    if (data.length === 0) return '';
    const max = Math.max(...data, 1);
    return data.map((value, index) => {
      const x = xScale(index);
      const y = yScale(value, max);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  // Generate area path
  const generateAreaPath = (data: number[]) => {
    if (data.length === 0) return '';
    const max = Math.max(...data, 1);
    const linePath = data.map((value, index) => {
      const x = xScale(index);
      const y = yScale(value, max);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return `${linePath} L ${xScale(data.length - 1)} ${chartHeight - padding.bottom} L ${padding.left} ${chartHeight - padding.bottom} Z`;
  };

  // Bar chart for platforms
  const barWidth = 60;
  const barGap = 30;
  const maxEngagements = Math.max(...platformData.map(p => p.engagements));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
            Analytics
          </h1>
          <p className="text-gray-400 text-sm mt-1">Track performance and attribution across all channels</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                timeRange === range
                  ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-400 border border-orange-500/30'
                  : 'glass-card text-gray-400 hover:text-white'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard
          label="Comments Sent"
          value={stats.totalComments.toString()}
          change="+12%"
          positive
          icon={Icons.MessageSquare}
          color="blue"
        />
        <StatCard
          label="Replies Received"
          value={stats.totalReplies.toString()}
          change="+18%"
          positive
          icon={Icons.Reply}
          color="green"
        />
        <StatCard
          label="Reply Rate"
          value={`${stats.replyRate}%`}
          change="+5%"
          positive
          icon={Icons.TrendingUp}
          color="purple"
        />
        <StatCard
          label="Meetings Booked"
          value={stats.totalMeetings.toString()}
          change="+8"
          positive
          icon={Icons.Calendar}
          color="yellow"
        />
        <StatCard
          label="Pipeline Influenced"
          value={`$${Math.round(stats.pipelineInfluenced / 1000)}K`}
          change="+$45K"
          positive
          icon={Icons.DollarSign}
          color="orange"
        />
      </div>

      {/* Chart Selection Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        {[
          { id: 'engagement', label: 'Engagement Trend', icon: Icons.TrendingUp },
          { id: 'platform', label: 'By Platform', icon: Icons.Grid },
          { id: 'sentiment', label: 'Sentiment Analysis', icon: Icons.Heart }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveChart(tab.id as typeof activeChart)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeChart === tab.id
                ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-400 border border-orange-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-3 gap-6">
        {/* Primary Chart */}
        <div className="col-span-2 glass-panel rounded-xl p-5 relative overflow-hidden">
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl"></div>

          {activeChart === 'engagement' && (
            <>
              <h3 className="font-semibold mb-4 relative z-10 flex items-center gap-2">
                <span className="w-1 h-4 bg-gradient-to-b from-orange-400 to-red-500 rounded-full"></span>
                Engagement Over Time
              </h3>
              <div className="relative z-10">
                <svg width="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
                  {/* Grid lines */}
                  {[0, 25, 50, 75, 100].map(percent => {
                    const y = chartHeight - padding.bottom - (percent / 100) * (chartHeight - padding.top - padding.bottom);
                    return (
                      <g key={percent}>
                        <line
                          x1={padding.left}
                          y1={y}
                          x2={chartWidth - padding.right}
                          y2={y}
                          stroke="rgba(255,255,255,0.1)"
                          strokeDasharray="4,4"
                        />
                        <text x={padding.left - 8} y={y + 4} fill="#666" fontSize="10" textAnchor="end">
                          {Math.round((percent / 100) * maxValue)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Area fills */}
                  <defs>
                    <linearGradient id="commentsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="repliesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  <path
                    d={generateAreaPath(filteredData.map(d => d.comments))}
                    fill="url(#commentsGradient)"
                  />
                  <path
                    d={generateAreaPath(filteredData.map(d => d.replies))}
                    fill="url(#repliesGradient)"
                  />

                  {/* Lines */}
                  <path
                    d={generatePath(filteredData.map(d => d.comments))}
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d={generatePath(filteredData.map(d => d.replies))}
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Data points */}
                  {filteredData.map((d, i) => (
                    <g key={i}>
                      <circle
                        cx={xScale(i)}
                        cy={yScale(d.comments, maxValue)}
                        r="3"
                        fill="#f97316"
                        className="opacity-0 hover:opacity-100 transition-opacity"
                      />
                      <circle
                        cx={xScale(i)}
                        cy={yScale(d.replies, maxValue)}
                        r="3"
                        fill="#22c55e"
                        className="opacity-0 hover:opacity-100 transition-opacity"
                      />
                    </g>
                  ))}

                  {/* X-axis labels */}
                  {filteredData.filter((_, i) => i % Math.ceil(filteredData.length / 6) === 0).map((d, i, arr) => {
                    const idx = filteredData.indexOf(d);
                    return (
                      <text
                        key={d.date}
                        x={xScale(idx)}
                        y={chartHeight - 8}
                        fill="#666"
                        fontSize="10"
                        textAnchor="middle"
                      >
                        {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </text>
                    );
                  })}
                </svg>

                {/* Legend */}
                <div className="flex gap-6 mt-4 justify-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-sm text-gray-400">Comments</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm text-gray-400">Replies</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeChart === 'platform' && (
            <>
              <h3 className="font-semibold mb-4 relative z-10 flex items-center gap-2">
                <span className="w-1 h-4 bg-gradient-to-b from-blue-400 to-cyan-500 rounded-full"></span>
                Engagements by Platform
              </h3>
              <div className="relative z-10">
                <svg width="100%" viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`} className="overflow-visible">
                  {platformData.map((p, i) => {
                    const barHeight = (p.engagements / maxEngagements) * (chartHeight - padding.top - padding.bottom);
                    const x = padding.left + i * (barWidth + barGap) + barGap;
                    const y = chartHeight - padding.bottom - barHeight;

                    return (
                      <g key={p.platform}>
                        {/* Bar background */}
                        <rect
                          x={x}
                          y={padding.top}
                          width={barWidth}
                          height={chartHeight - padding.top - padding.bottom}
                          fill="rgba(255,255,255,0.05)"
                          rx="4"
                        />
                        {/* Bar */}
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={barHeight}
                          fill={p.color}
                          rx="4"
                          className="transition-all duration-300 hover:opacity-80"
                        />
                        {/* Value label */}
                        <text
                          x={x + barWidth / 2}
                          y={y - 8}
                          fill="white"
                          fontSize="12"
                          fontWeight="500"
                          textAnchor="middle"
                        >
                          {p.engagements}
                        </text>
                        {/* Platform label */}
                        <text
                          x={x + barWidth / 2}
                          y={chartHeight - 8}
                          fill="#999"
                          fontSize="11"
                          textAnchor="middle"
                        >
                          {p.platform}
                        </text>
                        {/* Reply rate */}
                        <text
                          x={x + barWidth / 2}
                          y={chartHeight + 12}
                          fill="#666"
                          fontSize="10"
                          textAnchor="middle"
                        >
                          {p.replyRate}% reply
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </>
          )}

          {activeChart === 'sentiment' && (
            <>
              <h3 className="font-semibold mb-4 relative z-10 flex items-center gap-2">
                <span className="w-1 h-4 bg-gradient-to-b from-purple-400 to-pink-500 rounded-full"></span>
                Sentiment Distribution
              </h3>
              <div className="relative z-10 flex items-center justify-center">
                <svg width="220" height="220" viewBox="0 0 220 220">
                  {/* Donut chart */}
                  <defs>
                    <linearGradient id="positiveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                    <linearGradient id="neutralGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                    <linearGradient id="negativeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#f97316" />
                    </linearGradient>
                  </defs>

                  {/* Background circle */}
                  <circle cx="110" cy="110" r="80" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="30" />

                  {/* Segments - Positive 58%, Neutral 32%, Negative 10% */}
                  <circle
                    cx="110"
                    cy="110"
                    r="80"
                    fill="none"
                    stroke="url(#positiveGrad)"
                    strokeWidth="30"
                    strokeDasharray="290 502"
                    strokeDashoffset="125"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="110"
                    cy="110"
                    r="80"
                    fill="none"
                    stroke="url(#neutralGrad)"
                    strokeWidth="30"
                    strokeDasharray="160 502"
                    strokeDashoffset="-165"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="110"
                    cy="110"
                    r="80"
                    fill="none"
                    stroke="url(#negativeGrad)"
                    strokeWidth="30"
                    strokeDasharray="50 502"
                    strokeDashoffset="-325"
                    strokeLinecap="round"
                  />

                  {/* Center text */}
                  <text x="110" y="100" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold">
                    58%
                  </text>
                  <text x="110" y="125" textAnchor="middle" fill="#999" fontSize="12">
                    Positive
                  </text>
                </svg>

                {/* Legend */}
                <div className="ml-8 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"></div>
                    <div>
                      <p className="text-sm font-medium">Positive</p>
                      <p className="text-xs text-gray-400">58% (245 mentions)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                    <div>
                      <p className="text-sm font-medium">Neutral</p>
                      <p className="text-xs text-gray-400">32% (135 mentions)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 to-orange-500"></div>
                    <div>
                      <p className="text-sm font-medium">Negative</p>
                      <p className="text-xs text-gray-400">10% (42 mentions)</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Top Performing Content */}
        <div className="glass-panel rounded-xl p-5 relative overflow-hidden">
          <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-green-500/10 rounded-full blur-3xl"></div>

          <h3 className="font-semibold mb-4 relative z-10 flex items-center gap-2">
            <span className="w-1 h-4 bg-gradient-to-b from-green-400 to-emerald-500 rounded-full"></span>
            Top Performing Content
          </h3>
          <div className="space-y-3 relative z-10">
            {topContent.map((item, i) => (
              <div key={item.id} className="glass-card flex items-center justify-between p-3 rounded-lg group hover:border-green-500/30">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-600">#{i + 1}</span>
                  <div>
                    <p className="font-medium text-sm group-hover:text-green-400 transition-colors">{item.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{item.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm text-green-400">{item.replyRate}%</p>
                  <p className="text-xs text-gray-400">{item.replies} replies</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attribution Table */}
      <div className="glass-panel rounded-xl p-5 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-yellow-500/5 rounded-full blur-3xl"></div>

        <div className="flex items-center justify-between mb-4 relative z-10">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="w-1 h-4 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full"></span>
            Attribution Report
          </h3>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">Total Pipeline:</span>
            <span className="font-semibold text-yellow-400">
              ${(attribution.reduce((sum, a) => sum + a.pipelineValue, 0) / 1000).toFixed(0)}K
            </span>
          </div>
        </div>

        <div className="relative z-10 overflow-hidden rounded-lg border border-white/10">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left p-3 text-sm font-medium text-gray-400">Account</th>
                <th className="text-left p-3 text-sm font-medium text-gray-400">Campaign</th>
                <th className="text-center p-3 text-sm font-medium text-gray-400">Touchpoints</th>
                <th className="text-right p-3 text-sm font-medium text-gray-400">Pipeline Value</th>
                <th className="text-center p-3 text-sm font-medium text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {attribution.map(record => (
                <tr key={record.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-3">
                    <p className="font-medium text-sm">{record.accountName}</p>
                    <p className="text-xs text-gray-500">{new Date(record.date).toLocaleDateString()}</p>
                  </td>
                  <td className="p-3 text-sm text-gray-300">{record.campaign}</td>
                  <td className="p-3 text-center">
                    <span className="inline-flex items-center gap-1 text-sm">
                      <Icons.Zap className="w-3 h-3 text-yellow-400" />
                      {record.touchpoints}
                    </span>
                  </td>
                  <td className="p-3 text-right font-medium text-green-400">
                    ${record.pipelineValue.toLocaleString()}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      record.status === 'closed'
                        ? 'bg-green-500/20 text-green-400'
                        : record.status === 'opportunity'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Attribution Insights */}
        <div className="mt-4 grid grid-cols-3 gap-4 relative z-10">
          <div className="glass-card p-4 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Avg. Touchpoints to Close</p>
            <p className="text-2xl font-bold text-orange-400">8.3</p>
          </div>
          <div className="glass-card p-4 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Top Converting Campaign</p>
            <p className="text-sm font-medium text-white">Q4 Enterprise Push</p>
            <p className="text-xs text-green-400">46% close rate</p>
          </div>
          <div className="glass-card p-4 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Best Performing Channel</p>
            <p className="text-sm font-medium text-white">LinkedIn</p>
            <p className="text-xs text-green-400">38% of pipeline influenced</p>
          </div>
        </div>
      </div>

      {/* Engagement Heatmap */}
      <div className="glass-panel rounded-xl p-5 relative overflow-hidden">
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>

        <h3 className="font-semibold mb-4 relative z-10 flex items-center gap-2">
          <span className="w-1 h-4 bg-gradient-to-b from-purple-400 to-pink-500 rounded-full"></span>
          Best Times to Engage
        </h3>

        <div className="relative z-10">
          <div className="grid grid-cols-8 gap-1">
            <div></div>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-center text-xs text-gray-400 pb-2">{day}</div>
            ))}

            {['6am', '9am', '12pm', '3pm', '6pm', '9pm'].map((time, hourIdx) => (
              <React.Fragment key={time}>
                <div className="text-xs text-gray-400 text-right pr-2 py-1">{time}</div>
                {[0, 1, 2, 3, 4, 5, 6].map(dayIdx => {
                  // Generate engagement intensity (higher during work hours weekdays)
                  let intensity = Math.random();
                  if (dayIdx < 5 && hourIdx >= 1 && hourIdx <= 3) {
                    intensity = 0.5 + Math.random() * 0.5;
                  }
                  if (dayIdx >= 5) {
                    intensity = Math.random() * 0.3;
                  }

                  return (
                    <div
                      key={`${dayIdx}-${hourIdx}`}
                      className="aspect-square rounded transition-all hover:scale-110 cursor-pointer"
                      style={{
                        backgroundColor: `rgba(249, 115, 22, ${intensity})`,
                      }}
                      title={`${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][dayIdx]} ${time}: ${Math.round(intensity * 100)}% engagement`}
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </div>

          <div className="flex items-center justify-center gap-4 mt-4">
            <span className="text-xs text-gray-400">Low</span>
            <div className="flex gap-1">
              {[0.1, 0.3, 0.5, 0.7, 0.9].map(opacity => (
                <div
                  key={opacity}
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: `rgba(249, 115, 22, ${opacity})` }}
                />
              ))}
            </div>
            <span className="text-xs text-gray-400">High</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  change,
  positive,
  icon: Icon,
  color
}: {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'orange';
}) {
  const colorMap = {
    blue: 'from-blue-500/30 to-cyan-500/30',
    green: 'from-green-500/30 to-emerald-500/30',
    purple: 'from-purple-500/30 to-pink-500/30',
    yellow: 'from-yellow-500/30 to-amber-500/30',
    orange: 'from-orange-500/30 to-red-500/30'
  };

  const iconColorMap = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
    yellow: 'text-yellow-400',
    orange: 'text-orange-400'
  };

  return (
    <div className="glass-panel rounded-xl p-4 relative overflow-hidden group hover:scale-[1.02] transition-all">
      <div className={`absolute inset-0 bg-gradient-to-br ${positive ? 'from-green-500/5 to-emerald-500/5' : 'from-red-500/5 to-orange-500/5'} opacity-0 group-hover:opacity-100 transition-opacity`}></div>

      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-xs text-gray-400 mb-1">{label}</p>
          <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">{value}</span>
        </div>
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colorMap[color]} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${iconColorMap[color]}`} />
        </div>
      </div>

      <div className="mt-2 relative z-10">
        <span className={`text-xs flex items-center gap-1 ${positive ? 'text-green-400' : 'text-red-400'}`}>
          {positive ? <Icons.TrendingUp className="w-3 h-3" /> : <Icons.TrendingDown className="w-3 h-3" />}
          {change}
        </span>
      </div>
    </div>
  );
}

export default AnalyticsPage;
