// ============================================================================
// INBOX PAGE - Unified Conversation Management
// Uses Pulse Visual Design Language (glassmorphism, neon effects, gradients)
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useInboxStore } from '../../store';
import { inboxService } from '../../services/inbox.service';
import { Icons } from '../shared/Icons';
import { Conversation, Channel, ConversationStatus } from '../../types';

export function InboxPage() {
  const {
    conversations, setConversations,
    selectedConversation, setSelectedConversation,
    filters, setFilters
  } = useInboxStore();

  const [isLoading, setIsLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadConversations();
  }, [filters]);

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const result = await inboxService.getConversations(filters);
      setConversations(result.data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedConversation || !replyText.trim()) return;

    setIsSending(true);
    try {
      await inboxService.addMessage(selectedConversation.id, { content: replyText });
      setReplyText('');
      const updated = await inboxService.getConversation(selectedConversation.id);
      if (updated) {
        setSelectedConversation(updated);
        loadConversations();
      }
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setIsSending(false);
    }
  };

  const getChannelIcon = (channel: Channel) => {
    switch (channel) {
      case 'linkedin': return <Icons.LinkedIn className="w-4 h-4 text-[#0077b5]" />;
      case 'twitter': return <Icons.Twitter className="w-4 h-4 text-blue-400" />;
      case 'email': return <Icons.Mail className="w-4 h-4 text-gray-400" />;
      default: return <Icons.MessageSquare className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: ConversationStatus) => {
    switch (status) {
      case 'open': return 'bg-green-500 shadow-[0_0_8px_#10b981]';
      case 'pending': return 'bg-yellow-500 shadow-[0_0_8px_#eab308]';
      case 'resolved': return 'bg-gray-500';
      case 'archived': return 'bg-gray-600';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const needsReply = (conv: Conversation) => {
    if (conv.messages.length === 0) return false;
    const lastMsg = conv.messages[conv.messages.length - 1];
    return lastMsg.sender.isExternal && conv.status !== 'resolved';
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Conversation List */}
      <div className="w-80 flex flex-col glass-panel border border-primary/20 rounded-xl overflow-hidden shadow-[0_0_30px_-12px_rgba(99,102,241,0.2)]">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <h2 className="font-semibold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Inbox</h2>
          <div className="flex gap-1">
            {(['open', 'pending', 'resolved'] as ConversationStatus[]).map(status => (
              <button
                key={status}
                onClick={() => setFilters({
                  ...filters,
                  status: filters.status?.includes(status)
                    ? filters.status.filter(s => s !== status)
                    : [...(filters.status || []), status]
                })}
                className={`px-3 py-1 rounded text-xs capitalize transition-all hover:scale-105 ${
                  filters.status?.includes(status)
                    ? status === 'open' ? 'bg-green-500/20 text-green-400' :
                      status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    : 'text-gray-400 hover:bg-white/5'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin"></div>
                <div className="absolute inset-1 border-t-2 border-accent rounded-full animate-spin" style={{ animationDirection: 'reverse' }}></div>
              </div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm">
              <Icons.Inbox className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No conversations found
            </div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`p-4 border-b border-white/5 cursor-pointer transition-all group ${
                  selectedConversation?.id === conv.id
                    ? 'bg-primary/10 border-l-2 border-l-primary'
                    : 'hover:bg-white/5 border-l-2 border-l-transparent'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${getStatusColor(conv.status)}`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                        {conv.participants.find(p => p.isExternal)?.name || 'Unknown'}
                      </span>
                      <span className="text-gray-400">
                        {getChannelIcon(conv.channel)}
                      </span>
                      {needsReply(conv) && (
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_#ef4444]" />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">
                      {conv.messages[conv.messages.length - 1]?.content || 'No messages'}
                    </p>
                  </div>

                  <span className="text-xs text-gray-500">
                    {formatTimeAgo(conv.lastMessageAt)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Conversation Detail */}
      <div className="flex-1 flex flex-col glass-panel border border-white/10 rounded-xl overflow-hidden">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between relative overflow-hidden">
              <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>

              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-medium shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                  {selectedConversation.participants.find(p => p.isExternal)?.name?.substring(0, 2) || '??'}
                </div>
                <div>
                  <h3 className="font-semibold">
                    {selectedConversation.participants.find(p => p.isExternal)?.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    {getChannelIcon(selectedConversation.channel)}
                    <span className="capitalize">{selectedConversation.channel}</span>
                    {selectedConversation.subject && (
                      <>
                        <span>·</span>
                        <span>{selectedConversation.subject}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 relative z-10">
                <select
                  value={selectedConversation.status}
                  onChange={async e => {
                    await inboxService.updateStatus(selectedConversation.id, e.target.value as ConversationStatus);
                    loadConversations();
                  }}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                >
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedConversation.messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.sender.isExternal ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl p-4 ${
                      message.sender.isExternal
                        ? 'glass-card rounded-bl-none'
                        : 'bg-gradient-to-r from-primary to-accent rounded-br-none shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-60 mt-2">
                      {new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Input */}
            <div className="p-4 border-t border-white/10 relative overflow-hidden">
              <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-accent/10 rounded-full blur-3xl"></div>

              <div className="flex gap-3 relative z-10">
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  rows={2}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:border-primary/50 transition-colors"
                />
                <button
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || isSending}
                  className="px-4 py-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 disabled:opacity-50 text-white rounded-lg transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:scale-105 disabled:hover:scale-100"
                >
                  {isSending ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Icons.Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              <div className="flex items-center gap-3 mt-3 relative z-10">
                <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary transition-colors group">
                  <Icons.Sparkles className="w-3 h-3 group-hover:scale-110 transition-transform" />
                  AI Draft
                </button>
                <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary transition-colors group">
                  <Icons.Library className="w-3 h-3 group-hover:scale-110 transition-transform" />
                  Templates
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Icons.Inbox className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Select a conversation to view</p>
            </div>
          </div>
        )}
      </div>

      {/* Context Panel */}
      {selectedConversation?.accountId && (
        <div className="w-72 glass-panel border border-white/10 rounded-xl p-4 overflow-y-auto">
          <h3 className="font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Context</h3>

          <div className="space-y-4">
            <div className="glass-card p-3 rounded-lg group hover:border-primary/30">
              <div className="flex items-center gap-2 mb-2">
                <Icons.Target className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">Account</span>
              </div>
              <p className="text-xs text-gray-400">
                View account details, intent signals, and engagement history
              </p>
            </div>

            <div className="glass-card p-3 rounded-lg group hover:border-yellow-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Icons.Zap className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">Suggested Action</span>
              </div>
              <p className="text-xs text-gray-400">
                Send playbook + book call
              </p>
            </div>

            {selectedConversation.tags.length > 0 && (
              <div>
                <span className="text-xs text-gray-400">Tags</span>
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedConversation.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-white/10 text-xs rounded hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default InboxPage;
