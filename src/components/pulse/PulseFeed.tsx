// ============================================================================
// PULSE FEED - Social Monitoring & Engagement
// ============================================================================

import React, { useState, useCallback } from 'react';
import { usePulseStore, useContentStore } from '../../store';
import { searchService } from '../../services/search.service';
import { aiService } from '../../services/ai.service';
import { contentService } from '../../services/content.service';
import { Icons } from '../shared/Icons';
import { toast } from '../shared/Toast';
import { SocialPost, Platform, TimeFrame, SOP } from '../../types';

const PLATFORMS: { id: Platform; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'linkedin', label: 'LinkedIn', icon: Icons.LinkedIn },
  { id: 'twitter', label: 'Twitter/X', icon: Icons.Twitter },
  { id: 'reddit', label: 'Reddit', icon: Icons.Reddit },
];

const TIMEFRAMES: { id: TimeFrame; label: string }[] = [
  { id: 'live', label: 'Live' },
  { id: '24h', label: '24h' },
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
];

export function PulseFeed() {
  const {
    keywords, addKeyword, removeKeyword,
    platforms, togglePlatform,
    timeframe, setTimeframe,
    posts, setPosts, addPosts,
    isLive, setIsLive,
    isSearching, setIsSearching,
    selectedPost, setSelectedPost
  } = usePulseStore();

  const { sops, setSOPs } = useContentStore();

  const [keywordInput, setKeywordInput] = useState('');
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [generatedComments, setGeneratedComments] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load SOPs on mount
  React.useEffect(() => {
    contentService.getSOPs(undefined, true).then(setSOPs);
  }, [setSOPs]);

  const handleSearch = useCallback(async () => {
    if (keywords.length === 0) return;

    setIsSearching(true);
    try {
      const results = await searchService.search({
        keywords,
        platforms,
        timeframe,
        maxResults: 20
      });
      setPosts(results);
      if (results.length === 0) {
        toast.info('No results found', 'Try different keywords or expand your search filters');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed', 'Please check your API configuration in Settings');
    } finally {
      setIsSearching(false);
    }
  }, [keywords, platforms, timeframe, setPosts, setIsSearching]);

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (keywordInput.trim()) {
      addKeyword(keywordInput.trim());
      setKeywordInput('');
    }
  };

  const handleGenerateComment = async (post: SocialPost) => {
    setGeneratingFor(post.id);
    try {
      const result = await aiService.generateComment({
        post,
        sops: sops as SOP[],
        tone: 'professional'
      });
      setGeneratedComments(prev => ({ ...prev, [post.id]: result.content }));
    } catch (error) {
      console.error('Error generating comment:', error);
      toast.error('AI generation failed', 'Please configure your AI API key in Settings');
    } finally {
      setGeneratingFor(null);
    }
  };

  const handleCopy = (postId: string) => {
    const comment = generatedComments[postId];
    if (comment) {
      navigator.clipboard.writeText(comment);
      setCopiedId(postId);
      toast.success('Copied!', 'Comment copied to clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getPlatformIcon = (platform: Platform) => {
    switch (platform) {
      case 'linkedin': return <Icons.LinkedIn className="w-4 h-4" />;
      case 'twitter': return <Icons.Twitter className="w-4 h-4" />;
      case 'reddit': return <Icons.Reddit className="w-4 h-4" />;
      default: return <Icons.Globe className="w-4 h-4" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-400';
      case 'negative': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Controls */}
      <div className="bg-[#111113] border border-white/10 rounded-xl p-5">
        {/* Keywords */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Keywords</label>
          <form onSubmit={handleAddKeyword} className="flex gap-2">
            <input
              type="text"
              value={keywordInput}
              onChange={e => setKeywordInput(e.target.value)}
              placeholder="Add keyword (e.g., ABM, B2B marketing)..."
              className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Icons.Plus className="w-4 h-4" />
            </button>
          </form>

          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {keywords.map(keyword => (
                <span
                  key={keyword}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-sm"
                >
                  <Icons.Hash className="w-3 h-3" />
                  {keyword}
                  <button
                    onClick={() => removeKeyword(keyword)}
                    className="hover:text-blue-200 transition-colors"
                  >
                    <Icons.X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Platforms & Timeframe */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Platforms */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Platforms:</span>
            {PLATFORMS.map(platform => {
              const Icon = platform.icon;
              const isActive = platforms.includes(platform.id);
              return (
                <button
                  key={platform.id}
                  onClick={() => togglePlatform(platform.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'bg-transparent text-gray-400 hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {platform.label}
                </button>
              );
            })}
          </div>

          <div className="h-6 w-px bg-white/10" />

          {/* Timeframe */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Timeframe:</span>
            <div className="flex bg-white/5 rounded-lg p-1">
              {TIMEFRAMES.map(tf => (
                <button
                  key={tf.id}
                  onClick={() => setTimeframe(tf.id)}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    timeframe === tf.id
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1" />

          {/* Search Button */}
          <button
            onClick={handleSearch}
            disabled={keywords.length === 0 || isSearching}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all"
          >
            {isSearching ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Icons.Search className="w-4 h-4" />
                Search
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="bg-[#111113] border border-white/10 rounded-xl p-12 text-center">
            <Icons.Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No posts yet</h3>
            <p className="text-gray-400 text-sm">
              Add keywords and click Search to find relevant social posts
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">{posts.length} posts found</p>
              <button
                onClick={() => posts.forEach(p => handleGenerateComment(p))}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-sm font-medium rounded-lg transition-colors"
              >
                <Icons.Sparkles className="w-4 h-4" />
                Generate All Comments
              </button>
            </div>

            {posts.map(post => (
              <div
                key={post.id}
                className="bg-[#111113] border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors"
              >
                <div className="flex gap-4">
                  {/* Author Avatar */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-medium text-white flex-shrink-0 ${
                      post.platform === 'linkedin' ? 'bg-[#0077b5]' :
                      post.platform === 'twitter' ? 'bg-[#1da1f2]' :
                      post.platform === 'reddit' ? 'bg-[#ff4500]' : 'bg-gray-600'
                    }`}
                  >
                    {post.author.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{post.author.name}</span>
                      <span className="text-gray-400">·</span>
                      <span className="text-sm text-gray-400">{post.author.title}</span>
                      <span className={post.platform === 'linkedin' ? 'text-[#0077b5]' : 'text-[#1da1f2]'}>
                        {getPlatformIcon(post.platform)}
                      </span>
                    </div>

                    <p className="text-gray-200 leading-relaxed mb-3">{post.content}</p>

                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>{post.engagement.likes} likes</span>
                      <span>{post.engagement.comments} comments</span>
                      <span>{post.engagement.shares} shares</span>
                      <span className={getSentimentColor(post.sentiment)}>{post.sentiment}</span>
                      <span>{formatTimeAgo(post.postedAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end gap-2">
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                      {post.relevanceScore}% match
                    </span>

                    {!generatedComments[post.id] ? (
                      <button
                        onClick={() => handleGenerateComment(post)}
                        disabled={generatingFor === post.id}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
                      >
                        {generatingFor === post.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Icons.Sparkles className="w-4 h-4" />
                            Generate Comment
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedPost(post)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm rounded-lg transition-colors"
                      >
                        <Icons.MessageSquare className="w-4 h-4" />
                        View Draft
                      </button>
                    )}
                  </div>
                </div>

                {/* Generated Comment Preview */}
                {generatedComments[post.id] && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="bg-black/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Generated Comment</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCopy(post.id)}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded text-sm transition-colors ${
                              copiedId === post.id
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-white/10 hover:bg-white/20 text-white'
                            }`}
                          >
                            {copiedId === post.id ? <Icons.Check className="w-3 h-3" /> : <Icons.Copy className="w-3 h-3" />}
                            {copiedId === post.id ? 'Copied!' : 'Copy'}
                          </button>
                          <a
                            href={post.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors"
                          >
                            <Icons.ExternalLink className="w-3 h-3" />
                            Open Post
                          </a>
                        </div>
                      </div>
                      <p className="text-sm text-gray-200">{generatedComments[post.id]}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Post Detail Modal */}
      {selectedPost && generatedComments[selectedPost.id] && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="bg-[#111113] border border-white/10 rounded-2xl w-full max-w-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Draft Comment</h3>
              <button
                onClick={() => setSelectedPost(null)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Icons.X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-5">
              {/* Original Post */}
              <div className="bg-black/30 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                    selectedPost.platform === 'linkedin' ? 'bg-[#0077b5]' : 'bg-[#1da1f2]'
                  }`}>
                    {selectedPost.author.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <span className="font-medium text-sm">{selectedPost.author.name}</span>
                </div>
                <p className="text-sm text-gray-400 line-clamp-3">{selectedPost.content}</p>
              </div>

              {/* Editable Comment */}
              <label className="block text-sm text-gray-400 mb-2">AI-Generated Comment</label>
              <textarea
                value={generatedComments[selectedPost.id]}
                onChange={e => setGeneratedComments(prev => ({ ...prev, [selectedPost.id]: e.target.value }))}
                rows={4}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 resize-none"
              />

              {/* Actions */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => handleCopy(selectedPost.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    copiedId === selectedPost.id
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {copiedId === selectedPost.id ? <Icons.Check className="w-4 h-4" /> : <Icons.Copy className="w-4 h-4" />}
                  {copiedId === selectedPost.id ? 'Copied!' : 'Copy Comment'}
                </button>
                <a
                  href={selectedPost.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg text-sm font-medium transition-all"
                >
                  <Icons.ExternalLink className="w-4 h-4" />
                  Open Post
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PulseFeed;
