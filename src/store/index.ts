// ============================================================================
// NEXUS PLATFORM - GLOBAL STATE MANAGEMENT (ZUSTAND)
// ============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Account, SocialPost, Conversation, Campaign, Competitor,
  ContentTemplate, SOP, HotMoment, Integration, AIConfig,
  Platform, TimeFrame, AccountFilters, PostFilters, ConversationFilters
} from '../types';

// ============================================
// APP STATE
// ============================================

type Tab = 'dashboard' | 'pipeline' | 'pulse' | 'accounts' | 'inbox' | 'campaigns' | 'compete' | 'library' | 'analytics';

interface AppState {
  // Navigation
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;

  // UI State
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;

  // Workspace
  workspaceName: string;
  setWorkspaceName: (name: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeTab: 'dashboard',
      setActiveTab: (tab) => set({ activeTab: tab }),

      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      showSettings: false,
      setShowSettings: (show) => set({ showSettings: show }),

      workspaceName: 'My Workspace',
      setWorkspaceName: (name) => set({ workspaceName: name }),
    }),
    { name: 'nexus-app-state' }
  )
);

// ============================================
// PULSE (SOCIAL MONITORING) STATE
// ============================================

interface PulseState {
  // Search
  keywords: string[];
  setKeywords: (keywords: string[]) => void;
  addKeyword: (keyword: string) => void;
  removeKeyword: (keyword: string) => void;

  platforms: Platform[];
  setPlatforms: (platforms: Platform[]) => void;
  togglePlatform: (platform: Platform) => void;

  timeframe: TimeFrame;
  setTimeframe: (timeframe: TimeFrame) => void;

  // Posts
  posts: SocialPost[];
  setPosts: (posts: SocialPost[]) => void;
  addPosts: (posts: SocialPost[]) => void;
  clearPosts: () => void;

  // Live mode
  isLive: boolean;
  setIsLive: (isLive: boolean) => void;

  // Loading
  isSearching: boolean;
  setIsSearching: (isSearching: boolean) => void;

  // Selected post for detail view
  selectedPost: SocialPost | null;
  setSelectedPost: (post: SocialPost | null) => void;

  // Filters
  filters: PostFilters;
  setFilters: (filters: PostFilters) => void;
}

export const usePulseStore = create<PulseState>()(
  persist(
    (set) => ({
      keywords: [],
      setKeywords: (keywords) => set({ keywords }),
      addKeyword: (keyword) => set((state) => ({
        keywords: state.keywords.includes(keyword) ? state.keywords : [...state.keywords, keyword]
      })),
      removeKeyword: (keyword) => set((state) => ({
        keywords: state.keywords.filter(k => k !== keyword)
      })),

      platforms: ['linkedin', 'twitter', 'reddit'],
      setPlatforms: (platforms) => set({ platforms }),
      togglePlatform: (platform) => set((state) => ({
        platforms: state.platforms.includes(platform)
          ? state.platforms.filter(p => p !== platform)
          : [...state.platforms, platform]
      })),

      timeframe: '24h',
      setTimeframe: (timeframe) => set({ timeframe }),

      posts: [],
      setPosts: (posts) => set({ posts }),
      addPosts: (newPosts) => set((state) => {
        const existingIds = new Set(state.posts.map(p => p.id));
        const unique = newPosts.filter(p => !existingIds.has(p.id));
        return { posts: [...unique, ...state.posts].slice(0, 100) };
      }),
      clearPosts: () => set({ posts: [] }),

      isLive: false,
      setIsLive: (isLive) => set({ isLive }),

      isSearching: false,
      setIsSearching: (isSearching) => set({ isSearching }),

      selectedPost: null,
      setSelectedPost: (post) => set({ selectedPost: post }),

      filters: {},
      setFilters: (filters) => set({ filters }),
    }),
    {
      name: 'nexus-pulse-state',
      partialize: (state) => ({
        // Only persist these fields (not posts which can be large)
        keywords: state.keywords,
        platforms: state.platforms,
        timeframe: state.timeframe,
      }),
    }
  )
);

// ============================================
// ACCOUNTS STATE
// ============================================

interface AccountsState {
  accounts: Account[];
  setAccounts: (accounts: Account[]) => void;

  selectedAccount: Account | null;
  setSelectedAccount: (account: Account | null) => void;

  filters: AccountFilters;
  setFilters: (filters: AccountFilters) => void;

  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

export const useAccountsStore = create<AccountsState>()((set) => ({
  accounts: [],
  setAccounts: (accounts) => set({ accounts }),

  selectedAccount: null,
  setSelectedAccount: (account) => set({ selectedAccount: account }),

  filters: {},
  setFilters: (filters) => set({ filters }),

  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
}));

// ============================================
// INBOX STATE
// ============================================

interface InboxState {
  conversations: Conversation[];
  setConversations: (conversations: Conversation[]) => void;

  selectedConversation: Conversation | null;
  setSelectedConversation: (conversation: Conversation | null) => void;

