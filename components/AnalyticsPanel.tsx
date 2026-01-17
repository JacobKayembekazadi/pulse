import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { AnalyticsData } from '../types';

interface AnalyticsPanelProps {
  data: AnalyticsData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface border border-white/10 p-2 rounded shadow-xl backdrop-blur-md">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-sm text-primary font-bold">
          Vol: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ data }) => {
  // Mock distribution for the bar chart
  const sentimentData = [
    { name: 'Positive', value: 65, color: '#10b981' },
    { name: 'Neutral', value: 25, color: '#6b7280' },
    { name: 'Negative', value: 10, color: '#ef4444' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
      {/* Volume Chart - Takes up 2 cols */}
      <div className="lg:col-span-2 glass-panel rounded-xl p-4 flex flex-col">
        <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
          <span className="w-1 h-4 bg-primary rounded-full"></span>
          MENTION VOLUME (1H)
        </h3>
        <div className="flex-1 min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="time" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="volume" 
                stroke="#6366f1" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorVolume)" 
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sentiment Gauge - Takes up 1 col */}
      <div className="glass-panel rounded-xl p-4 flex flex-col">
         <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
          <span className="w-1 h-4 bg-accent rounded-full"></span>
          SENTIMENT ANALYSIS
        </h3>
        <div className="flex-1 min-h-[200px] flex flex-col justify-center">
           <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sentimentData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={60} stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{fill: 'transparent'}}
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #333', borderRadius: '8px' }}
              />
              <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]}>
                {sentimentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          
          <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-2 text-center">
             <div>
                <div className="text-xs text-gray-500">POS</div>
                <div className="text-lg font-bold text-success">65%</div>
             </div>
             <div>
                <div className="text-xs text-gray-500">NEU</div>
                <div className="text-lg font-bold text-gray-400">25%</div>
             </div>
             <div>
                <div className="text-xs text-gray-500">NEG</div>
                <div className="text-lg font-bold text-danger">10%</div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;
