// ============================================================================
// DATABASE SERVICE
// Handles persistence with Supabase or localStorage fallback
// ============================================================================

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type {
  Prospect,
  ProspectState,
  Keyword,
  Community,
  Platform,
  AuthorData,
  PostData,
} from '../lib/database.types';

// ============================================================================
// PROSPECTS
// ============================================================================

export async function getProspects(filters?: {
  state?: ProspectState | ProspectState[];
  platform?: Platform;
  limit?: number;
}): Promise<Prospect[]> {
  if (isSupabaseConfigured() && supabase) {
    let query = supabase
      .from('prospects')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.state) {
      if (Array.isArray(filters.state)) {
        query = query.in('state', filters.state);
      } else {
        query = query.eq('state', filters.state);
      }
    }

    if (filters?.platform) {
      query = query.eq('platform', filters.platform);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching prospects:', error);
      throw error;
    }

    return data || [];
  }

  // LocalStorage fallback
  const stored = localStorage.getItem('nexus-prospects');
  let prospects: Prospect[] = stored ? JSON.parse(stored) : [];

  if (filters?.state) {
    const states = Array.isArray(filters.state) ? filters.state : [filters.state];
    prospects = prospects.filter(p => states.includes(p.state));
  }

  if (filters?.platform) {
    prospects = prospects.filter(p => p.platform === filters.platform);
  }

  if (filters?.limit) {
    prospects = prospects.slice(0, filters.limit);
  }

  return prospects;
}

export async function getProspect(id: string): Promise<Prospect | null> {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('prospects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching prospect:', error);
      return null;
    }

    return data;
  }

  // LocalStorage fallback
  const stored = localStorage.getItem('nexus-prospects');
  const prospects: Prospect[] = stored ? JSON.parse(stored) : [];
  return prospects.find(p => p.id === id) || null;
}

export async function upsertProspect(prospect: {
  external_id: string;
  platform: Platform;
  author_data: AuthorData;
  post_data: PostData;
  matched_keywords?: string[];
  state?: ProspectState;
}): Promise<Prospect | null> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('prospects')
      .upsert(
        {
          external_id: prospect.external_id,
          platform: prospect.platform,
          state: prospect.state || 'discovered',
          author_data: prospect.author_data,
          post_data: prospect.post_data,
          matched_keywords: prospect.matched_keywords || [],
          updated_at: now,
        },
        { onConflict: 'external_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('Error upserting prospect:', error);
      throw error;
    }

    return data;
  }

  // LocalStorage fallback
  const stored = localStorage.getItem('nexus-prospects');
  const prospects: Prospect[] = stored ? JSON.parse(stored) : [];

  const existingIndex = prospects.findIndex(p => p.external_id === prospect.external_id);

  const newProspect: Prospect = {
    id: existingIndex >= 0 ? prospects[existingIndex].id : crypto.randomUUID(),
    external_id: prospect.external_id,
    platform: prospect.platform,
    state: prospect.state || 'discovered',
    author_data: prospect.author_data,
    post_data: prospect.post_data,
    matched_keywords: prospect.matched_keywords || [],
    created_at: existingIndex >= 0 ? prospects[existingIndex].created_at : now,
    updated_at: now,
  };

  if (existingIndex >= 0) {
    prospects[existingIndex] = { ...prospects[existingIndex], ...newProspect };
  } else {
    prospects.unshift(newProspect);
  }

  localStorage.setItem('nexus-prospects', JSON.stringify(prospects));
  return newProspect;
}

export async function updateProspect(
  id: string,
  updates: Partial<Prospect>
): Promise<Prospect | null> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('prospects')
      .update({ ...updates, updated_at: now })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating prospect:', error);
      throw error;
    }

    return data;
  }

  // LocalStorage fallback
  const stored = localStorage.getItem('nexus-prospects');
  const prospects: Prospect[] = stored ? JSON.parse(stored) : [];

  const index = prospects.findIndex(p => p.id === id);
  if (index === -1) return null;

  prospects[index] = { ...prospects[index], ...updates, updated_at: now };
  localStorage.setItem('nexus-prospects', JSON.stringify(prospects));

  return prospects[index];
}

export async function transitionProspect(
  id: string,
  newState: ProspectState,
  additionalData?: Partial<Prospect>
): Promise<Prospect | null> {
  return updateProspect(id, {
    state: newState,
    ...additionalData,
    ...(newState === 'sent' ? { sent_at: new Date().toISOString() } : {}),
  });
}

// ============================================================================
// KEYWORDS
// ============================================================================

