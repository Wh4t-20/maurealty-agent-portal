-- Sales payment scheme + DP divisions + commission tabs (combined migration).
-- Safe to run on a fresh database or on one that already ran the two earlier
-- drafts (20261014120000 / 20261014130000): every step is idempotent.
--
-- Developer and Project are NOT stored on sales: a sale points to its listing
-- (project) and the listing points to its developer.
-- The "division rates must add up to dp_rate" rule is enforced in
-- salesService.saveDpDivisions, not in the database.

-- 1) Sales: financing + payment scheme.
--    Older sales keep NULLs and get no commission tabs.
alter table public.sales
  add column if not exists financing         text
    check (financing in ('Pag-ibig', 'Banking', 'In-House with Interest')),
  add column if not exists payment_scheme    text
    check (payment_scheme in ('DP', 'Spot-Cash')),
  add column if not exists dp_rate           numeric(5,2)
    check (dp_rate > 0 and dp_rate <= 100),   -- % of contract price; NULL for Spot-Cash
  add column if not exists dp_amount         numeric(14,2),  -- total_contract_price * dp_rate
  add column if not exists remaining_balance numeric(14,2);  -- total_contract_price - dp_amount

-- 1b) Date a sale was marked Complete (the Dashboard counts it as sold in that month).
alter table public.sales add column if not exists completed_at timestamptz;
update public.sales set completed_at = created_at where status = 'complete' and completed_at is null;

-- 2) DP divisions, as agreed by the developer and the customer.
--    One payment = one commission tab (12 months = 12 tabs, 6 quarters = 6 tabs).
create table if not exists public.sale_dp_divisions (
  "division_ID"  bigint generated always as identity primary key,
  "sale_ID"      bigint not null references public.sales("sale_ID") on delete cascade,
  division_no    integer       not null,
  rate           numeric(5,2)  not null check (rate > 0 and rate <= 100),  -- % of contract price
  payable_count  integer       not null check (payable_count > 0),         -- number of payments
  payable_unit   text          not null default 'months'
                   check (payable_unit in ('months', 'quarters', 'years')),
  due_date_start date          not null,
  due_date_end   date          not null,
  created_at     timestamptz   not null default now(),
  check (due_date_end >= due_date_start),
  unique ("sale_ID", division_no)
);

-- If the table came from the earlier draft, bring it up to date.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'sale_dp_divisions' and column_name = 'payable_months'
  ) then
    alter table public.sale_dp_divisions rename column payable_months to payable_count;
  end if;
end $$;

alter table public.sale_dp_divisions
  add column if not exists payable_unit text not null default 'months'
    check (payable_unit in ('months', 'quarters', 'years'));

create index if not exists sale_dp_divisions_sale_id_idx on public.sale_dp_divisions ("sale_ID");

-- 3) Commission tabs: generated when a sale is approved (status moves out of
--    'pending approval'). One row per payment per recipient: the selling agent,
--    their upline 1, and upline 1's upline (upline 2). Amounts come from
--    commissionService.calculateSchedule.
create table if not exists public.commissions (
  "commission_ID"      bigint generated always as identity primary key,
  "sale_ID"            bigint  not null references public.sales("sale_ID") on delete cascade,
  "recipient_agent_ID" integer not null references public.agents("agent_ID"),
  role                 text    not null check (role in ('Agent', 'Upline 1', 'Upline 2')),
  payment_no           integer not null,
  due_date             date    not null,
  amount               numeric(14,2) not null,
  claimed              boolean not null default false,
  claimed_at           timestamptz,
  created_at           timestamptz not null default now(),
  unique ("sale_ID", role, payment_no)   -- makes generation safe to re-run
);

-- Added later; kept idempotent so re-running this file upgrades an existing table.
--   admin_approved: an admin approves each tab before its recipient can claim it.
--   is_balance:     the single tab for the remaining balance (100% - DP rate).
alter table public.commissions
  add column if not exists admin_approved boolean not null default false,
  add column if not exists approved_at    timestamptz,
  add column if not exists is_balance     boolean not null default false;

create index if not exists commissions_sale_id_idx   on public.commissions ("sale_ID");
create index if not exists commissions_recipient_idx on public.commissions ("recipient_agent_ID");

-- 4) RLS: same wide-open dev policy as public.sales (tighten before go-live).
alter table public.sale_dp_divisions enable row level security;
drop policy if exists "dev anon full access on sale_dp_divisions" on public.sale_dp_divisions;
create policy "dev anon full access on sale_dp_divisions"
  on public.sale_dp_divisions for all to anon, authenticated
  using (true) with check (true);

