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
};
