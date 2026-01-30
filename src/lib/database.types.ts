// ============================================================================
// DATABASE TYPES
// TypeScript types for Supabase tables
// ============================================================================

export type ProspectState =
  | 'discovered'
  | 'qualified'
  | 'researched'
  | 'drafted'
  | 'pending_human'
  | 'approved'
  | 'sent'
  | 'rejected';

export type Platform = 'reddit' | 'twitter' | 'linkedin' | 'bluesky' | 'news' | 'web';

export interface AuthorData {
  name: string;
  handle: string;
  title?: string;
  avatarUrl?: string;
  followers?: number;
  karma?: number;
  isVerified?: boolean;
}

export interface PostData {
  title?: string;
  body: string;
  url?: string;
  subreddit?: string;
  score?: number;
  created?: string;
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
    views?: number;
  };
}

export interface QualificationData {
  score: number;
  reasons: string[];
  icpMatch: 'high' | 'medium' | 'low' | 'none';
  buyingSignals: string[];
}

export interface ResearchData {
  company?: string;
  role?: string;
  companySize?: string;
  industry?: string;
  talkingPoints: string[];
  recentActivity: string[];
}

export interface Prospect {
  id: string;
  external_id: string;
  platform: Platform;
  state: ProspectState;
  author_data: AuthorData;
  post_data: PostData;
  qualification_data?: QualificationData;
  research_data?: ResearchData;
  draft_message?: string;
  review_notes?: string;
  matched_keywords: string[];
  quality_score?: number;
  created_at: string;
  updated_at: string;
  sent_at?: string;
}

export interface Keyword {
  id: string;
  keyword: string;
  platforms: Platform[];
  is_active: boolean;
  created_at: string;
}

export interface Community {
  id: string;
  platform: Platform;
  name: string;
  url?: string;
  is_active: boolean;
  created_at: string;
}

export interface SentMessage {
  id: string;
  prospect_id: string;
  message: string;
  platform: Platform;
  sent_at: string;
  response_received: boolean;
  response_data?: Record<string, any>;
}

// Database schema for Supabase client
export interface Database {
  public: {
    Tables: {
      prospects: {
        Row: Prospect;
        Insert: Omit<Prospect, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Prospect, 'id'>>;
      };
      keywords: {
        Row: Keyword;
        Insert: Omit<Keyword, 'id' | 'created_at'>;
        Update: Partial<Omit<Keyword, 'id'>>;
      };
      communities: {
        Row: Community;
        Insert: Omit<Community, 'id' | 'created_at'>;
        Update: Partial<Omit<Community, 'id'>>;
      };
      sent_messages: {
        Row: SentMessage;
        Insert: Omit<SentMessage, 'id' | 'sent_at'>;
        Update: Partial<Omit<SentMessage, 'id'>>;
      };
    };
  };
}
