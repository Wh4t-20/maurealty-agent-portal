// src/services/genealogyService.ts
// Reads the agent hierarchy from the `genealogy` edge table (upline -> downline)
// and shapes it for the Genealogy page (tree) and the Sales Report (upline chain).
//
// The tree is assembled in JS from two flat fetches (all agents + all edges).
// At this scale (tens of agents) that's simpler and cheaper than a recursive
// SQL CTE. Swap to an RPC/CTE if the roster ever grows large.
import { supabase } from '../supabaseClient';
import { rankOf, rankLabel, allowedUplineRanks, type Rank } from '../utils/ranks';
import { allocatePayouts, type ChainMember, type PayoutRole } from '../utils/commissionAllocation';

// A bare agent as it appears in the hierarchy. position is resolved from the
// `positions` table when available; null while that table is unpopulated
// (the UI falls back to its own positionMap).
interface PositionData {
  position: string;
  commission_rate: number | null;
  promotion_sales_threshold?: number | null; // accumulated sales needed to be promoted INTO this position
}
export interface GenealogyAgent {
  agent_ID: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  position_ID: number | null;
  position: string | null;
  profile_url: string | null;
  commission_rate?: number | null; 
}

// A node in the tree: an agent plus its direct downlines.
export interface GenealogyNode extends GenealogyAgent {
  children: GenealogyNode[];
}

export interface GenealogyStats {
  totalAgents: number;
  teamLeaders: number;   // agents that have at least one downline
  activeTeams: number;   // root agents (no upline) = top of a team
  newThisMonth: number;  // hired in the current calendar month
}

interface AgentRow {
  agent_ID: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  position_ID: number | null;
  profile_url: string | null;
  hire_date: string | null;
}

interface Edge {
  upline_agent_ID: number;
  downline_agent_ID: number;
}

// The full editable agent record, for the edit form (prefill) and updates.
export interface AgentDetail {
  agent_ID: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  sex: string;
  birth_date: string;
  hire_date: string;
  contact_number: string;
  email_address: string;
  home_address: string;
  position_ID: number | null;
  admin_access: boolean;
  age: number;
  profile_url: string | null;
}

const AGENT_DETAIL_FIELDS =
  'agent_ID, first_name, middle_name, last_name, sex, birth_date, hire_date, ' +
  'contact_number, email_address, home_address, position_ID, admin_access, age, profile_url';

const AGENT_FIELDS = 'agent_ID, first_name, middle_name, last_name, position_ID, profile_url';

// Fetch all agents + edges + the position lookup in parallel. Shared by the
// tree and stats builders so we hit the DB once per call site.
async function fetchGraph(): Promise<{
  agents: AgentRow[];
  edges: Edge[];
  positions: Map<number, PositionData>;
}> {
  const [agentsRes, edgesRes, posResFull] = await Promise.all([
    supabase.from('agents').select(`${AGENT_FIELDS}, hire_date`),
    supabase.from('genealogy').select('upline_agent_ID, downline_agent_ID'),
    supabase.from('positions').select('position_ID, position, commission_rate, promotion_sales_threshold'),
  ]);
  // The threshold column comes with the roles migration; fall back to the old shape without it.
  let posRes: { data: any[] | null; error: any } = posResFull as any;
  if (posRes.error) {
    posRes = (await supabase.from('positions').select('position_ID, position, commission_rate')) as any;
  }

  if (agentsRes.error) throw agentsRes.error;
  if (edgesRes.error) throw edgesRes.error;
  // positions may be empty/locked down — don't hard-fail on it.
  if (posRes.error) console.warn('genealogy: positions lookup failed:', posRes.error);

  const positions = new Map<number, PositionData>();
  for (const p of posRes.data || []) {
    positions.set(p.position_ID, {
      position: p.position,
      commission_rate: p.commission_rate,
      promotion_sales_threshold: p.promotion_sales_threshold != null ? Number(p.promotion_sales_threshold) : null,
    });
  }

  return {
    agents: (agentsRes.data || []) as AgentRow[],
    edges: (edgesRes.data || []) as Edge[],
    positions,
  };
}