  filters: ConversationFilters;
  setFilters: (filters: ConversationFilters) => void;

  unreadCount: number;
  setUnreadCount: (count: number) => void;

  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

export const useInboxStore = create<InboxState>()((set) => ({
  conversations: [],
  setConversations: (conversations) => set({ conversations }),

  selectedConversation: null,
  setSelectedConversation: (conversation) => set({ selectedConversation: conversation }),

  filters: { status: ['open', 'pending'] },
  setFilters: (filters) => set({ filters }),

  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),

  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
}));

// ============================================
// CAMPAIGNS STATE
// ============================================

interface CampaignsState {
  campaigns: Campaign[];
  setCampaigns: (campaigns: Campaign[]) => void;

  selectedCampaign: Campaign | null;
  setSelectedCampaign: (campaign: Campaign | null) => void;

  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

export const useCampaignsStore = create<CampaignsState>()((set) => ({
  campaigns: [],
  setCampaigns: (campaigns) => set({ campaigns }),

  selectedCampaign: null,
  setSelectedCampaign: (campaign) => set({ selectedCampaign: campaign }),

  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
}));

// ============================================
// COMPETITIVE STATE
// ============================================

interface CompetitiveState {
  competitors: Competitor[];
  setCompetitors: (competitors: Competitor[]) => void;

  mentions: Map<string, SocialPost[]>;
  setMentions: (competitorId: string, posts: SocialPost[]) => void;

  selectedCompetitor: Competitor | null;
  setSelectedCompetitor: (competitor: Competitor | null) => void;
}

export const useCompetitiveStore = create<CompetitiveState>()((set) => ({
  competitors: [],
  setCompetitors: (competitors) => set({ competitors }),

  mentions: new Map(),
  setMentions: (competitorId, posts) => set((state) => {
    const newMentions = new Map(state.mentions);
    newMentions.set(competitorId, posts);
    return { mentions: newMentions };
  }),

  selectedCompetitor: null,
  setSelectedCompetitor: (competitor) => set({ selectedCompetitor: competitor }),
}));

// ============================================
// CONTENT LIBRARY STATE
// ============================================

interface ContentState {
  templates: ContentTemplate[];
  setTemplates: (templates: ContentTemplate[]) => void;

  sops: SOP[];
  setSOPs: (sops: SOP[]) => void;

  selectedTemplate: ContentTemplate | null;
  setSelectedTemplate: (template: ContentTemplate | null) => void;

  selectedSOP: SOP | null;
  setSelectedSOP: (sop: SOP | null) => void;
}

export const useContentStore = create<ContentState>()((set) => ({
  templates: [],
  setTemplates: (templates) => set({ templates }),

  sops: [],
  setSOPs: (sops) => set({ sops }),

  selectedTemplate: null,
  setSelectedTemplate: (template) => set({ selectedTemplate: template }),

  selectedSOP: null,
  setSelectedSOP: (sop) => set({ selectedSOP: sop }),
}));

// ============================================
// SETTINGS STATE
// ============================================

interface SettingsState {
  integrations: Integration[];
  setIntegrations: (integrations: Integration[]) => void;
  updateIntegration: (id: string, data: Partial<Integration>) => void;

  aiConfig: AIConfig;
  setAIConfig: (config: AIConfig) => void;

  // Persisted settings
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      integrations: [],
      setIntegrations: (integrations) => set({ integrations }),
      updateIntegration: (id, data) => set((state) => ({
        integrations: state.integrations.map(i => i.id === id ? { ...i, ...data } : i)
      })),

      aiConfig: {
        provider: 'google',
        model: 'gemini-2.0-flash',
        apiKey: '',
        settings: {
          temperature: 0.7,
          maxTokens: 1024,
          defaultTone: 'professional'
        }
      },
      setAIConfig: (config) => set({ aiConfig: config }),

      theme: 'dark',
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'nexus-settings' }
  )
);

// ============================================
// HOT MOMENTS & NOTIFICATIONS STATE
// ============================================

interface NotificationsState {
  hotMoments: HotMoment[];
  setHotMoments: (moments: HotMoment[]) => void;
  addHotMoment: (moment: HotMoment) => void;
  dismissHotMoment: (id: string) => void;

  notifications: { id: string; message: string; type: 'info' | 'success' | 'warning' | 'error'; timestamp: Date }[];
  addNotification: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  removeNotification: (id: string) => void;
}

export const useNotificationsStore = create<NotificationsState>()((set) => ({
  hotMoments: [],
  setHotMoments: (moments) => set({ hotMoments: moments }),
  addHotMoment: (moment) => set((state) => ({ hotMoments: [moment, ...state.hotMoments] })),
  dismissHotMoment: (id) => set((state) => ({
    hotMoments: state.hotMoments.filter(m => m.id !== id)
  })),

  notifications: [],
  addNotification: (message, type) => set((state) => ({
    notifications: [
      { id: Math.random().toString(36).substring(7), message, type, timestamp: new Date() },
      ...state.notifications
    ].slice(0, 10)
  })),
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),
}));
