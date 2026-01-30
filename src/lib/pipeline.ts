// ============================================================================
// PIPELINE STATE MACHINE
// Defines prospect flow through the sales pipeline
// ============================================================================

import type { ProspectState, Prospect } from './database.types';

// ============================================================================
// STATE DEFINITIONS
// ============================================================================

interface StateDefinition {
  next: ProspectState | null;
  agent?: string;
  auto: boolean;
  description: string;
  condition?: (prospect: Prospect) => boolean;
}

export const PIPELINE_STATES: Record<ProspectState, StateDefinition> = {
  discovered: {
    next: 'qualified',
    agent: 'qualifier',
    auto: true,
    description: 'New post found by scout',
  },
  qualified: {
    next: 'researched',
    agent: 'researcher',
    auto: true,
    description: 'Passed ICP qualification',
    condition: (p) => (p.qualification_data?.score ?? 0) >= 70,
  },
  researched: {
    next: 'drafted',
    agent: 'writer',
    auto: true,
    description: 'Author/company researched',
  },
  drafted: {
    next: 'pending_human',
    agent: 'reviewer',
    auto: true,
    description: 'Reply message drafted',
  },
  pending_human: {
    next: 'approved',
    auto: false, // HUMAN CHECKPOINT
    description: 'Waiting for human review',
  },
  approved: {
    next: 'sent',
    agent: 'sender',
    auto: true,
    description: 'Approved by human',
  },
  sent: {
    next: null, // Terminal state
    auto: false,
    description: 'Message sent',
  },
  rejected: {
    next: null, // Terminal state
    auto: false,
    description: 'Rejected by human or filter',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getNextState(currentState: ProspectState): ProspectState | null {
  return PIPELINE_STATES[currentState]?.next ?? null;
}

export function isAutoState(state: ProspectState): boolean {
  return PIPELINE_STATES[state]?.auto ?? false;
}

export function isHumanCheckpoint(state: ProspectState): boolean {
  return state === 'pending_human';
}

export function isTerminalState(state: ProspectState): boolean {
  return PIPELINE_STATES[state]?.next === null;
}

export function getAgentForState(state: ProspectState): string | null {
  return PIPELINE_STATES[state]?.agent ?? null;
}

export function canTransition(prospect: Prospect): boolean {
  const stateDef = PIPELINE_STATES[prospect.state];

  if (!stateDef || !stateDef.next) {
    return false;
  }

  if (stateDef.condition && !stateDef.condition(prospect)) {
    return false;
  }

  return true;
}

export function getStateDescription(state: ProspectState): string {
  return PIPELINE_STATES[state]?.description ?? 'Unknown state';
}

// ============================================================================
// PIPELINE METRICS
// ============================================================================

export function calculateConversionRate(
  stats: Record<ProspectState, number>
): Record<string, number> {
  const discovered = stats.discovered || 1;

  return {
    discoveredToQualified: ((stats.qualified + stats.researched + stats.drafted + stats.pending_human + stats.approved + stats.sent) / discovered) * 100,
    qualifiedToDrafted: stats.qualified > 0 ? ((stats.drafted + stats.pending_human + stats.approved + stats.sent) / stats.qualified) * 100 : 0,
    draftedToSent: stats.drafted > 0 ? (stats.sent / stats.drafted) * 100 : 0,
    overallConversion: (stats.sent / discovered) * 100,
    rejectionRate: (stats.rejected / discovered) * 100,
  };
}

// ============================================================================
// STATE COLORS FOR UI
// ============================================================================

export const STATE_COLORS: Record<ProspectState, { bg: string; text: string; border: string }> = {
  discovered: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500' },
  qualified: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500' },
  researched: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500' },
  drafted: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500' },
  pending_human: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500' },
  approved: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500' },
  sent: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500' },
  rejected: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500' },
};

export const STATE_LABELS: Record<ProspectState, string> = {
  discovered: 'Discovered',
  qualified: 'Qualified',
  researched: 'Researched',
  drafted: 'Drafted',
  pending_human: 'Pending Review',
  approved: 'Approved',
  sent: 'Sent',
  rejected: 'Rejected',
};
