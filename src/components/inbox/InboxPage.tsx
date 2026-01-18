// ============================================================================
// INBOX PAGE - Unified Conversation Management
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
      // Refresh conversation
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
      case 'linkedin': return <Icons.LinkedIn className="w-4 h-4" />;
      case 'twitter': return <Icons.Twitter className="w-4 h-4" />;
      case 'email': return <Icons.Mail className="w-4 h-4" />;
      default: return <Icons.MessageSquare className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: ConversationStatus) => {
    switch (status) {
      case 'open': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
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
      <div className="w-80 flex flex-col bg-[#111113] border border-white/10 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <h2 className="font-semibold mb-3">Inbox</h2>
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
                className={`px-3 py-1 rounded text-xs capitalize transition-colors ${
                  filters.status?.includes(status)
                    ? 'bg-white/10 text-white'
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
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm">
              No conversations found
            </div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`p-4 border-b border-white/5 cursor-pointer transition-colors ${
                  selectedConversation?.id === conv.id
                    ? 'bg-blue-500/10'
                    : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Status Indicator */}
                  <div className={`w-2 h-2 rounded-full mt-2 ${getStatusColor(conv.status)}`} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">
                        {conv.participants.find(p => p.isExternal)?.name || 'Unknown'}
                      </span>
                      <span className="text-gray-400">
                        {getChannelIcon(conv.channel)}
                      </span>
                      {needsReply(conv) && (
                        <span className="w-2 h-2 bg-red-500 rounded-full" />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">
                      {conv.messages[conv.messages.length - 1]?.content || 'No messages'}
                    </p>
                  </div>

                  {/* Time */}
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
      <div className="flex-1 flex flex-col bg-[#111113] border border-white/10 rounded-xl overflow-hidden">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-sm font-medium">
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

              <div className="flex items-center gap-2">
                <select
                  value={selectedConversation.status}
                  onChange={async e => {
                    await inboxService.updateStatus(selectedConversation.id, e.target.value as ConversationStatus);
                    loadConversations();
                  }}
                  className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm"
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
                        ? 'bg-white/10 rounded-bl-none'
                        : 'bg-blue-500 rounded-br-none'
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
            <div className="p-4 border-t border-white/10">
              <div className="flex gap-3">
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  rows={2}
                  className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || isSending}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  {isSending ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Icons.Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                  <Icons.Sparkles className="w-3 h-3" />
                  AI Draft
                </button>
                <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                  <Icons.Library className="w-3 h-3" />
                  Templates
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Icons.Inbox className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a conversation to view</p>
            </div>
          </div>
        )}
      </div>

      {/* Context Panel */}
      {selectedConversation?.accountId && (
        <div className="w-72 bg-[#111113] border border-white/10 rounded-xl p-4 overflow-y-auto">
          <h3 className="font-semibold mb-4">Context</h3>

          <div className="space-y-4">
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Icons.Target className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium">Account</span>
              </div>
              <p className="text-xs text-gray-400">
                View account details, intent signals, and engagement history
              </p>
            </div>

            <div className="p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Icons.Zap className="w-4 h-4 text-yellow-400" />
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
                    <span key={tag} className="px-2 py-0.5 bg-white/10 text-xs rounded">
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
