export interface SocialPost {
  id: string;
  author: string;
  handle: string;
  avatar: string;
  content: string;
  platform: 'twitter' | 'instagram' | 'linkedin' | 'tiktok' | 'reddit' | 'news' | 'web' | 'bluesky';
  sentiment: 'positive' | 'negative' | 'neutral';
  timestamp: number;
  likes: number;
  shares: number;
  sourceUrl?: string;
}

export interface AnalyticsData {
  time: string;
  volume: number;
  sentimentScore: number;
}

export interface BrandConfig {
  name: string;
  handle: string;
  isActive: boolean;
}

export interface SOPItem {
  id: string;
  title: string;
  content: string;
  type: 'tone' | 'template' | 'rule';
  isActive: boolean;
}

export type TimeFrame = 'live' | '24h' | '7d' | '30d' | '1y';