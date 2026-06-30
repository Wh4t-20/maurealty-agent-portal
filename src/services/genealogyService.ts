// src/services/genealogyService.ts
// Reads the agent hierarchy from the `genealogy` edge table (upline -> downline)
// and shapes it for the Genealogy page (tree) and the Sales Report (upline chain).
//
// The tree is assembled in JS from two flat fetches (all agents + all edges).
// At this scale (tens of agents) that's simpler and cheaper than a recursive
// SQL CTE. Swap to an RPC/CTE if the roster ever grows large.
import { supabase } from '../supabaseClient';

// A bare agent as it appears in the hierarchy. position is resolved from the
// `positions` table when available; null while that table is unpopulated
// (the UI falls back to its own positionMap).
export interface GenealogyAgent {
  agent_ID: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  position_ID: number | null;
  position: string | null;
  profile_url: string | null;
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
  positions: Map<number, string>;
}> {
  const [agentsRes, edgesRes, posRes] = await Promise.all([
    supabase.from('agents').select(`${AGENT_FIELDS}, hire_date`),
    supabase.from('genealogy').select('upline_agent_ID, downline_agent_ID'),
    supabase.from('positions').select('position_ID, position'),
  ]);

  if (agentsRes.error) throw agentsRes.error;
  if (edgesRes.error) throw edgesRes.error;
  // positions may be empty/locked down — don't hard-fail on it.
  if (posRes.error) console.warn('genealogy: positions lookup failed:', posRes.error);

  const positions = new Map<number, string>();
  for (const p of posRes.data || []) positions.set(p.position_ID, p.position);

  return {
    agents: (agentsRes.data || []) as AgentRow[],
    edges: (edgesRes.data || []) as Edge[],
    positions,
  };
}

function toAgent(row: AgentRow, positions: Map<number, string>): GenealogyAgent {
  return {
    agent_ID: row.agent_ID,
    first_name: row.first_name,
    middle_name: row.middle_name,
    last_name: row.last_name,
    position_ID: row.position_ID,
    position: row.position_ID != null ? positions.get(row.position_ID) ?? null : null,
    profile_url: row.profile_url,
  };
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

    // Replace the single existing upline edge (downline is UNIQUE).
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
