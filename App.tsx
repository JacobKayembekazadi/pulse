import React, { useState, useEffect, useCallback } from 'react';
import BrandInput from './components/BrandInput';
import LiveFeed from './components/LiveFeed';
import AnalyticsPanel from './components/AnalyticsPanel';
import InsightCard from './components/InsightCard';
import SOPManager from './components/SOPManager';
import ReplyModal from './components/ReplyModal';
import PostDetailsModal from './components/PostDetailsModal';
import { SocialPost, AnalyticsData, SOPItem, TimeFrame } from './types';
import { generateMockAnalytics } from './services/mockService'; 
import { fetchRealBrandMentions } from './services/geminiService';
import { Activity, Radio, Bell, Zap, Globe, Wifi, FileText, Settings, AlertTriangle, Hash, Calendar, History } from 'lucide-react';

function App() {
  const [brand, setBrand] = useState<string | null>(null);
  const [searchKeywords, setSearchKeywords] = useState<string>('');
  const [timeframe, setTimeframe] = useState<TimeFrame>('live');
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // SOP State
  const [sops, setSops] = useState<SOPItem[]>([
    { id: '1', title: 'Default Professional Tone', content: 'Maintain a helpful, professional, yet conversational tone. Avoid corporate jargon.', type: 'tone', isActive: true },
    { id: '2', title: 'Crisis Escalation', content: 'If the user is reporting a severe bug or outage, do not make jokes. Apologize sincerely and ask them to DM for support.', type: 'rule', isActive: true }
  ]);
  const [showSOPManager, setShowSOPManager] = useState(false);
  
  // Reply State
  const [replyPost, setReplyPost] = useState<SocialPost | null>(null);

  // View Post Details State
  const [viewPost, setViewPost] = useState<SocialPost | null>(null);

  // Function to clean brand name input (remove URL parts if pasted)
  const cleanBrandName = (input: string) => {
    try {
      if (input.includes('.')) {
        const url = new URL(input.startsWith('http') ? input : `https://${input}`);
        return url.hostname.replace('www.', '');
      }
    } catch (e) {
      // ignore
    }
    return input.replace('@', '');
  };

  const fetchData = useCallback(async (brandName: string, keywords: string, tf: TimeFrame) => {
    console.log("Fetching data for:", brandName, "Keywords:", keywords, "Timeframe:", tf);
    setError(null);
    try {
      const realPosts = await fetchRealBrandMentions(brandName, keywords, tf);
      if (realPosts && realPosts.length > 0) {
        setPosts(prev => {
          // If viewing history (not live), typically we replace the set rather than append stream
          if (tf !== 'live') return realPosts;
          
          // Basic deduplication by ID or Content for live stream
          const newPosts = realPosts.filter(rp => !prev.some(p => p.content === rp.content));
          if (newPosts.length === 0) return prev;
          return [...newPosts, ...prev].slice(0, 50);
        });
        return true;
      }
    } catch (e: any) {
      console.error("Error fetching data", e);
      if (e.message === "RATE_LIMIT") {
        setError("API Quota Exceeded. Polling paused. Please wait a moment.");
        setIsLive(false); // Stop polling
      }
    }
    return false;
  }, []);

  const handleStart = async (rawBrand: string, rawKeywords: string, tf: TimeFrame) => {
    const brandName = cleanBrandName(rawBrand);
    setBrand(brandName);
    setSearchKeywords(rawKeywords);
    setTimeframe(tf);
    setIsLoading(true);
    setError(null);
    
    // Clear previous state
    setPosts([]);
    setAnalytics(generateMockAnalytics()); 
    
    // Initial Fetch
    await fetchData(brandName, rawKeywords, tf);
    
    setIsLoading(false);
    
    // Only go "Live" (polling) if timeframe is 'live'
    if (tf === 'live') {
      setIsLive(true);
    } else {
      setIsLive(false); // Historical mode is static
    }
  };

  const handleDisconnect = () => {
    setBrand(null);
    setSearchKeywords('');
    setIsLive(false);
    setPosts([]);
    setError(null);
    setTimeframe('live');
  };

  // SOP Handlers
  const handleAddSOP = (item: SOPItem) => setSops([...sops, item]);
  const handleDeleteSOP = (id: string) => setSops(sops.filter(s => s.id !== id));
  const handleToggleSOP = (id: string) => setSops(sops.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));

  // Real Polling Effect - Only active if isLive is true AND timeframe is 'live'
  useEffect(() => {
    if (!isLive || !brand || timeframe !== 'live') return;

    const intervalId = setInterval(() => {
      fetchData(brand, searchKeywords, timeframe);
      
      // Update analytics graph slightly to show "activity" is being monitored
      setAnalytics(prev => {
        const newData = [...prev.slice(1)];
        const baseVol = posts.length > 0 ? 50 : 10; 
        const newVolume = Math.max(5, Math.min(100, baseVol + (Math.random() * 20 - 10)));
        
        newData.push({
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          volume: Math.round(newVolume),
          sentimentScore: 0
        });
        return newData;
      });

    }, 60000); // 60s polling for live mode

    return () => clearInterval(intervalId);
  }, [isLive, brand, searchKeywords, timeframe, fetchData, posts.length]);

  if (!brand) {
    return <BrandInput onStart={handleStart} />;
  }

  return (
    <div className="min-h-screen bg-background text-white font-sans selection:bg-primary/30 relative">
      
      {/* Modals */}
      {showSOPManager && (
        <SOPManager 
          sops={sops} 
          onAdd={handleAddSOP} 
          onDelete={handleDeleteSOP} 
          onToggle={handleToggleSOP} 
          onClose={() => setShowSOPManager(false)} 
        />
      )}

      {replyPost && (
        <ReplyModal 
          post={replyPost}
          sops={sops}
          onClose={() => setReplyPost(null)}
        />
      )}

      {viewPost && (
        <PostDetailsModal 
          post={viewPost} 
          onClose={() => setViewPost(null)} 
        />
      )}

      {/* Error Banner */}
      {error && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-500/90 text-white px-6 py-3 rounded-full shadow-xl backdrop-blur-md flex items-center gap-3 animate-slide-up">
           <AlertTriangle className="w-5 h-5" />
           <span className="font-medium">{error}</span>
           <button onClick={() => setIsLive(true)} className="ml-4 text-xs underline hover:text-red-100">Retry</button>
        </div>
      )}

      {/* Navbar */}
      <nav className="h-16 border-b border-white/10 bg-background/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
            PULSE
          </div>
          <div className="h-6 w-[1px] bg-white/20 mx-2"></div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10 transition-all hover:bg-white/10">
            <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-500' : error ? 'bg-red-500' : timeframe === 'live' ? 'bg-success shadow-[0_0_10px_#10b981]' : 'bg-blue-500'}`}></div>
            <span className="text-sm font-mono text-gray-300">
              Target: <span className="text-white font-bold">{brand}</span>
            </span>
          </div>
          {searchKeywords && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
              <Hash className="w-3 h-3 text-accent" />
              <span className="text-xs font-mono text-gray-300">
                "{searchKeywords}"
              </span>
            </div>
          )}
          {timeframe !== 'live' && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-full border border-blue-500/20">
              <Calendar className="w-3 h-3 text-blue-400" />
              <span className="text-xs font-mono text-blue-200 uppercase">
                {timeframe === '24h' ? 'Past 24H' : timeframe === '7d' ? 'Past 7 Days' : timeframe === '30d' ? 'Past Month' : 'Past Year'}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4 text-xs text-gray-500 font-mono border-r border-white/10 pr-4">
             <span className="flex items-center gap-1">
                {timeframe === 'live' ? (
                  <><Wifi className={`w-3 h-3 ${isLive ? 'text-green-500' : 'text-gray-500'}`} /> {isLive ? 'ONLINE' : 'PAUSED'}</>
                ) : (
                  <><History className="w-3 h-3 text-blue-500" /> HISTORICAL VIEW</>
                )}
             </span>
             <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> GLOBAL SEARCH</span>
          </div>
          
          {/* SOP Manager Button */}
          <button 
            onClick={() => setShowSOPManager(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors text-xs font-medium text-gray-300 hover:text-white"
          >
            <FileText className="w-4 h-4" />
            SOPs & Templates
            <span className="bg-primary/20 text-primary px-1.5 rounded text-[10px]">{sops.filter(s => s.isActive).length}</span>
          </button>

          <button className="p-2 hover:bg-white/10 rounded-full transition-colors relative">
            <Bell className="w-5 h-5 text-gray-400" />
            {posts.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full animate-pulse"></span>}
          </button>
           <button 
             onClick={handleDisconnect}
             className="px-4 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 border border-red-500/20 rounded-lg transition-colors uppercase tracking-wider"
           >
             Disconnect
           </button>
        </div>
      </nav>

      <main className="p-6 max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Analytics & AI (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Top Row Analytics */}
          <div className="h-[320px]">
             <AnalyticsPanel data={analytics} />
          </div>

          {/* Bottom Row AI & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <InsightCard brand={brand} posts={posts} />
             
             {/* Quick Stats Grid */}
             <div className="glass-panel rounded-xl p-6 grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-lg border border-white/5 flex flex-col justify-center items-center group hover:bg-white/10 transition-colors">
                  <Activity className="w-6 h-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-2xl font-bold text-white">
                    {posts.length > 0 ? (timeframe === 'live' ? "High" : "Static") : "Low"}
                  </div>
                  <div className="text-xs text-gray-400">Signal Strength</div>
                </div>
                <div className="p-4 bg-white/5 rounded-lg border border-white/5 flex flex-col justify-center items-center group hover:bg-white/10 transition-colors">
                  <Radio className="w-6 h-6 text-accent mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-2xl font-bold text-white">{posts.length}</div>
                  <div className="text-xs text-gray-400">{timeframe === 'live' ? 'Active Sources' : 'Historical Records'}</div>
                </div>
                <div className="col-span-2 p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-white/10 flex items-center justify-between relative overflow-hidden">
                  <div className="relative z-10 w-full">
                    <div className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
                      {timeframe === 'live' ? <Zap className="w-3 h-3 text-yellow-400" /> : <History className="w-3 h-3 text-blue-400" />}
                      {timeframe === 'live' ? (isLive ? "Live Tracking Active" : "Tracking Paused") : "Historical Analysis Mode"}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {error ? "Connection limit reached." : posts.length > 0 
                        ? (timeframe === 'live' ? "Data stream established from Google Search index." : `Showing data from: ${timeframe}`)
                        : "Scanning news and social indices for matches..."}
                    </div>
                  </div>
                </div>
             </div>
          </div>
        </div>

        {/* Right Column: Live Feed (4 cols) */}
        <div className="lg:col-span-4 h-[calc(100vh-8rem)] sticky top-24">
          <div className="h-full glass-panel rounded-xl border border-primary/20 shadow-[0_0_50px_-12px_rgba(99,102,241,0.2)] overflow-hidden flex flex-col">
             <LiveFeed 
               posts={posts} 
               onReply={setReplyPost} 
               onViewPost={setViewPost}
             />
          </div>
        </div>

      </main>
    </div>
  );
}

export default App;