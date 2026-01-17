import React, { useState } from 'react';
import { Search, Sparkles, Activity, Cloud, Hash, Calendar, Clock, Linkedin } from 'lucide-react';
import { TimeFrame } from '../types';

interface BrandInputProps {
  onStart: (brand: string, keywords: string, timeframe: TimeFrame) => void;
}

const BrandInput: React.FC<BrandInputProps> = ({ onStart }) => {
  const [brand, setBrand] = useState('');
  const [keywords, setKeywords] = useState('');
  const [timeframe, setTimeframe] = useState<TimeFrame>('live');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (brand.trim()) {
      onStart(brand.trim(), keywords.trim(), timeframe);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background z-0"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/20 rounded-full blur-[100px] animate-float"></div>

      <div className="relative z-10 w-full max-w-2xl px-6">
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-primaryGlow mb-4">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${timeframe === 'live' ? 'bg-green-400' : 'bg-blue-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${timeframe === 'live' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
            </span>
            SYSTEM ONLINE
          </div>
          <h1 className="text-6xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50">
            PULSE
          </h1>
          <p className="text-xl text-gray-400 font-light">
            Listen to the heartbeat of your brand. <br/>
            <span className="text-primaryGlow">BlueSky</span>, Reddit, LinkedIn & Web Monitoring.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative space-y-4">
          
          {/* Main Brand Input */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center glass-panel rounded-xl p-2">
              <div className="pl-4 pr-2 text-gray-400">
                <Search className="w-6 h-6" />
              </div>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Enter brand name (e.g., 'Nike', 'Vercel')..."
                className="flex-1 bg-transparent border-none outline-none text-lg text-white placeholder-gray-600 h-12 px-2"
                autoFocus
              />
            </div>
          </div>

          <div className="flex gap-4">
            {/* Keywords Input */}
            <div className="flex-1 relative flex items-center glass-panel rounded-xl p-2 border border-white/5 bg-black/20">
               <div className="pl-4 pr-2 text-gray-500">
                  <Hash className="w-4 h-4" />
               </div>
               <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="Keywords (e.g., 'shoes')..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-gray-300 placeholder-gray-600 h-10 px-2"
                />
            </div>

            {/* Timeframe Selector */}
            <div className="relative flex items-center glass-panel rounded-xl p-2 border border-white/5 bg-black/20 w-48">
               <div className="pl-3 pr-2 text-gray-500">
                  {timeframe === 'live' ? <Clock className="w-4 h-4 text-green-500" /> : <Calendar className="w-4 h-4 text-blue-500" />}
               </div>
               <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value as TimeFrame)}
                  className="flex-1 bg-transparent border-none outline-none text-sm text-gray-300 h-10 px-2 appearance-none cursor-pointer"
               >
                  <option value="live" className="bg-surface text-white">Live Feed (Now)</option>
                  <option value="24h" className="bg-surface text-white">Past 24 Hours</option>
                  <option value="7d" className="bg-surface text-white">Past 7 Days</option>
                  <option value="30d" className="bg-surface text-white">Past Month</option>
                  <option value="1y" className="bg-surface text-white">Past Year</option>
               </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={!brand}
            className="w-full bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-white/10"
          >
            <Activity className="w-4 h-4" />
            {timeframe === 'live' ? 'Initialize Live Command' : 'Analyze Historical Data'}
          </button>
        </form>

        <div className="mt-8 flex justify-center gap-8 text-gray-500 text-sm font-mono">
          <div className="flex items-center gap-2">
             <Cloud className="w-4 h-4 text-blue-400" /> BLUESKY READY
          </div>
          <div className="flex items-center gap-2">
             <Linkedin className="w-4 h-4 text-blue-600" /> LINKEDIN
          </div>
          <div className="flex items-center gap-2">
             <Sparkles className="w-4 h-4 text-accent" /> GEMINI AI
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandInput;