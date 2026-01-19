// ============================================================================
// REPLY MODAL - AI-powered reply generation with copy-to-clipboard
// Core workflow: See post → Generate reply → Copy → Paste on platform
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { SocialPost } from '../../types';
import { aiService } from '../../services/ai.service';
import { useContentStore } from '../../store';

interface ReplyModalProps {
  post: SocialPost;
  onClose: () => void;
}

type ToneOption = 'professional' | 'friendly' | 'curious' | 'helpful' | 'witty';

const TONE_OPTIONS: { value: ToneOption; label: string; description: string }[] = [
  { value: 'professional', label: 'Professional', description: 'Formal and business-appropriate' },
  { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
  { value: 'curious', label: 'Curious', description: 'Ask thoughtful questions' },
  { value: 'helpful', label: 'Helpful', description: 'Offer value and insights' },
  { value: 'witty', label: 'Witty', description: 'Clever with personality' },
];

export function ReplyModal({ post, onClose }: ReplyModalProps) {
  const { sops, templates } = useContentStore();
  const [reply, setReply] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTone, setSelectedTone] = useState<ToneOption>('helpful');
  const [selectedSOP, setSelectedSOP] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate reply on mount
  useEffect(() => {
    generateReply();
  }, []);

  const generateReply = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const sop = selectedSOP ? sops.find(s => s.id === selectedSOP) : undefined;

      const generatedReply = await aiService.generateSimpleComment({
        post,
        tone: selectedTone,
        sop,
        maxLength: 280, // Keep it concise for social
      });

      setReply(generatedReply);
    } catch (err) {
      console.error('Failed to generate reply:', err);
      setError('Failed to generate reply. Check your API key in Settings.');
      // Provide a fallback template
      setReply(getFallbackReply(post, selectedTone));
    } finally {
      setIsGenerating(false);
    }
  };

  const getFallbackReply = (post: SocialPost, tone: ToneOption): string => {
    const templates: Record<ToneOption, string> = {
      professional: `Great insights on this topic. I've seen similar patterns in my work - would love to connect and discuss further.`,
      friendly: `Love this! 🙌 Really resonates with what I've been seeing lately. Thanks for sharing!`,
      curious: `Interesting perspective! What's been your biggest learning from this approach? Would love to hear more.`,
      helpful: `This is valuable. One thing that's worked well for us: [add your insight]. Happy to share more if helpful!`,
      witty: `This hits different. Saving this for my "things I wish I knew earlier" collection 📌`,
    };
    return templates[tone];
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(reply);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const openOriginalPost = () => {
    if (post.url) {
      window.open(post.url, '_blank', 'noopener,noreferrer');
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'linkedin': return 'text-blue-500';
      case 'twitter': return 'text-sky-400';
      case 'reddit': return 'text-orange-500';
      default: return 'text-gray-400';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin': return Icons.LinkedIn;
      case 'twitter': return Icons.Twitter;
      case 'reddit': return Icons.Reddit;
      default: return Icons.Globe;
    }
  };

  const PlatformIcon = getPlatformIcon(post.platform);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[600px] max-h-[80vh] overflow-y-auto glass-panel rounded-2xl border border-primary/20 shadow-[0_0_50px_rgba(99,102,241,0.2)] z-50">
        {/* Header */}
        <div className="sticky top-0 glass-panel border-b border-white/10 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)]">
              <Icons.Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-white">AI Reply Generator</h2>
              <p className="text-xs text-gray-400">Generate, edit, and copy to {post.platform}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Icons.X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Original Post Preview */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-start gap-3">
            <img
              src={post.author.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${post.author.name}`}
              alt={post.author.name}
              className="w-10 h-10 rounded-full ring-2 ring-white/10"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{post.author.name}</span>
                <PlatformIcon className={`w-4 h-4 ${getPlatformColor(post.platform)}`} />
              </div>
              <p className="text-sm text-gray-300 line-clamp-3">{post.content}</p>
              {post.url && (
                <button
                  onClick={openOriginalPost}
                  className="mt-2 text-xs text-primary hover:text-accent transition-colors flex items-center gap-1"
                >
                  <Icons.ExternalLink className="w-3 h-3" />
                  Open original post
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tone Selection */}
        <div className="p-4 border-b border-white/10">
          <label className="text-sm font-medium text-gray-400 mb-3 block">Tone</label>
          <div className="flex flex-wrap gap-2">
            {TONE_OPTIONS.map(option => (
              <button
                key={option.value}
                onClick={() => {
                  setSelectedTone(option.value);
                }}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  selectedTone === option.value
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* SOP Selection (if available) */}
          {sops.length > 0 && (
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-400 mb-2 block">Apply SOP (optional)</label>
              <select
                value={selectedSOP || ''}
                onChange={(e) => setSelectedSOP(e.target.value || null)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
              >
                <option value="">No SOP</option>
                {sops.map(sop => (
                  <option key={sop.id} value={sop.id}>{sop.name}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={generateReply}
            disabled={isGenerating}
            className="mt-4 w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Icons.RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'Regenerate'}
          </button>
        </div>

        {/* Generated Reply */}
        <div className="p-4">
          <label className="text-sm font-medium text-gray-400 mb-2 block">Your Reply</label>

          {error && (
            <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}

          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder={isGenerating ? 'Generating reply...' : 'Your reply will appear here...'}
            className="w-full h-32 bg-white/5 border border-white/10 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-primary/50 transition-colors"
            disabled={isGenerating}
          />

          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>{reply.length} characters</span>
            {reply.length > 280 && (
              <span className="text-yellow-400">Consider shortening for better engagement</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-white/10 flex gap-3">
          <button
            onClick={copyToClipboard}
            disabled={!reply || isGenerating}
            className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              copied
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-gradient-to-r from-primary to-accent text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] hover:scale-[1.02]'
            } disabled:opacity-50 disabled:hover:scale-100`}
          >
            {copied ? (
              <>
                <Icons.Check className="w-5 h-5" />
                Copied!
              </>
            ) : (
              <>
                <Icons.Copy className="w-5 h-5" />
                Copy to Clipboard
              </>
            )}
          </button>

          {post.url && (
            <button
              onClick={() => {
                copyToClipboard();
                setTimeout(openOriginalPost, 300);
              }}
              disabled={!reply || isGenerating}
              className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Icons.ExternalLink className="w-5 h-5" />
              Copy & Open
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default ReplyModal;
