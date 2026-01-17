import React from 'react';
import { SocialPost } from '../types';
import { X, ExternalLink, Calendar, Heart, Share2, Twitter, Linkedin, Instagram, Cloud, Globe, Newspaper } from 'lucide-react';

interface PostDetailsModalProps {
  post: SocialPost;
  onClose: () => void;
}

const PlatformIcon = ({ platform }: { platform: string }) => {
  switch (platform) {
    case 'twitter': return <Twitter className="w-5 h-5 text-blue-400" />;
    case 'bluesky': return <Cloud className="w-5 h-5 text-blue-500" />;
    case 'linkedin': return <Linkedin className="w-5 h-5 text-blue-600" />;
    case 'instagram': return <Instagram className="w-5 h-5 text-pink-500" />;
    case 'reddit': return <div className="w-5 h-5 text-orange-500 font-bold text-xs flex items-center justify-center border border-orange-500 rounded-full">r/</div>;
    case 'news': return <Newspaper className="w-5 h-5 text-purple-400" />;
    default: return <Globe className="w-5 h-5 text-gray-400" />;
  }
};

const PostDetailsModal: React.FC<PostDetailsModalProps> = ({ post, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="w-full max-w-2xl bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-start">
          <div className="flex items-center gap-4">
             <div className="relative">
                <img src={post.avatar} alt={post.author} className="w-14 h-14 rounded-full object-cover ring-2 ring-white/10" />
                <div className="absolute -bottom-1 -right-1 bg-[#18181b] p-1.5 rounded-full border border-white/10 shadow-lg">
                   <PlatformIcon platform={post.platform} />
                </div>
             </div>
             <div>
                <h2 className="text-xl font-bold text-white">{post.author}</h2>
                <div className="flex items-center gap-2 text-sm text-gray-400 mt-0.5">
                   <span>{post.handle}</span>
                   <span>•</span>
                   <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                      post.sentiment === 'positive' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                      post.sentiment === 'negative' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                   }`}>
                      {post.sentiment}
                   </span>
                </div>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors group">
            <X className="w-5 h-5 text-gray-400 group-hover:text-white" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar">
           <div className="prose prose-invert max-w-none">
             <p className="text-lg text-gray-200 leading-relaxed whitespace-pre-wrap font-light">
               {post.content}
             </p>
           </div>
           
           <div className="mt-8 flex flex-wrap gap-6 text-sm text-gray-500 font-mono border-t border-white/5 pt-6">
              <div className="flex items-center gap-2" title="Time posted">
                 <Calendar className="w-4 h-4" />
                 {new Date(post.timestamp).toLocaleString()}
              </div>
              <div className="flex items-center gap-2" title="Likes">
                 <Heart className="w-4 h-4 text-pink-500/70" />
                 {post.likes} <span className="hidden sm:inline">Likes</span>
              </div>
              <div className="flex items-center gap-2" title="Shares">
                 <Share2 className="w-4 h-4 text-blue-500/70" />
                 {post.shares} <span className="hidden sm:inline">Shares</span>
              </div>
           </div>
        </div>

        <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            Close
          </button>
          {post.sourceUrl && (
            <a 
              href={post.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary hover:text-primaryGlow border border-primary/20 rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-lg shadow-primary/5"
            >
              <ExternalLink className="w-4 h-4" />
              View Source
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostDetailsModal;