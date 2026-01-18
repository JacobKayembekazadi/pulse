// ============================================================================
// INBOX SERVICE - Unified Conversation Management
// ============================================================================

import {
  Conversation, ConversationFilters, Message, PaginatedResult,
  Channel, ConversationStatus, ConversationPriority, Platform, Participant, Attachment
} from '../types';
import { InboxService, CreateConversationInput, CreateMessageInput } from './index';

// In-memory storage
let conversations: Conversation[] = [];

const generateId = () => Math.random().toString(36).substring(2, 15);

// Sample data
const SAMPLE_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_1',
    accountId: 'acc_3',
    contactId: 'con_4',
    channel: 'linkedin',
    subject: 'RE: Community-led growth discussion',
    participants: [
      { id: 'user_1', name: 'You', isExternal: false },
      { id: 'con_4', name: 'Amanda Torres', avatar: 'AT', isExternal: true }
    ],
    messages: [
      {
        id: 'msg_1',
        conversationId: 'conv_1',
        sender: { id: 'con_4', name: 'Amanda Torres', avatar: 'AT', isExternal: true },
        content: "That's a great point about community-led growth. We've been experimenting with this at CloudFirst.",
        sentAt: new Date(Date.now() - 2 * 86400000),
        readAt: new Date(Date.now() - 2 * 86400000 + 3600000)
      },
      {
        id: 'msg_2',
        conversationId: 'conv_1',
        sender: { id: 'user_1', name: 'You', isExternal: false },
        content: "Totally agree! We've seen 3x improvement in response rates with this approach. Happy to share our playbook if helpful.",
        sentAt: new Date(Date.now() - 2 * 86400000 + 7200000),
        readAt: new Date(Date.now() - 2 * 86400000 + 10800000)
      },
      {
        id: 'msg_3',
        conversationId: 'conv_1',
        sender: { id: 'con_4', name: 'Amanda Torres', avatar: 'AT', isExternal: true },
        content: "Thanks for the insight! Would love to see that playbook. Also curious about your tech stack for this.",
        sentAt: new Date(Date.now() - 2 * 3600000),
        readAt: new Date(Date.now() - 3600000)
      }
    ],
    status: 'open',
    priority: 'high',
    tags: ['hot-lead', 'playbook-requested'],
    lastMessageAt: new Date(Date.now() - 2 * 3600000),
    createdAt: new Date(Date.now() - 2 * 86400000)
  },
  {
    id: 'conv_2',
    accountId: 'acc_1',
    contactId: 'con_2',
    channel: 'twitter',
    subject: 'ABM strategy thread',
    participants: [
      { id: 'user_1', name: 'You', isExternal: false },
      { id: 'con_2', name: 'Sarah Johnson', avatar: 'SJ', isExternal: true }
    ],
    messages: [
      {
        id: 'msg_4',
        conversationId: 'conv_2',
        sender: { id: 'con_2', name: 'Sarah Johnson', avatar: 'SJ', isExternal: true },
        content: "Interesting perspective on ABM! What tools are you using for intent data?",
        sentAt: new Date(Date.now() - 5 * 3600000)
      }
    ],
    status: 'pending',
    priority: 'medium',
    tags: ['question'],
    lastMessageAt: new Date(Date.now() - 5 * 3600000),
    createdAt: new Date(Date.now() - 5 * 3600000)
  },
  {
    id: 'conv_3',
    accountId: 'acc_2',
    contactId: 'con_3',
    channel: 'email',
    subject: 'Re: Demo request follow-up',
    participants: [
      { id: 'user_1', name: 'You', isExternal: false },
      { id: 'con_3', name: 'Michael Chen', avatar: 'MC', isExternal: true }
    ],
    messages: [
      {
        id: 'msg_5',
        conversationId: 'conv_3',
        sender: { id: 'user_1', name: 'You', isExternal: false },
        content: "Hi Michael,\n\nThanks for your interest in our platform. I'd love to schedule a demo to show you how we can help ScaleUp Ventures streamline portfolio company support.\n\nAre you available for a 30-minute call this week?\n\nBest,\n[Your Name]",
        sentAt: new Date(Date.now() - 86400000)
      },
      {
        id: 'msg_6',
        conversationId: 'conv_3',
        sender: { id: 'con_3', name: 'Michael Chen', avatar: 'MC', isExternal: true },
        content: "Hi,\n\nThanks for reaching out. Thursday afternoon works best for me. Can you send a calendar invite?\n\nMichael",
        sentAt: new Date(Date.now() - 12 * 3600000),
        readAt: new Date(Date.now() - 11 * 3600000)
      }
    ],
    status: 'open',
    priority: 'high',
    tags: ['demo-scheduled'],
    lastMessageAt: new Date(Date.now() - 12 * 3600000),
    createdAt: new Date(Date.now() - 86400000)
  },
  {
    id: 'conv_4',
    channel: 'linkedin',
    subject: 'Growth strategies question',
    participants: [
      { id: 'user_1', name: 'You', isExternal: false },
      { id: 'ext_1', name: 'James Liu', avatar: 'JL', isExternal: true }
    ],
    messages: [
      {
        id: 'msg_7',
        conversationId: 'conv_4',
        sender: { id: 'ext_1', name: 'James Liu', avatar: 'JL', isExternal: true },
        content: "Hey! Saw your comment on the B2B growth thread. Would love to pick your brain on intent data strategies sometime.",
        sentAt: new Date(Date.now() - 3 * 86400000)
      },
      {
        id: 'msg_8',
        conversationId: 'conv_4',
        sender: { id: 'user_1', name: 'You', isExternal: false },
        content: "Happy to chat! Feel free to DM me or we can set up a quick call.",
        sentAt: new Date(Date.now() - 3 * 86400000 + 3600000)
      }
    ],
    status: 'resolved',
    priority: 'low',
    tags: [],
    lastMessageAt: new Date(Date.now() - 3 * 86400000 + 3600000),
    createdAt: new Date(Date.now() - 3 * 86400000)
  }
];