export async function getKeywords(activeOnly = true): Promise<Keyword[]> {
  if (isSupabaseConfigured() && supabase) {
    let query = supabase.from('keywords').select('*').order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching keywords:', error);
      throw error;
    }

    return data || [];
  }

  // LocalStorage fallback
  const stored = localStorage.getItem('nexus-keywords');
  let keywords: Keyword[] = stored ? JSON.parse(stored) : [];

  if (activeOnly) {
    keywords = keywords.filter(k => k.is_active);
  }

  return keywords;
}

export async function addKeyword(keyword: string, platforms?: Platform[]): Promise<Keyword | null> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('keywords')
      .insert({
        keyword,
        platforms: platforms || ['reddit', 'twitter', 'linkedin'],
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding keyword:', error);
      throw error;
    }

    return data;
  }

  // LocalStorage fallback
  const stored = localStorage.getItem('nexus-keywords');
  const keywords: Keyword[] = stored ? JSON.parse(stored) : [];

  const newKeyword: Keyword = {
    id: crypto.randomUUID(),
    keyword,
    platforms: platforms || ['reddit', 'twitter', 'linkedin'],
    is_active: true,
    created_at: now,
  };

  keywords.unshift(newKeyword);
  localStorage.setItem('nexus-keywords', JSON.stringify(keywords));

  return newKeyword;
}

export async function removeKeyword(id: string): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase.from('keywords').delete().eq('id', id);

    if (error) {
      console.error('Error removing keyword:', error);
      throw error;
    }

    return;
  }

  // LocalStorage fallback
  const stored = localStorage.getItem('nexus-keywords');
  const keywords: Keyword[] = stored ? JSON.parse(stored) : [];

  const filtered = keywords.filter(k => k.id !== id);
  localStorage.setItem('nexus-keywords', JSON.stringify(filtered));
}

// ============================================================================
// COMMUNITIES
// ============================================================================

export async function getCommunities(activeOnly = true): Promise<Community[]> {
  if (isSupabaseConfigured() && supabase) {
    let query = supabase.from('communities').select('*').order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching communities:', error);
      throw error;
    }

    return data || [];
  }

  // LocalStorage fallback
  const stored = localStorage.getItem('nexus-communities');
  let communities: Community[] = stored ? JSON.parse(stored) : [];

  if (activeOnly) {
    communities = communities.filter(c => c.is_active);
  }

  return communities;
}

export async function addCommunity(
  platform: Platform,
  name: string,
  url?: string
): Promise<Community | null> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('communities')
      .insert({
        platform,
        name,
        url,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding community:', error);
      throw error;
    }

    return data;
  }

  // LocalStorage fallback
  const stored = localStorage.getItem('nexus-communities');
  const communities: Community[] = stored ? JSON.parse(stored) : [];

  const newCommunity: Community = {
    id: crypto.randomUUID(),
    platform,
    name,
    url,
    is_active: true,
    created_at: now,
  };

  communities.unshift(newCommunity);
  localStorage.setItem('nexus-communities', JSON.stringify(communities));

  return newCommunity;
}

// ============================================================================
// PIPELINE STATS
// ============================================================================

export async function getPipelineStats(): Promise<Record<ProspectState, number>> {
  const states: ProspectState[] = [
    'discovered',
    'qualified',
    'researched',
    'drafted',
    'pending_human',
    'approved',
    'sent',
    'rejected',
  ];

  const stats: Record<ProspectState, number> = {} as Record<ProspectState, number>;

  if (isSupabaseConfigured() && supabase) {
    for (const state of states) {
      const { count, error } = await supabase
        .from('prospects')
        .select('*', { count: 'exact', head: true })
        .eq('state', state);

      stats[state] = error ? 0 : count || 0;
    }

    return stats;
  }

  // LocalStorage fallback
  const stored = localStorage.getItem('nexus-prospects');
  const prospects: Prospect[] = stored ? JSON.parse(stored) : [];

  for (const state of states) {
    stats[state] = prospects.filter(p => p.state === state).length;
  }

  return stats;
}

// ============================================================================
// REAL-TIME SUBSCRIPTIONS (Supabase only)
// ============================================================================

export function subscribeToProspects(
  callback: (prospect: Prospect) => void,
  states?: ProspectState[]
) {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('Real-time subscriptions require Supabase');
    return () => {};
  }

  const channel = supabase
    .channel('prospects-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'prospects',
      },
      (payload) => {
        const prospect = payload.new as Prospect;
        if (!states || states.includes(prospect.state)) {
          callback(prospect);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
