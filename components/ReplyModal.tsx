
import React, { useState, useEffect } from 'react';
import { SocialPost, SOPItem } from '../types';
import { generateSmartReply } from '../services/geminiService';
import { Bot, Copy, Check, X, RefreshCw, LayoutTemplate, ExternalLink, Send } from 'lucide-react';

interface ReplyModalProps {
  post: SocialPost;
  sops: SOPItem[];
  onClose: () => void;
}

const ReplyModal: React.FC<ReplyModalProps> = ({ post, sops, onClose }) => {
  const [reply, setReply] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Filter only templates from SOPs
  const templates = sops.filter(s => s.type === 'template' && s.isActive);

  const handleGenerate = async () => {
    setIsGenerating(true);
    const generated = await generateSmartReply(post, sops);
    setReply(generated);
    setIsGenerating(false);
  };

  // Generate draft on mount
  useEffect(() => {
    handleGenerate();
  }, []);

  const applyTemplate = (content: string) => {
    // Smart replacement of common placeholders
    let processed = content
      .replace(/{name}|{user}|{author}/gi, `@${post.author}`)
      .replace(/{brand}/gi, "our team"); // Fallback if brand isn't passed, or could pass brand prop
    
    setReply(processed);
  };

  const handleCopyAndOpen = () => {
    navigator.clipboard.writeText(reply);
    setCopied(true);
    
    // If there is a source URL, open it
    if (post.sourceUrl) {
        window.open(post.sourceUrl, '_blank');
    }
    
    // Close modal after a delay
    setTimeout(() => {
        setCopied(false);
        onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        
        {/* LEFT SIDE: Response Area */}
        <div className="flex-1 flex flex-col min-h-[400px]">
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2 text-white font-semibold">
                    <Send className="w-4 h-4 text-primary" />
                    Compose Reply
                </div>
                <div className="md:hidden">
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                {/* Original Post Context */}
                <div className="bg-black/30 p-4 rounded-lg border border-white/5 relative group">
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <a href={post.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline">
                            View Context <ExternalLink className="w-3 h-3" />
                         </a>
                    </div>
                    <div className="text-xs text-gray-500 mb-1 font-mono">IN REPLY TO @{post.author}</div>
                    <p className="text-sm text-gray-300 italic border-l-2 border-white/10 pl-3">"{post.content}"</p>
                </div>

                {/* Editor Area */}
                <div className="relative flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Your Response</span>
                        <button 
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="text-xs flex items-center gap-1 text-primary hover:text-primaryGlow transition-colors disabled:opacity-50"
                        >
                            <Bot className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} /> 
                            {isGenerating ? 'Thinking...' : 'Ask AI to Rewrite'}
                        </button>
                    </div>
                    
                    <textarea 
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        className={`flex-1 w-full min-h-[200px] bg-black/20 border rounded-xl p-4 text-white outline-none text-sm leading-relaxed resize-none transition-colors ${isGenerating ? 'border-primary/50 animate-pulse' : 'border-white/20 focus:border-primary'}`}
                        placeholder="Type your reply here..."
                        disabled={isGenerating}
                    />
                    <div className="text-right mt-2 text-xs text-gray-500">
                        {reply.length} chars
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-white/10 bg-white/5 flex justify-between items-center gap-3">
                <button 
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleCopyAndOpen}
                    disabled={isGenerating || !reply}
                    className="px-6 py-2 bg-primary hover:bg-primaryGlow text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-primary/20"
                >
                    {copied ? <Check className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                    {copied ? "Copied!" : post.sourceUrl ? "Copy & Open Source" : "Copy to Clipboard"}
                </button>
            </div>
        </div>

        {/* RIGHT SIDE: Templates Sidebar */}
        <div className="w-full md:w-72 border-l border-white/10 bg-surfaceHighlight/30 flex flex-col h-[200px] md:h-auto">
             <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <LayoutTemplate className="w-4 h-4 text-accent" />
                    Quick Templates
                </h3>
                <div className="hidden md:block">
                     <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                </div>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {templates.length === 0 ? (
                    <div className="text-xs text-gray-500 text-center py-4">
                        No templates found. Add "Template" type items in the SOP Manager.
                    </div>
                ) : (
                    templates.map(t => (
                        <button
                            key={t.id}
                            onClick={() => applyTemplate(t.content)}
                            className="w-full text-left group p-3 rounded-lg border border-white/5 hover:border-primary/30 bg-white/5 hover:bg-white/10 transition-all"
                        >
                            <div className="text-xs font-bold text-gray-300 group-hover:text-primary mb-1">{t.title}</div>
                            <div className="text-[10px] text-gray-500 line-clamp-2 group-hover:text-gray-400">
                                {t.content}
                            </div>
                        </button>
                    ))
                )}
             </div>
             
             <div className="p-4 border-t border-white/10 text-[10px] text-gray-500 text-center">
                Tip: Use <span className="text-gray-400">{`{name}`}</span> in templates to auto-insert username.
             </div>
        </div>

      </div>
    </div>
  );
};

export default ReplyModal;