conversations = [...SAMPLE_CONVERSATIONS];

export class LocalInboxService implements InboxService {

  async getConversations(
    filters: ConversationFilters,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResult<Conversation>> {
    let filtered = [...conversations];

    if (filters.status?.length) {
      filtered = filtered.filter(c => filters.status!.includes(c.status));
    }

    if (filters.channel?.length) {
      filtered = filtered.filter(c => filters.channel!.includes(c.channel));
    }

    if (filters.priority?.length) {
      filtered = filtered.filter(c => filters.priority!.includes(c.priority));
    }

    if (filters.accountId) {
      filtered = filtered.filter(c => c.accountId === filters.accountId);
    }

    if (filters.assignedTo) {
      filtered = filtered.filter(c => c.assignedTo?.id === filters.assignedTo);
    }

    // Sort by last message (most recent first)
    filtered.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());

    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
      data: filtered.slice(start, end),
      total: filtered.length,
      page,
      pageSize,
      hasMore: end < filtered.length
    };
  }

  async getConversation(id: string): Promise<Conversation | null> {
    return conversations.find(c => c.id === id) || null;
  }

  async createConversation(params: CreateConversationInput): Promise<Conversation> {
    const id = generateId();
    const now = new Date();

    const newConversation: Conversation = {
      id,
      accountId: params.accountId,
      contactId: params.contactId,
      channel: params.channel,
      subject: params.subject,
      participants: [
        { id: 'user_1', name: 'You', isExternal: false }
      ],
      messages: [
        {
          id: generateId(),
          conversationId: id,
          sender: { id: 'user_1', name: 'You', isExternal: false },
          content: params.initialMessage,
          sentAt: now
        }
      ],
      status: 'open',
      priority: 'medium',
      tags: [],
      lastMessageAt: now,
      createdAt: now
    };

    conversations.unshift(newConversation);
    return newConversation;
  }

  async addMessage(conversationId: string, message: CreateMessageInput): Promise<Message> {
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) throw new Error('Conversation not found');

    const newMessage: Message = {
      id: generateId(),
      conversationId,
      sender: { id: 'user_1', name: 'You', isExternal: false },
      content: message.content,
      attachments: message.attachments?.map(a => ({
        id: generateId(),
        name: a.name,
        url: a.url,
        type: a.type,
        size: a.size
      })),
      sentAt: new Date()
    };

    conversation.messages.push(newMessage);
    conversation.lastMessageAt = newMessage.sentAt;

    // If we're replying, set status to pending (waiting for their response)
    if (conversation.status === 'open') {
      conversation.status = 'pending';
    }

    return newMessage;
  }

  async assignConversation(id: string, teamMemberId: string): Promise<void> {
    const conversation = conversations.find(c => c.id === id);
    if (!conversation) throw new Error('Conversation not found');

    // In a real app, you'd look up the team member
    conversation.assignedTo = {
      id: teamMemberId,
      email: `${teamMemberId}@company.com`,
      name: 'Team Member',
      role: 'sdr',
      permissions: [],
      assignedAccounts: [],
      capacity: { maxAccounts: 50, currentAccounts: 10 },
      performance: { responsesThisWeek: 0, avgResponseTime: 0, meetingsBooked: 0 }
    };
  }

  async updateStatus(id: string, status: ConversationStatus): Promise<void> {
    const conversation = conversations.find(c => c.id === id);
    if (!conversation) throw new Error('Conversation not found');
    conversation.status = status;
  }

  async updatePriority(id: string, priority: ConversationPriority): Promise<void> {
    const conversation = conversations.find(c => c.id === id);
    if (!conversation) throw new Error('Conversation not found');
    conversation.priority = priority;
  }

  async addTag(id: string, tag: string): Promise<void> {
    const conversation = conversations.find(c => c.id === id);
    if (!conversation) throw new Error('Conversation not found');
    if (!conversation.tags.includes(tag)) {
      conversation.tags.push(tag);
    }
  }

  async removeTag(id: string, tag: string): Promise<void> {
    const conversation = conversations.find(c => c.id === id);
    if (!conversation) throw new Error('Conversation not found');
    conversation.tags = conversation.tags.filter(t => t !== tag);
  }

  async syncFromPlatform(platform: Platform): Promise<{ added: number; updated: number }> {
    // Mock sync - in production, this would pull from LinkedIn/Twitter APIs
    console.log(`Syncing from ${platform}...`);

    // Simulate finding new messages
    const platformConversations = conversations.filter(c => c.channel === platform);

    // Mock: randomly add a new message to some conversations
    let added = 0;
    for (const conv of platformConversations) {
      if (Math.random() > 0.7 && conv.status !== 'resolved') {
        const externalParticipant = conv.participants.find(p => p.isExternal);
        if (externalParticipant) {
          conv.messages.push({
            id: generateId(),
            conversationId: conv.id,
            sender: externalParticipant,
            content: 'Thanks for getting back to me! This is a simulated sync message.',
            sentAt: new Date()
          });
          conv.lastMessageAt = new Date();
          conv.status = 'open';
          added++;
        }
      }
    }

    return { added, updated: 0 };
  }

  // Helper methods for statistics
  getStats() {
    const open = conversations.filter(c => c.status === 'open').length;
    const pending = conversations.filter(c => c.status === 'pending').length;
    const needsReply = conversations.filter(c => {
      if (c.messages.length === 0) return false;
      const lastMessage = c.messages[c.messages.length - 1];
      return lastMessage.sender.isExternal && c.status !== 'resolved';
    }).length;

    return { open, pending, needsReply, total: conversations.length };
  }
}

// Export singleton instance
export const inboxService = new LocalInboxService();
