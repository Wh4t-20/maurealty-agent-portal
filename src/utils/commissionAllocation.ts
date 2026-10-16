// Who is paid what for ONE payment of a sale.
//
// raw = the company commission of that payment ((rate / payments) x 5% x commissionable amount)
//   Agent (the seller):  raw x 3/4 x (position rate / 5)       3% -> 3/5, 3.5% -> 7/10, 4% -> 4/5, 4.5% -> 9/10
//   Overrides (raw x 3/4 x %), paid to the FIRST ancestor of each rank above the seller:
//     seller Specialist : Supervisor 10%, Investment Manager 10% (20% when the IM is the seller's direct upline), Broker 10%
//     seller Supervisor : Investment Manager 10%, Broker 10%
//     seller Investment Manager : Broker 10%
//     seller Broker : none
//   Specialists never earn an override, so a Specialist above a Specialist is skipped and the
//   Supervisor / Investment Manager / Broker above them are paid instead.
// Labels: the non-broker overrides are Upline 1, Upline 2 (nearest first); the Broker is Upline 3.
import { DEFAULT_RANK_RATE, rankLabel, type Rank } from './ranks';

export interface ChainMember {
  agent_ID: number;
  rank: Rank;
  rate?: number | null; // position commission rate in %
}

export type PayoutRole = 'Agent' | 'Upline 1' | 'Upline 2' | 'Upline 3';

export interface CommissionPayout {
  agent_ID: number;
  role: PayoutRole;
  rank: Rank;
  rankLabel: string;
  amount: number;
}

const OVERRIDE_TARGETS: Record<Rank, Rank[]> = {
  specialist: ['supervisor', 'investment_manager', 'broker'],
  supervisor: ['investment_manager', 'broker'],
  investment_manager: ['broker'],
  broker: [],
};

const r2 = (n: number) => Number(n.toFixed(2));

export function agentFactor(rank: Rank, rate?: number | null): number {
  return (3 / 4) * ((rate ?? DEFAULT_RANK_RATE[rank]) / 5);
}

// ancestors: nearest first (direct upline, then theirs, ...), all the way up.
export function allocatePayouts(raw: number, seller: ChainMember, ancestors: ChainMember[]): CommissionPayout[] {
  const out: CommissionPayout[] = [
    { agent_ID: seller.agent_ID, role: 'Agent', rank: seller.rank, rankLabel: rankLabel(seller.rank), amount: r2(raw * agentFactor(seller.rank, seller.rate)) },
  ];

  let slot = 0;
  for (const target of OVERRIDE_TARGETS[seller.rank]) {
    const index = ancestors.findIndex(a => a.rank === target);
    const up = ancestors[index];
    if (!up) continue;

    let pct = 0.1;
    if (seller.rank === 'specialist' && target === 'investment_manager' && index === 0) pct = 0.2;

    const role: PayoutRole = target === 'broker' ? 'Upline 3' : (++slot === 1 ? 'Upline 1' : 'Upline 2');
    out.push({ agent_ID: up.agent_ID, role, rank: up.rank, rankLabel: rankLabel(up.rank), amount: r2(raw * (3 / 4) * pct) });
  }
  return out;
}