function toAgent(row: AgentRow, positions: Map<number, PositionData>): GenealogyAgent {
  return {
    agent_ID: row.agent_ID,
    first_name: row.first_name,
    middle_name: row.middle_name,
    last_name: row.last_name,
    position_ID: row.position_ID,
    position: row.position_ID != null ? positions.get(row.position_ID)?.position ?? null : null,
    profile_url: row.profile_url,
    commission_rate: positions.get(row.position_ID ?? -1)?.commission_rate ?? null,
  };
}


// ---------- Hierarchy rules ----------
//  - A Partner Broker has no upline.
//  - An Investment Manager can only report to a Partner Broker.
//  - Each team has at most one Property Sales Supervisor. A "team" is everything below the
//    topmost non-broker agent (a Partner Broker's direct reports each head their own team).
//  - Promoting someone to Investment Manager detaches them from a non-broker upline
//    (to Partner Broker: from any upline).
type Graph = { agents: AgentRow[]; edges: Edge[]; positions: Map<number, PositionData> };

const RANK_ORDER: Rank[] = ['specialist', 'supervisor', 'investment_manager', 'broker'];
const FALLBACK_POSITION_ID: Record<Rank, number> = { specialist: 1, supervisor: 2, investment_manager: 3, broker: 4 };

function uplineRuleError(rank: Rank, uplineRank: Rank): string | null {
  if (!allowedUplineRanks(rank).includes(uplineRank)) {
    return rank === 'broker'
      ? 'A Partner Broker cannot have an upline.'
      : 'An Investment Manager can only report to a Partner Broker.';
  }
  return null;
}

function rankOfAgent(row: AgentRow, positions: Map<number, PositionData>): Rank {
  return rankOf(row.position_ID != null ? positions.get(row.position_ID)?.position : null, row.position_ID);
}

function positionIdForRank(rank: Rank, positions: Map<number, PositionData>): number {
  for (const [id, p] of positions) if (rankOf(p.position, id) === rank) return id;
  return FALLBACK_POSITION_ID[rank];
}

// Checks where an agent may sit. `agentId` null = a new agent. When `explicit` is false the
// upline is just the one the agent already had; if a promotion makes it invalid it is dropped
// (detached) instead of failing. An explicit choice that breaks a rule throws.
function checkPlacement(
  g: Graph, agentId: number | null, positionId: number, uplineId: number | null, explicit: boolean,
): { uplineId: number | null; detached: boolean } {
  const id = agentId ?? -1;
  const rankMap = new Map<number, Rank>();
  for (const a of g.agents) rankMap.set(a.agent_ID, rankOfAgent(a, g.positions));
  const rank = rankOf(g.positions.get(positionId)?.position, positionId);
  rankMap.set(id, rank);

  if (uplineId === id) throw new Error('An agent cannot be its own upline.');

  const oldChildren = new Map<number, number[]>();
  for (const e of g.edges) oldChildren.set(e.upline_agent_ID, [...(oldChildren.get(e.upline_agent_ID) ?? []), e.downline_agent_ID]);

  // Not below one of its own descendants.
  if (uplineId != null && agentId != null) {
    const stack = [agentId];
    const seen = new Set<number>();
    while (stack.length) {
      const n = stack.pop()!;
      if (n === uplineId) throw new Error('That agent is below this one — would create a loop.');
      if (seen.has(n)) continue;
      seen.add(n);
      stack.push(...(oldChildren.get(n) ?? []));
    }
  }

  let up = uplineId;
  let detached = false;
  if (up != null) {
    const err = uplineRuleError(rank, rankMap.get(up) ?? 'specialist');
    if (err) {
      if (explicit) throw new Error(err);
      up = null;
      detached = true;
    }
  }

  // The agent's own downlines must still be allowed under its (possibly new) rank.
  const parentOf = new Map<number, number>();
  for (const e of g.edges) if (e.downline_agent_ID !== id) parentOf.set(e.downline_agent_ID, e.upline_agent_ID);
  if (up != null) parentOf.set(id, up);
  const childrenOf = new Map<number, number[]>();
  for (const [d, u] of parentOf) childrenOf.set(u, [...(childrenOf.get(u) ?? []), d]);

  for (const child of childrenOf.get(id) ?? []) {
    const err = uplineRuleError(rankMap.get(child) ?? 'specialist', rank);
    if (err) throw new Error(`${err} (a downline of this agent would break that rule).`);
  }

  // One Supervisor per team (only checked when this agent's branch contains a Supervisor).
  const subtree = (root: number): number[] => {
    const out: number[] = [];
    const stack = [root];
    const seen = new Set<number>();
    while (stack.length) {
      const n = stack.pop()!;
      if (seen.has(n)) continue;
      seen.add(n);
      out.push(n);
      stack.push(...(childrenOf.get(n) ?? []));
    }
    return out;
  };
  if (subtree(id).some(n => rankMap.get(n) === 'supervisor')) {
    let root = id;
    const guard = new Set<number>([id]);
    for (;;) {
      const p = parentOf.get(root);
      if (p == null || guard.has(p) || rankMap.get(p) === 'broker') break;
      guard.add(p);
      root = p;
    }
    const supervisors = subtree(root).filter(n => rankMap.get(n) === 'supervisor').length;
    if (supervisors > 1) throw new Error('Each team can only have one Property Sales Supervisor.');
  }

  return { uplineId: up, detached };
}