alter table public.commissions enable row level security;
drop policy if exists "dev anon full access on commissions" on public.commissions;
create policy "dev anon full access on commissions"
  on public.commissions for all to anon, authenticated
  using (true) with check (true);

-- ==========================================================================
-- 5) Roles, ranks and role-based commissions
-- ==========================================================================

-- 5a) Positions: the four ranks and their rates. Agent commission =
--     per-payment company commission x 3/4 x (rate / 5), so 3% -> 3/5,
--     3.5% -> 7/10, 4% -> 4/5, 4.5% -> 9/10.
alter table public.positions
  add column if not exists promotion_sales_threshold numeric(16,2);  -- accumulated sales needed to be promoted INTO this rank (NULL = not set)

update public.positions set commission_rate = 3   where position ilike '%specialist%';
update public.positions set commission_rate = 3.5 where position ilike '%supervisor%';
update public.positions set commission_rate = 4   where position ilike '%investment%';
update public.positions set commission_rate = 4.5 where position ilike '%broker%';

do $$
begin
  if not exists (select 1 from public.positions where position ilike '%broker%') then
    begin
      insert into public.positions (position, commission_rate) values ('Partner Broker', 4.5);
    exception when others then
      -- positions.position_ID has no default: pick the next id ourselves.
      insert into public.positions ("position_ID", position, commission_rate)
        select coalesce(max("position_ID"), 0) + 1, 'Partner Broker', 4.5 from public.positions;
    end;
  end if;
end $$;

-- 5b) Sales: the commission rate (%) the gross commission is computed from,
--     and the Deferred-Cash payment scheme (12 monthly installments).
alter table public.sales
  add column if not exists commission_rate numeric(5,2);

do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.sales'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%payment_scheme%'
  loop
    execute format('alter table public.sales drop constraint %I', c.conname);
  end loop;
  alter table public.sales
    add constraint sales_payment_scheme_check
    check (payment_scheme in ('DP', 'Spot-Cash', 'Deferred-Cash'));
end $$;

-- 5c) Commissions: a third upline slot (the Partner Broker) and the recipient's rank
--     at the time the tab was generated.
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.commissions'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%role%'
  loop
    execute format('alter table public.commissions drop constraint %I', c.conname);
  end loop;
  alter table public.commissions
    add constraint commissions_role_check
    check (role in ('Agent', 'Upline 1', 'Upline 2', 'Upline 3'));
end $$;

alter table public.commissions add column if not exists recipient_rank text;

-- 5d) Realtime: lets the Dashboard / Commissions / Genealogy refresh by themselves.
do $$
declare t text;
begin
  foreach t in array array['sales', 'commissions', 'main_listings', 'genealogy', 'agents'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
             when undefined_object then null;
    end;
  end loop;
end $$;

notify pgrst, 'reload schema';

-- ==========================================================================
-- 6) Commission payment flow
--    pending_approval -> approved -> payment_requested -> payment_released -> received
--    (admin approves; the agent requests payment with their details; the admin releases
--    payment with proof images; the agent confirms receipt, which marks the tab claimed.)
--    `claimed` / `claimed_at` / `admin_approved` stay in step so older queries keep working.
-- ==========================================================================
alter table public.commissions
  add column if not exists status          text not null default 'pending_approval',
  add column if not exists requested_at    timestamptz,
  add column if not exists request_details jsonb,        -- name + sale details the agent submitted
  add column if not exists released_at     timestamptz,
  add column if not exists released_by     integer references public.agents("agent_ID"),
  add column if not exists proof_urls      text[] not null default '{}';  -- proof of payment / receipt / voucher images (bucket "images", folder payment-proofs/)

do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.commissions'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%pending_approval%'
  loop
    execute format('alter table public.commissions drop constraint %I', c.conname);
  end loop;
  alter table public.commissions
    add constraint commissions_status_check
    check (status in ('pending_approval', 'approved', 'payment_requested', 'payment_released', 'received'));
end $$;

-- Bring existing rows into the new statuses (only rows still on the default).
update public.commissions set status = 'received'
  where claimed = true and status = 'pending_approval';
update public.commissions set status = 'approved'
  where claimed = false and admin_approved = true and status = 'pending_approval';

create index if not exists commissions_status_idx on public.commissions (status);

notify pgrst, 'reload schema';

-- ==========================================================================
-- 7) Sales: the commissionable amount the agent enters (can differ from the contract
--    price because of taxes and policies). Gross commission = commissionable amount x rate.
-- ==========================================================================
alter table public.sales add column if not exists commissionable_amount numeric(14,2);

notify pgrst, 'reload schema';
