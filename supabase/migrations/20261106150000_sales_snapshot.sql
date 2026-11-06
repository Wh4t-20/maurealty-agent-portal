-- Keep each sale's upline and listing incentives as they were when the sale was recorded.
--
-- Until now the Sales Report read both live: the upline from today's genealogy and the incentives
-- from today's listing. Moving an agent to another upline, or editing a listing's incentives,
-- silently rewrote every past sale's details (and the CSV export).
--
-- What this file adds (idempotent, safe to re-run in the SQL editor):
--   1) sales.agent_incentive, sales.realty_incentive (text) and sales.upline_snapshot (jsonb:
--      the seller's upline chain, nearest first, 2 levels, each
--      { agent_ID, first_name, middle_name, last_name, position_ID, position }).
--   2) public.sale_upline_snapshot(agent_id): builds that chain from the genealogy edges.
--   3) Backfill: sales recorded before this file get today's values (the best that is known),
--      which freezes them from now on.
--   4) Trigger sales_snapshot (before insert or update): fills the three columns from the listing
--      and the genealogy when a sale is recorded, and keeps them unchanged on every later update.
--      The values come from the database, never from the browser, so they can't be forged.
--
-- The commission tabs are not affected: they are still generated from the chain at approval time
-- (project-context.md 7.11), as before. Needs no other migration first.

-- 1) Columns -------------------------------------------------------------------------------
alter table public.sales
  add column if not exists agent_incentive  text,
  add column if not exists realty_incentive text,
  add column if not exists upline_snapshot  jsonb;

comment on column public.sales.agent_incentive  is 'Listing agent incentive when the sale was recorded (sales_snapshot trigger).';
comment on column public.sales.realty_incentive is 'Listing realty incentive when the sale was recorded (sales_snapshot trigger).';
comment on column public.sales.upline_snapshot  is 'Seller''s upline chain (nearest first, 2 levels) when the sale was recorded (sales_snapshot trigger).';

-- 2) Upline chain ---------------------------------------------------------------------------
create or replace function public.sale_upline_snapshot(p_agent_id integer)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_chain   jsonb := '[]'::jsonb;
  v_current integer := p_agent_id;
  v_seen    integer[] := array[p_agent_id];
  v_up      integer;
  v_agent   record;
begin
  -- Two levels, like the Sale Details popup. Cycle-guarded (the UNIQUE downline edge should
  -- already prevent loops).
  for i in 1..2 loop
    v_up := null;
    select g."upline_agent_ID" into v_up
      from public.genealogy g
     where g."downline_agent_ID" = v_current;
    exit when v_up is null or v_up = any(v_seen);

    select a."agent_ID", a.first_name, a.middle_name, a.last_name, a."position_ID", p.position
      into v_agent
      from public.agents a
      left join public.positions p on p."position_ID" = a."position_ID"
     where a."agent_ID" = v_up;
    exit when not found;

    v_chain := v_chain || jsonb_build_array(jsonb_build_object(
      'agent_ID',    v_agent."agent_ID",
      'first_name',  v_agent.first_name,
      'middle_name', v_agent.middle_name,
      'last_name',   v_agent.last_name,
      'position_ID', v_agent."position_ID",
      'position',    v_agent.position));
    v_seen    := v_seen || v_up;
    v_current := v_up;
  end loop;
  return v_chain;
end;
$$;

-- Only the trigger below (which runs as the owner) uses it.
revoke execute on function public.sale_upline_snapshot(integer) from public, anon, authenticated;

-- 3) Backfill (before the trigger exists, so the update isn't kept back by it) ----------------
drop trigger if exists sales_snapshot on public.sales;

update public.sales s
   set agent_incentive  = l.agent_incentive,
       realty_incentive = l.realty_incentive,
       upline_snapshot  = public.sale_upline_snapshot(s."agent_ID")
  from public.main_listings l
 where l."listing_ID" = s."listing_ID"
   and s.upline_snapshot is null;

-- A sale whose listing is gone: at least freeze the upline.
update public.sales s
   set upline_snapshot = public.sale_upline_snapshot(s."agent_ID")
 where s.upline_snapshot is null;

-- 4) Trigger --------------------------------------------------------------------------------
create or replace function public.sales_snapshot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    -- Taken once, when the sale was recorded. Edits (including an admin's) keep it.
    new.agent_incentive  := old.agent_incentive;
    new.realty_incentive := old.realty_incentive;
    new.upline_snapshot  := old.upline_snapshot;
    return new;
  end if;

  -- INSERT: whatever the browser sent for these columns is replaced.
  new.agent_incentive  := null;
  new.realty_incentive := null;
  select l.agent_incentive, l.realty_incentive
    into new.agent_incentive, new.realty_incentive
    from public.main_listings l
   where l."listing_ID" = new."listing_ID";
  new.upline_snapshot := public.sale_upline_snapshot(new."agent_ID");
  return new;
end;
$$;

revoke execute on function public.sales_snapshot() from public, anon, authenticated;

create trigger sales_snapshot
  before insert or update on public.sales
  for each row execute function public.sales_snapshot();

notify pgrst, 'reload schema';

-- Check: every sale has a snapshot (0), and the trigger exists (1).
select (select count(*) from public.sales where upline_snapshot is null) as sales_without_snapshot,
       (select count(*) from pg_trigger where tgname = 'sales_snapshot' and tgrelid = 'public.sales'::regclass) as trigger_count;