// ---------- Team insights (accumulated sales, promotion progress, override map) ----------
export interface OverrideLine {
  agent_ID: number;
  name: string;
  role: PayoutRole;
  rankLabel: string;
  pct: number;          // % of the company commission of each payment
}

export interface TeamMember {
  agent_ID: number;
  name: string;
  position_ID: number | null;
  rank: Rank;
  rankLabel: string;
  rate: number;                 // position commission rate in %
  uplineId: number | null;
  directDownlines: number;
  teamSize: number;             // everyone below, any depth
  ownSales: number;             // completed sales (contract price)
  accumulatedSales: number;     // own + everyone below
  agentSharePct: number;        // % of the company commission the agent keeps on their own sale
  overrides: OverrideLine[];    // who earns an override on this agent's sales, and how much
  nextRankLabel: string | null;
  nextPositionId: number | null;
  threshold: number | null;     // accumulated sales needed for the next rank (null = not set)
  progress: number;             // 0-100
  eligible: boolean;            // reached the threshold (an admin still confirms the promotion)
}

export interface RankPosition {
  position_ID: number;
  position: string;
  rank: Rank;
  rate: number;
  threshold: number | null;
}

export const genealogyService = {
  // Build the forest. Returns the root agents (those with no upline); each node
  // carries its direct downlines recursively. Edges pointing at unknown agents
  // are skipped defensively.
  async getTree(): Promise<GenealogyNode[]> {
    const { agents, edges, positions } = await fetchGraph();

    const nodes = new Map<number, GenealogyNode>();
    for (const a of agents) {
      nodes.set(a.agent_ID, { ...toAgent(a, positions), children: [] });
    }

    const hasUpline = new Set<number>();
    for (const e of edges) {
      const parent = nodes.get(e.upline_agent_ID);
      const child = nodes.get(e.downline_agent_ID);
      if (!parent || !child) continue; // stale/dangling edge
      parent.children.push(child);
      hasUpline.add(e.downline_agent_ID);
    }

    return [...nodes.values()].filter((n) => !hasUpline.has(n.agent_ID));
  },

  // Walk upward from an agent: [direct upline, that upline's upline, ...] up to
  // `levels` (default 2 = supervisor + manager, per the Commission doc).
  // Cycle-guarded even though the UNIQUE downline constraint should prevent loops.
  async getUplineChain(agentId: number, levels = 2): Promise<GenealogyAgent[]> {
    const { agents, edges, positions } = await fetchGraph();

    const agentById = new Map<number, AgentRow>();
    for (const a of agents) agentById.set(a.agent_ID, a);

    const uplineOf = new Map<number, number>();
    for (const e of edges) uplineOf.set(e.downline_agent_ID, e.upline_agent_ID);

    const chain: GenealogyAgent[] = [];
    const seen = new Set<number>([agentId]);
    let current = agentId;

    while (chain.length < levels) {
      const up = uplineOf.get(current);
      if (up == null || seen.has(up)) break;
      seen.add(up);
      const row = agentById.get(up);
      if (row) chain.push(toAgent(row, positions));
      current = up;
    }

    return chain;
  },

  // The seller and EVERYONE above them (nearest first), each with rank and position rate.
  // This is what the commission engine splits a payment across.
  async getRoleChain(agentId: number): Promise<{ seller: ChainMember; ancestors: ChainMember[] }> {
    const { agents, edges, positions } = await fetchGraph();

    const agentById = new Map<number, AgentRow>();
    for (const a of agents) agentById.set(a.agent_ID, a);
    const uplineOf = new Map<number, number>();
    for (const e of edges) uplineOf.set(e.downline_agent_ID, e.upline_agent_ID);

    const member = (id: number): ChainMember => {
      const row = agentById.get(id);
      const pos = row?.position_ID != null ? positions.get(row.position_ID) : undefined;
      return { agent_ID: id, rank: rankOf(pos?.position, row?.position_ID), rate: pos?.commission_rate ?? null };
    };

    const ancestors: ChainMember[] = [];
    const seen = new Set<number>([agentId]);
    let current = agentId;
    for (;;) {
      const up = uplineOf.get(current);
      if (up == null || seen.has(up) || !agentById.has(up)) break;
      seen.add(up);
      ancestors.push(member(up));
      current = up;
    }
    return { seller: member(agentId), ancestors };
  },

  // Walk downward from an agent: direct downlines first, then theirs, up to `levels`
  // generations (default 2, matching the two upline levels that earn commission).
  async getDownline(agentId: number, levels = 2): Promise<GenealogyAgent[]> {
    const { agents, edges, positions } = await fetchGraph();

    const agentById = new Map<number, AgentRow>();
    for (const a of agents) agentById.set(a.agent_ID, a);

    const downlinesOf = new Map<number, number[]>();
    for (const e of edges) {
      downlinesOf.set(e.upline_agent_ID, [...(downlinesOf.get(e.upline_agent_ID) ?? []), e.downline_agent_ID]);
    }

    const result: GenealogyAgent[] = [];
    const seen = new Set<number>([agentId]);
    let frontier = [agentId];

    for (let level = 0; level < levels; level++) {
      const next: number[] = [];
      for (const id of frontier) {
        for (const child of downlinesOf.get(id) ?? []) {
          if (seen.has(child)) continue;
          seen.add(child);
          const row = agentById.get(child);
          if (row) result.push(toAgent(row, positions));
          next.push(child);
        }
      }
      frontier = next;
    }

    return result;
  },

  // Landing-page stats, derived from the same flat fetch.
  async getStats(): Promise<GenealogyStats> {
    const { agents, edges } = await fetchGraph();

    const uplineIds = new Set<number>();
    const downlineIds = new Set<number>();
    for (const e of edges) {
      uplineIds.add(e.upline_agent_ID);
      downlineIds.add(e.downline_agent_ID);
    }

    const now = new Date();
    const newThisMonth = agents.filter((a) => {
      if (!a.hire_date) return false;
      const d = new Date(a.hire_date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;

    return {
      totalAgents: agents.length,
      teamLeaders: uplineIds.size,
      activeTeams: agents.filter((a) => !downlineIds.has(a.agent_ID)).length,
      newThisMonth,
    };
  },

  // Flat agent list, for dropdowns (e.g. picking an upline).
  async getAgents(): Promise<GenealogyAgent[]> {
    const { data, error } = await supabase.from('agents').select(AGENT_FIELDS);
    if (error) {
      console.error('Error fetching agents:', error);
      throw error;
    }
    return (data || []).map((row: any) => toAgent(row, new Map()));
  },

  // Most-recently-hired agents, for the landing "Recently Added" list.
  async getRecentAgents(limit = 5): Promise<(GenealogyAgent & { hire_date: string | null })[]> {
    const { data, error } = await supabase
      .from('agents')
      .select(`${AGENT_FIELDS}, hire_date`)
      .order('hire_date', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent agents:', error);
      throw error;
    }

    // positions are resolved lazily here; the table is usually empty so the UI
    // falls back to positionMap anyway.
    return (data || []).map((row: any) => ({
      ...toAgent(row, new Map()),
      hire_date: row.hire_date,
    }));
  },

  // Create an agent record and (optionally) attach it under an upline. The agent
  // is created WITHOUT a login (user_id null) — logins are provisioned later via
  // Supabase invite, which can't be done from the client. Admin-only in practice.
  async addAgent(
    agentData: Record<string, any>,
    uplineId?: number,
  ): Promise<{ success: boolean; agent_ID?: number }> {
    // Hierarchy rules first (broker has no upline, IM only under a broker, one supervisor per team).
    const placement = checkPlacement(await fetchGraph(), null, Number(agentData.position_ID), uplineId ?? null, true);
    uplineId = placement.uplineId ?? undefined;

    const { data, error } = await supabase
      .from('agents')
      .insert([agentData])
      .select('agent_ID')
      .single();

    if (error) {
      console.error('Error creating agent:', error);
      throw error;
    }

    const newId = data.agent_ID as number;

    if (uplineId != null) {
      const { error: edgeError } = await supabase
        .from('genealogy')
        .insert([{ upline_agent_ID: uplineId, downline_agent_ID: newId }]);

      if (edgeError) {
        // Agent row exists but the edge failed — surface it; caller can retry
        // the edge or delete the orphan agent.
        console.error('Agent created but upline link failed:', edgeError);
        throw edgeError;
      }
    }

    return { success: true, agent_ID: newId };
  },

  // Full record for the edit form (prefill).
  async getAgentById(id: number): Promise<AgentDetail> {
    const { data, error } = await supabase
      .from('agents')
      .select(AGENT_DETAIL_FIELDS)
      .eq('agent_ID', id)
      .single();
    if (error) throw error;
    return data as unknown as AgentDetail;
  },

  // Patch an existing agent's fields. Does NOT touch user_id / configs / upline;
  // upline changes go through setUpline so the genealogy edge stays consistent.
  async updateAgent(id: number, patch: Record<string, any>): Promise<void> {
    const { error } = await supabase.from('agents').update(patch).eq('agent_ID', id);
    if (error) throw error;
  },

  // Re-point an agent's upline edge. Passing null detaches it (agent becomes a
  // team root). Guards against self-parenting and against creating a cycle
  // (you can't put an agent under one of its own descendants).
  async setUpline(downlineId: number, uplineId: number | null): Promise<void> {
    if (uplineId === downlineId) throw new Error('An agent cannot be its own upline.');

    // Hierarchy rules, using the agent's current position.
    const g = await fetchGraph();
    const me = g.agents.find(a => a.agent_ID === downlineId);
    if (me?.position_ID != null) checkPlacement(g, downlineId, me.position_ID, uplineId, true);

    if (uplineId != null) {
      // Cycle guard: the proposed upline must not sit in the downline's subtree.
      const { edges } = await fetchGraph();
      const childrenOf = new Map<number, number[]>();
      for (const e of edges) {
        const arr = childrenOf.get(e.upline_agent_ID) ?? [];
        arr.push(e.downline_agent_ID);
        childrenOf.set(e.upline_agent_ID, arr);
      }
      const stack = [downlineId];
      const seen = new Set<number>();
      while (stack.length) {
        const n = stack.pop()!;
        if (n === uplineId) throw new Error('That agent is below this one — would create a loop.');
        if (seen.has(n)) continue;
        seen.add(n);
        for (const c of childrenOf.get(n) ?? []) stack.push(c);
      }
    }

    await this.replaceUplineEdge(downlineId, uplineId);
  },

  // Replace the single existing upline edge (downline is UNIQUE). No rule checks.
  async replaceUplineEdge(downlineId: number, uplineId: number | null): Promise<void> {
    const { error: delErr } = await supabase
      .from('genealogy')
      .delete()
      .eq('downline_agent_ID', downlineId);
    if (delErr) throw delErr;

    if (uplineId != null) {
      const { error: insErr } = await supabase
        .from('genealogy')
        .insert([{ upline_agent_ID: uplineId, downline_agent_ID: downlineId }]);
      if (insErr) throw insErr;
    }
  },


  // Save an agent's fields and upline together, enforcing the hierarchy rules. A promotion that
  // makes the current upline invalid detaches the agent (returned as `detached`).
  async updateAgentAndUpline(
    id: number, patch: Record<string, any>, uplineId: number | null,
  ): Promise<{ detached: boolean }> {
    const g = await fetchGraph();
    const current = g.edges.find(e => e.downline_agent_ID === id)?.upline_agent_ID ?? null;
    const me = g.agents.find(a => a.agent_ID === id);
    const positionId = Number(patch.position_ID ?? me?.position_ID);
    const placement = checkPlacement(g, id, positionId, uplineId, uplineId !== current);

    await this.updateAgent(id, patch);
    if (placement.uplineId !== current) await this.replaceUplineEdge(id, placement.uplineId);
    return { detached: placement.detached };
  },

  // Everyone with their rank, accumulated sales (own + all below), promotion progress and the
  // override split that applies to their own sales.
  async getTeamInsights(): Promise<TeamMember[]> {
    const g = await fetchGraph();
    const { data: saleRows, error } = await supabase
      .from('sales')
      .select('agent_ID, total_contract_price, status');
    if (error) throw error;

    const own = new Map<number, number>();
    for (const r of (saleRows || []) as any[]) {
      if ((r.status || '').toString().toLowerCase().trim() !== 'complete') continue;
      own.set(r.agent_ID, (own.get(r.agent_ID) ?? 0) + (Number(r.total_contract_price) || 0));
    }

    const byId = new Map(g.agents.map(a => [a.agent_ID, a] as const));
    const uplineOf = new Map<number, number>();
    const childrenOf = new Map<number, number[]>();
    for (const e of g.edges) {
      if (!byId.has(e.upline_agent_ID) || !byId.has(e.downline_agent_ID)) continue;
      uplineOf.set(e.downline_agent_ID, e.upline_agent_ID);
      childrenOf.set(e.upline_agent_ID, [...(childrenOf.get(e.upline_agent_ID) ?? []), e.downline_agent_ID]);
    }

    const name = (a: AgentRow) => `${a.first_name} ${a.last_name}`.trim();
    const chainMember = (a: AgentRow): ChainMember => ({
      agent_ID: a.agent_ID,
      rank: rankOfAgent(a, g.positions),
      rate: a.position_ID != null ? g.positions.get(a.position_ID)?.commission_rate ?? null : null,
    });

    const below = (rootId: number): number[] => {
      const out: number[] = [];
      const seen = new Set<number>([rootId]);
      const stack = [...(childrenOf.get(rootId) ?? [])];
      while (stack.length) {
        const n = stack.pop()!;
        if (seen.has(n)) continue;
        seen.add(n);
        out.push(n);
        stack.push(...(childrenOf.get(n) ?? []));
      }
      return out;
    };

    return g.agents.map((a): TeamMember => {
      const me = chainMember(a);
      const desc = below(a.agent_ID);
      const ownSales = own.get(a.agent_ID) ?? 0;
      const accumulated = ownSales + desc.reduce((sum, id) => sum + (own.get(id) ?? 0), 0);

      // Ancestors, nearest first, then the override split for one payment (raw = 100 -> percentages).
      const ancestors: ChainMember[] = [];
      const seen = new Set<number>([a.agent_ID]);
      for (let cur = uplineOf.get(a.agent_ID); cur != null && !seen.has(cur); cur = uplineOf.get(cur)) {
        seen.add(cur);
        const row = byId.get(cur);
        if (row) ancestors.push(chainMember(row));
      }
      const split = allocatePayouts(100, me, ancestors);

      const idx = RANK_ORDER.indexOf(me.rank);
      const nextRank = RANK_ORDER[idx + 1] ?? null;
      const nextPositionId = nextRank ? positionIdForRank(nextRank, g.positions) : null;
      const threshold = nextPositionId != null ? g.positions.get(nextPositionId)?.promotion_sales_threshold ?? null : null;

      return {
        agent_ID: a.agent_ID,
        name: name(a),
        position_ID: a.position_ID,
        rank: me.rank,
        rankLabel: rankLabel(me.rank),
        rate: me.rate ?? 0,
        uplineId: uplineOf.get(a.agent_ID) ?? null,
        directDownlines: (childrenOf.get(a.agent_ID) ?? []).length,
        teamSize: desc.length,
        ownSales,
        accumulatedSales: accumulated,
        agentSharePct: split[0]?.amount ?? 0,
        overrides: split.slice(1).map(p => ({
          agent_ID: p.agent_ID,
          name: byId.get(p.agent_ID) ? name(byId.get(p.agent_ID)!) : `Agent #${p.agent_ID}`,
          role: p.role,
          rankLabel: p.rankLabel,
          pct: p.amount,
        })),
        nextRankLabel: nextRank ? rankLabel(nextRank) : null,
        nextPositionId,
        threshold,
        progress: threshold ? Math.min(100, Math.round((accumulated / threshold) * 100)) : 0,
        eligible: threshold != null && threshold > 0 && accumulated >= threshold,
      };
    });
  },

  // Admin confirms a promotion to the next rank (never automatic).
  async promoteAgent(agentId: number): Promise<{ detached: boolean; newRank: string }> {
    const member = (await this.getTeamInsights()).find(m => m.agent_ID === agentId);
    if (!member) throw new Error('Agent not found.');
    if (!member.nextPositionId || !member.nextRankLabel) throw new Error('This agent is already at the top rank.');
    if (!member.eligible) throw new Error('This agent has not reached the sales needed for the next rank.');
    const { detached } = await this.updateAgentAndUpline(agentId, { position_ID: member.nextPositionId }, member.uplineId);
    return { detached, newRank: member.nextRankLabel };
  },

  // The four ranks with their rate and the editable "accumulated sales to be promoted into it".
  async getRankPositions(): Promise<RankPosition[]> {
    const { positions } = await fetchGraph();
    const list: RankPosition[] = [];
    for (const [id, p] of positions) {
      list.push({
        position_ID: id, position: p.position, rank: rankOf(p.position, id),
        rate: p.commission_rate ?? 0, threshold: p.promotion_sales_threshold ?? null,
      });
    }
    return list.sort((a, b) => RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank));
  },

  async setPromotionThreshold(positionId: number, threshold: number | null): Promise<void> {
    const { error } = await supabase
      .from('positions')
      .update({ promotion_sales_threshold: threshold })
      .eq('position_ID', positionId);
    if (error) throw error;
  },

  // Count financial/listing rows that would block a hard delete.
  async getAgentReferences(id: number): Promise<{ sales: number; listings: number; shared: number }> {
    const [salesRes, listingsRes, sharedRes] = await Promise.all([
      supabase.from('sales').select('sale_ID', { count: 'exact', head: true }).eq('agent_ID', id),
      supabase.from('main_listings').select('listing_ID', { count: 'exact', head: true }).eq('agent_ID', id),
      supabase.from('shared_listings').select('*', { count: 'exact', head: true }).eq('agent_ID', id),
    ]);
    return {
      sales: salesRes.count ?? 0,
      listings: listingsRes.count ?? 0,
      shared: sharedRes.count ?? 0,
    };
  },

  // Hard-delete an agent. BLOCKS if the agent has sales or listings (preserve the
  // financial/listing paper trail — archive instead, long term). Downlines are
  // reassigned to the deleted agent's own upline (subtree stays connected); if it
  // had no upline they become team roots. Then the agent's own edges are removed.
  async deleteAgent(id: number): Promise<void> {
    const refs = await this.getAgentReferences(id);
    if (refs.sales > 0 || refs.listings > 0 || refs.shared > 0) {
      const parts = [];
      if (refs.sales) parts.push(`${refs.sales} sale(s)`);
      if (refs.listings) parts.push(`${refs.listings} listing(s)`);
      if (refs.shared) parts.push(`${refs.shared} shared link(s)`);
      throw new Error(`Cannot delete: agent has ${parts.join(', ')}. Reassign or archive first.`);
    }

    // Find this agent's upline (the new parent for its downlines).
    const { data: upRows, error: upErr } = await supabase
      .from('genealogy')
      .select('upline_agent_ID')
      .eq('downline_agent_ID', id)
      .maybeSingle();
    if (upErr) throw upErr;
    const grandUpline = upRows?.upline_agent_ID ?? null;

    // Reassign or detach this agent's direct downlines.
    if (grandUpline != null) {
      const { error } = await supabase
        .from('genealogy')
        .update({ upline_agent_ID: grandUpline })
        .eq('upline_agent_ID', id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('genealogy').delete().eq('upline_agent_ID', id);
      if (error) throw error;
    }

    // Remove the agent's own upline edge, then the agent row.
    const { error: selfEdgeErr } = await supabase
      .from('genealogy')
      .delete()
      .eq('downline_agent_ID', id);
    if (selfEdgeErr) throw selfEdgeErr;

    const { error: delErr } = await supabase.from('agents').delete().eq('agent_ID', id);
    if (delErr) throw delErr;
  },
};
