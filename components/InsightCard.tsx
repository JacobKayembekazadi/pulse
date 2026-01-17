import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCcw, Zap } from 'lucide-react';
import { fetchStrategicInsight, generateStrategicPlan } from '../services/geminiService';
import { SocialPost } from '../types';
import ActionPlanModal from './ActionPlanModal';

interface InsightCardProps {
  brand: string;
  posts?: SocialPost[];
}

const InsightCard: React.FC<InsightCardProps> = ({ brand, posts = [] }) => {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  
  // Plan Generation State
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [actionPlan, setActionPlan] = useState<string | null>(null);

  const generateInsight = async () => {
    if (!brand) return;
    setLoading(true);
    
    if (posts.length > 0) {
      // Use real AI analysis if we have posts
      const aiResult = await fetchStrategicInsight(brand, posts.slice(0, 10));
      setInsight(aiResult);
      setLoading(false);
    } else {
      // Fallback simulation if no posts yet
      setTimeout(() => {
        const insights = [
          `Engagement for **${brand}** is rising. Sentiment analysis suggests a positive reception to recent updates. Recommend capitalizing on this momentum.`,
          `Detected scattered conversations about **${brand}**. A consistent content strategy is needed to unify the narrative across platforms.`,
          `**${brand}** is seeing steady growth. Monitoring suggests a 15% increase in brand awareness week-over-week.`,
        ];
        setInsight(insights[Math.floor(Math.random() * insights.length)]);
        setLoading(false);
      }, 1500);
    }
  };

  const handleGeneratePlan = async () => {
    if (!brand || posts.length === 0) return;
    setGeneratingPlan(true);
    const plan = await generateStrategicPlan(brand, posts);
    setActionPlan(plan);
    setGeneratingPlan(false);
  };

  useEffect(() => {
    // Generate on mount or when posts change significantly (throttled ideally, but simplified here)
    if (posts.length > 0 && !insight) {
      generateInsight();
    }
  }, [brand, posts.length]);

  return (
    <>
      <div className="glass-panel rounded-xl p-6 relative overflow-hidden group">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-colors"></div>
        
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent animate-pulse" />
            <h3 className="font-semibold text-white">AI Strategic Insight</h3>
          </div>
          <button 
            onClick={generateInsight} 
            disabled={loading}
            className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
          >
            <RefreshCcw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="relative z-10 min-h-[80px]">
          {loading ? (
            <div className="space-y-2 animate-pulse">
               <div className="h-3 bg-white/10 rounded w-3/4"></div>
               <div className="h-3 bg-white/10 rounded w-full"></div>
               <div className="h-3 bg-white/10 rounded w-5/6"></div>
            </div>
          ) : (
            <div className="prose prose-invert text-sm text-gray-300">
              <p className="leading-relaxed">
                {insight ? (
                  insight.split("**").map((part, i) => 
                    i % 2 === 1 ? <span key={i} className="text-primary font-semibold">{part}</span> : part
                  )
                ) : (
                  <span className="text-gray-500 italic">Gathering sufficient data for analysis...</span>
                )}
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-white/5 flex gap-3">
          <button 
            onClick={handleGeneratePlan}
            disabled={generatingPlan || posts.length === 0}
            className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded text-xs font-medium text-white transition-colors border border-white/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
          >
            <Zap className={`w-3 h-3 text-yellow-400 ${generatingPlan ? 'animate-pulse' : 'group-hover/btn:scale-110 transition-transform'}`} />
            {generatingPlan ? "Strategizing..." : "Generate Action Plan"}
          </button>
        </div>
      </div>

      {actionPlan && (
        <ActionPlanModal 
            plan={actionPlan} 
            onClose={() => setActionPlan(null)} 
        />
      )}
    </>
  );
};

export default InsightCard;