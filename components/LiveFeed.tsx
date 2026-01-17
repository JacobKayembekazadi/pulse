import React from 'react';
import { SocialPost } from '../types';
import { Twitter, Linkedin, Instagram, Share2, Heart, ExternalLink, Globe, Newspaper, Reply, Cloud } from 'lucide-react';

interface LiveFeedProps {
  posts: SocialPost[];
  onReply: (post: SocialPost) => void;
  onViewPost: (post: SocialPost) => void;
}

const PlatformIcon = ({ platform }: { platform: string }) => {
  switch (platform) {
    case 'twitter': return <Twitter className="w-4 h-4 text-blue-400" />;
    case 'bluesky': return <Cloud className="w-4 h-4 text-blue-500" />;
    case 'linkedin': return <Linkedin className="w-4 h-4 text-blue-600" />;
    case 'instagram': return <Instagram className="w-4 h-4 text-pink-500" />;
    case 'reddit': return <div className="w-4 h-4 text-orange-500 font-bold text-[10px] flex items-center justify-center border border-orange-500 rounded-full">r/</div>;
    case 'news': return <Newspaper className="w-4 h-4 text-purple-400" />;
    default: return <Globe className="w-4 h-4 text-gray-400" />;
  }
};

const SentimentIndicator = ({ sentiment }: { sentiment: string }) => {
  const color = sentiment === 'positive' ? 'bg-green-500' 
    : sentiment === 'negative' ? 'bg-red-500' 
    : 'bg-gray-500';
  
  return <div className={`w-1.5 h-1.5 rounded-full ${color} shadow-[0_0_8px_rgba(0,0,0,0.5)]`} />;
};

const LiveFeed: React.FC<LiveFeedProps> = ({ posts, onReply, onViewPost }) => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          Live Feed
        </h2>
        <span className="text-xs text-gray-500 font-mono bg-white/5 px-2 py-1 rounded">
          LIVE: ON
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 scroll-smooth pb-4">
        {posts.map((post) => (
          <div 
            key={post.id}
            onClick={() => onViewPost(post)}
            className="glass-card rounded-xl p-4 animate-slide-up hover:bg-white/5 transition-colors group border-l-2 border-l-transparent hover:border-l-primary flex flex-col gap-3 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={post.avatar} alt={post.author} className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10" />
                  <div className="absolute -bottom-1 -right-1 bg-surface p-0.5 rounded-full">
                    <PlatformIcon platform={post.platform} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm text-white">{post.author}</h3>
                    <SentimentIndicator sentiment={post.sentiment} />
                  </div>
                  <p className="text-xs text-gray-500 truncate max-w-[150px]">{post.handle} • Just now</p>
                </div>
              </div>
              {post.sourceUrl && (
                <a 
                  href={post.sourceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-primary transition-colors"
                  title="View Source"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
            
            <p className="text-sm text-gray-300 leading-relaxed">
              {post.content}
            </p>
            
            <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-white/5 pt-2 mt-1">
              <div className="flex items-center gap-1 group-hover:text-pink-400 transition-colors">
                <Heart className="w-3 h-3" />
                <span>{post.likes > 0 ? post.likes : '-'}</span>
              </div>
              <div className="flex items-center gap-1 group-hover:text-green-400 transition-colors">
                <Share2 className="w-3 h-3" />
                <span>{post.shares > 0 ? post.shares : '-'}</span>
              </div>
              
              <div className="ml-auto flex items-center gap-2">
                 <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onReply(post);
                  }}
                  className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/10 text-primary transition-colors"
                >
                    <Reply className="w-3 h-3" />
                    <span className="font-medium">Reply AI</span>
                 </button>
              </div>
            </div>
          </div>
        ))}
        {posts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 space-y-4">
             <div className="relative w-12 h-12">
                <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-t-2 border-accent rounded-full animate-spin reverse"></div>
             </div>
             <p className="text-sm font-mono">Scanning BlueSky, Reddit & LinkedIn...</p>
             <p className="text-xs text-gray-600 max-w-[200px] text-center">
               Connecting to social feeds via search index.
             </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveFeed;