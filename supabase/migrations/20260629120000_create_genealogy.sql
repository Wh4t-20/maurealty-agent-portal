-- Genealogy: the agent upline/downline hierarchy as an edge list.
-- One row = one "this agent reports to that agent" relationship.
-- downline_agent_ID is UNIQUE: each agent has at most one upline (single-sponsor
-- MLM-style tree). The root(s) of the tree are agents that never appear as a
-- downline. Both FKs are integer to match agents."agent_ID".
--
-- NOTE: this table already exists on the remote (created outside migrations).
-- This file backfills it into version control so a fresh environment is
-- reproducible. It is NOT meant to be re-applied to the current remote.

create table public.genealogy (
  "relationship_ID"  bigint generated always as identity primary key,
  "upline_agent_ID"  integer not null
                       references public.agents("agent_ID"),
  "downline_agent_ID" integer not null unique
                       references public.agents("agent_ID"),
  created_at         timestamptz not null default now()
);

-- Upline lookups (walk a downline up to its sponsor). downline already has a
-- unique index from the constraint above.
create index genealogy_upline_idx on public.genealogy ("upline_agent_ID");

-- RLS: mirror the project's current dev scaffolding (wide-open to anon).
-- INTENTIONAL for now. Hardening (admin-sees-all / agent-sees-own) is deferred.
alter table public.genealogy enable row level security;

create policy "dev anon full access on genealogy"
  on public.genealogy
  for all
  to anon, authenticated
  using (true)
  with check (true);
