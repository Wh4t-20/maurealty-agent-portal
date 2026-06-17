-- Sales: one row per property sale (reservation) made by an agent to a client.
-- Scope note: commission amounts are STORED as entered by the encoder. The
-- gross -> net -> VAT/non-VAT computation is owned by the Accounting side, not here.
-- FK types deliberately match the parents: agents."agent_ID" is integer,
-- main_listings."listing_ID" is bigint. Identifiers are quoted (mixed-case) to
-- match the existing schema convention.

create table public.sales (
  "sale_ID"            bigint generated always as identity primary key,
  "agent_ID"           integer not null
                         references public.agents("agent_ID"),
  "listing_ID"         bigint not null
                         references public.main_listings("listing_ID"),
  client_name          text          not null,   -- the buyer
  reservation_date     date          not null,
  total_contract_price numeric(14,2) not null,   -- numeric, never float, for money
  agent_sale_seq       integer,                  -- "ika pila na": per-agent sale number
  gross_commission     numeric(14,2),            -- entered, not computed here
  net_commission       numeric(14,2),            -- entered, not computed here
  remarks              text,                     -- e.g. "third equity"
  voucher_series       text,
  created_at           timestamptz   not null default now()
);

-- Lookups: by agent (agent-sees-own report) and by listing (project rollups).
create index sales_agent_id_idx   on public.sales ("agent_ID");
create index sales_listing_id_idx on public.sales ("listing_ID");

-- RLS: mirror the project's current dev scaffolding (wide-open to anon).
-- INTENTIONAL for now. P5 hardening replaces these with admin-sees-all /
-- agent-sees-own policies once write paths are auth-gated.
alter table public.sales enable row level security;

create policy "dev anon full access on sales"
  on public.sales
  for all
  to anon, authenticated
  using (true)
  with check (true);
