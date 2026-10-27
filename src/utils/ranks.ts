// The four ranks of the team, in order: Specialist < Supervisor < Investment Manager < Partner Broker.
// A rank is read from the `positions` table name (the source of truth), falling back to the
// position id when the table has not been loaded.
export type Rank = 'specialist' | 'supervisor' | 'investment_manager' | 'broker';

export const RANK_LABEL: Record<Rank, string> = {
  specialist: 'Property Sales Specialist',
  supervisor: 'Property Sales Supervisor',
  investment_manager: 'Investment Manager',
  broker: 'Partner Broker',
};

// Commission rate (%) of each rank. Used only when the positions table has no rate.
export const DEFAULT_RANK_RATE: Record<Rank, number> = {
  specialist: 3,
  supervisor: 3.5,
  investment_manager: 4,
  broker: 4.5,
};

const ID_FALLBACK: Record<number, Rank> = { 1: 'specialist', 2: 'supervisor', 3: 'investment_manager', 4: 'broker' };

export function rankOf(positionName?: string | null, positionId?: number | null): Rank {
  const n = (positionName ?? '').toLowerCase();
  if (n.includes('broker')) return 'broker';
  if (n.includes('investment')) return 'investment_manager';
  if (n.includes('supervisor')) return 'supervisor';
  if (n.includes('specialist')) return 'specialist';
  return (positionId != null ? ID_FALLBACK[positionId] : undefined) ?? 'specialist';
}

export function rankLabel(rank: Rank): string {
  return RANK_LABEL[rank];
}

// Ranks a given rank may report to. Specialists/Supervisors may report to anyone above;
// an Investment Manager may only report to a Partner Broker; a Partner Broker has no upline.
export function allowedUplineRanks(rank: Rank): Rank[] {
  switch (rank) {
    case 'specialist': return ['specialist', 'supervisor', 'investment_manager', 'broker'];
    case 'supervisor': return ['specialist', 'supervisor', 'investment_manager', 'broker'];
    case 'investment_manager': return ['broker'];
    case 'broker': return [];
  }
}
