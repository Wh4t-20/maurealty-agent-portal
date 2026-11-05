-- Harden row level security (RLS): only signed-in agents can read or change the app's data.
--
-- Before this file, almost every table had an open "dev" policy (using (true) with check (true))
-- for anon / public. Anyone holding the anon key (it ships in the browser bundle) could read every
-- agent's personal details, edit or delete listings and sales, or set agents.admin_access = true
-- on their own row and become an admin. This file replaces those policies.
--
--   Signed-out visitors (anon) ......... no access to any table or bucket. A client opening a shared
--                                        listing link reads it through get_shared_listing(token),
--                                        which returns only that listing's public details, and only
--                                        while the link is valid. Listing photos keep their public URLs.
--   Signed-in users with no agent row .. nothing (a login is only useful once it is linked to an agent).
--   Agents ............................. what the app lets them do (see project-context.md, section 6).
--   Admins (agents.admin_access) ....... everything the app lets admins do.
--
-- What this file adds (idempotent, safe to re-run in the SQL editor):
--   1) helper functions used by the policies (who is signed in, may they manage this listing/sale/file)
--   2) guard triggers for the rules a policy can't express (which columns a non-admin may change):
--        agents_guard        - no one but an admin changes admin_access / position / hire date;
--                              logins (user_id) are only linked by the agent-account Edge Function
--        main_listings_guard - no self-approval; agents who don't own a listing may only move it
--                              between active and sold (recording / deleting a sale) and refresh
--                              its nearby places cache
--        commissions_guard   - a recipient may only request payment and confirm receipt
--   3) every old policy on the app tables is dropped (policies are OR-ed: one leftover open
--      policy would undo this file), then RLS is enabled and real policies are created
--   4) storage policies for the images and fact_sheets buckets (signed-in agents only)
--   5) public.get_shared_listing(token)  -> the shared listing page (anon can call it)
--   6) public.team_completed_sales()     -> Team Insights totals, so agents don't need to read
--                                           other agents' sales rows
--   7) checks that warn about any table left without RLS or with an open policy
--
-- Not changed: support_tickets and the support_attachments bucket (they already have real rules,
-- see 20261104160000_support_tickets.sql) and agent_credentials (locked, no policies).
--
-- Needs 20261104120000_agent_accounts.sql first (public.current_agent_is_admin()).
-- SQL injection: the functions take bound parameters and use no dynamic SQL. The only EXECUTE
-- statements are in the DO blocks below, and they only use names read from the system catalogs.
--
-- The whole file runs as one transaction: if anything fails, nothing changes.

begin;

-- 0) Stop early, with a clear message, if the agent accounts migration hasn't been run.
do $$
begin
  if to_regprocedure('public.current_agent_is_admin()') is null then
    raise exception 'Run supabase/migrations/20261104120000_agent_accounts.sql first: public.current_agent_is_admin() is missing.';
  end if;
end $$;

-- =============================================================================================
-- 1) Helper functions
--    SECURITY DEFINER so they can look at agents / listings / sales without being filtered by
--    the very policies that call them. search_path = '' and fully qualified names, no dynamic SQL.
-- =============================================================================================

-- agent_ID of the signed-in user (NULL when the login has no agents row).
-- Same definition as 20261104160000_support_tickets.sql; repeated so this file also works alone.
create or replace function public.current_agent_id()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select a."agent_ID" from public.agents a where a.user_id = auth.uid() limit 1;
$$;

revoke execute on function public.current_agent_id() from public, anon;
grant execute on function public.current_agent_id() to authenticated, service_role;

-- May the signed-in user change this listing's details, photos and sub-table row?
-- (Its owner, or an admin.)
create or replace function public.can_manage_listing(p_listing_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.current_agent_is_admin()
      or exists (
           select 1 from public.main_listings m
           where m."listing_ID" = p_listing_id
             and m."agent_ID" = public.current_agent_id()
         );
$$;

revoke execute on function public.can_manage_listing(bigint) from public, anon;
grant execute on function public.can_manage_listing(bigint) to authenticated;

-- May the signed-in user change this sale and its DP divisions?
-- (An admin always; the seller only while the sale is still 'pending approval', like the app.)
create or replace function public.can_edit_sale(p_sale_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.current_agent_is_admin()
      or exists (
           select 1 from public.sales s
           where s."sale_ID" = p_sale_id
             and s."agent_ID" = public.current_agent_id()
             and s.status::text = 'pending approval'
         );
$$;

revoke execute on function public.can_edit_sale(bigint) from public, anon;
grant execute on function public.can_edit_sale(bigint) to authenticated;

-- May the signed-in user upload / delete this file in the public "images" bucket?
-- The app names files "<folder>/<id>-<timestamp>[-<n>].<ext>":
--   listings/<listing_ID>-...      the listing's owner (or an admin)
--   agents/<agent_ID>-...          that agent's own profile picture (or an admin)
--   developers/, developer_promos/, payment-proofs/   admins only
create or replace function public.can_manage_image(p_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_me     integer := public.current_agent_id();
  v_folder text;
  v_id     bigint;
begin
  if v_me is null or p_name is null then
    return false;
  end if;
  if public.current_agent_is_admin() then
    return true;
  end if;

  -- One folder level and a numeric id at the start of the file name. ([0-9]{1,18} always fits a bigint.)
  v_folder := substring(p_name from '^(listings|agents)/[0-9]{1,18}-[^/]+$');
  if v_folder is null then
    return false;
  end if;
  v_id := substring(p_name from '^[a-z]+/([0-9]{1,18})-')::bigint;

  if v_folder = 'agents' then
    return v_id = v_me;
  end if;
  return exists (
    select 1 from public.main_listings m
    where m."listing_ID" = v_id and m."agent_ID" = v_me
  );
end;
$$;

revoke execute on function public.can_manage_image(text) from public, anon;
grant execute on function public.can_manage_image(text) to authenticated;

-- May the signed-in user upload / replace this fact sheet? Files sit at the bucket root as
-- "<listing_ID>-<timestamp>-<file name>": the listing's owner, or an admin.
create or replace function public.can_manage_fact_sheet(p_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_me integer := public.current_agent_id();
  v_id bigint;
begin
  if v_me is null or p_name is null then
    return false;
  end if;
  if public.current_agent_is_admin() then
    return true;
  end if;
  v_id := substring(p_name from '^([0-9]{1,18})-[^/]+$')::bigint;  -- NULL when the name doesn't match
  if v_id is null then
    return false;
  end if;
  return exists (
    select 1 from public.main_listings m
    where m."listing_ID" = v_id and m."agent_ID" = v_me
  );
end;
$$;

revoke execute on function public.can_manage_fact_sheet(text) from public, anon;
grant execute on function public.can_manage_fact_sheet(text) to authenticated;

-- =============================================================================================
-- 2) Guard triggers
--    auth.uid() is NULL for the SQL editor and for the service role (the agent-account Edge
--    Function), so those can still do anything. Errors use code 42501 (permission denied).
-- =============================================================================================

-- 2a) agents: an agent may edit their own profile and settings, but not the fields that decide
--     what they may do (admin_access, position, hire date) and never the login link (user_id).
create or replace function public.agents_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- Signed-in users have no insert policy (the Edge Function creates agents); this is a second lock.
    if new.user_id is not null then
      raise exception 'Logins are linked to agents by the agent-account Edge Function only.' using errcode = '42501';
    end if;
    return new;
  end if;

  if new.user_id is distinct from old.user_id then
    raise exception 'An agent''s login can only be changed by the agent-account Edge Function.' using errcode = '42501';
  end if;

  if new."agent_ID" is distinct from old."agent_ID" then
    raise exception 'An agent''s ID can''t be changed.' using errcode = '42501';
  end if;

  if not public.current_agent_is_admin() then
    if new.admin_access is distinct from old.admin_access
    or new."position_ID" is distinct from old."position_ID"
    or new.hire_date is distinct from old.hire_date then
      raise exception 'Only an admin can change admin access, position or hire date.' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

revoke execute on function public.agents_guard() from public, anon, authenticated;

drop trigger if exists agents_guard on public.agents;
create trigger agents_guard
  before insert or update on public.agents
  for each row
  execute function public.agents_guard();

-- 2b) main_listings: an agent can't approve their own listing, and an agent who doesn't own a
--     listing may only move it between active and sold (recording or deleting a sale) and
--     refresh its nearby places cache. Admins can change anything.
create or replace function public.main_listings_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me integer;
begin
  if auth.uid() is null or public.current_agent_is_admin() then
    return new;
  end if;
  v_me := public.current_agent_id();

  if new."agent_ID" is distinct from old."agent_ID" then
    raise exception 'Only an admin can change who a listing belongs to.' using errcode = '42501';
  end if;

  -- Status: pending -> active is the admin's approval. Agents only toggle active <-> sold.
  if new.status is distinct from old.status
     and not (old.status::text in ('active', 'sold') and new.status::text in ('active', 'sold')) then
    raise exception 'Only an admin can approve a listing or change it to that status.' using errcode = '42501';
  end if;

  -- Not the owner: everything except the status and the nearby places cache stays as written.
  if old."agent_ID" is distinct from v_me
     and (to_jsonb(new) - array['status', 'nearby_pois']) is distinct from (to_jsonb(old) - array['status', 'nearby_pois']) then
    raise exception 'Only the agent who listed this property (or an admin) can edit it.' using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke execute on function public.main_listings_guard() from public, anon, authenticated;

drop trigger if exists main_listings_guard on public.main_listings;
create trigger main_listings_guard
  before update on public.main_listings
  for each row
  execute function public.main_listings_guard();

-- 2c) commissions: a recipient who isn't an admin may only
--       approved          -> payment_requested  (with their request details), and
--       payment_released  -> received           (sets claimed / claimed_at).
--     Amounts, recipients and every other column stay as generated. The times are set here.
create or replace function public.commissions_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_open integer;
begin
  if auth.uid() is null or public.current_agent_is_admin() then
    return new;
  end if;

  if old.status = 'approved' and new.status = 'payment_requested' then
    if (to_jsonb(new) - array['status', 'requested_at', 'request_details'])
       is distinct from (to_jsonb(old) - array['status', 'requested_at', 'request_details']) then
      raise exception 'Only the status and your payment details change when you request payment.' using errcode = '42501';
    end if;
    -- Same rule as commissionService.requestPayment: earlier payments of the sale come first.
    select count(*) into v_open
    from public.commissions c
    where c."sale_ID" = old."sale_ID"
      and c."recipient_agent_ID" = old."recipient_agent_ID"
      and c.payment_no < old.payment_no
      and c.status <> 'received';
    if v_open > 0 then
      raise exception 'Receive the earlier payments of this sale before requesting this one.';
    end if;
    new.requested_at := now();
    return new;
  end if;

  if old.status = 'payment_released' and new.status = 'received' then
    if (to_jsonb(new) - array['status', 'claimed', 'claimed_at'])
       is distinct from (to_jsonb(old) - array['status', 'claimed', 'claimed_at']) then
      raise exception 'Only the status changes when you confirm a payment.' using errcode = '42501';
    end if;
    new.claimed    := true;
    new.claimed_at := now();
    return new;
  end if;

  raise exception 'Only an admin can change this commission.' using errcode = '42501';
end;
$$;

revoke execute on function public.commissions_guard() from public, anon, authenticated;

drop trigger if exists commissions_guard on public.commissions;
create trigger commissions_guard
  before update on public.commissions
  for each row
  execute function public.commissions_guard();

-- =============================================================================================
-- 3) Table policies
-- =============================================================================================

-- 3a) Drop every existing policy on these tables (the open dev policies, whatever their names).
do $$
declare
  p record;
begin
  for p in
    select pol.schemaname, pol.tablename, pol.policyname
    from pg_policies pol
    where pol.schemaname = 'public'
      and pol.tablename = any (array[
        'agents', 'positions', 'genealogy',
        'property_type', 'lot_class', 'condo_class',
        'main_listings', 'house_and_lot', 'lot_only', 'condominium', 'memorial',
        'listing_images', 'shared_listings',
        'developers', 'opening_days', 'developer_promos',
        'sales', 'sale_dp_divisions', 'commissions'
      ])
  loop
    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

-- 3b) RLS on, nothing for anon (signed-out visitors), table access for signed-in users (the
--     policies below decide which rows).
do $$
declare
  t text;
begin
  foreach t in array array[
    'agents', 'positions', 'genealogy',
    'property_type', 'lot_class', 'condo_class',
    'main_listings', 'house_and_lot', 'lot_only', 'condominium', 'memorial',
    'listing_images', 'shared_listings',
    'developers', 'opening_days', 'developer_promos',
    'sales', 'sale_dp_divisions', 'commissions'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon', t);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', t);
  end loop;
end $$;

-- Lookups are read-only for everyone.
revoke insert, update, delete on table public.property_type, public.lot_class, public.condo_class from authenticated;

-- ---------- agents ----------
-- Every agent sees the team (names on listings, sales, the genealogy tree). A login with no
-- agents row sees nothing. New agents are created by the agent-account Edge Function only.
create policy "agents read by agents"
  on public.agents for select to authenticated
  using ((select public.current_agent_id()) is not null);

create policy "agents update own or admin"
  on public.agents for update to authenticated
  using ("agent_ID" = (select public.current_agent_id()) or (select public.current_agent_is_admin()))
  with check ("agent_ID" = (select public.current_agent_id()) or (select public.current_agent_is_admin()));

create policy "agents delete by admins"
  on public.agents for delete to authenticated
  using ((select public.current_agent_is_admin()) and "agent_ID" <> (select public.current_agent_id()));

-- ---------- positions (ranks) ----------
create policy "positions read by agents"
  on public.positions for select to authenticated
  using ((select public.current_agent_id()) is not null);

create policy "positions update by admins"
  on public.positions for update to authenticated
  using ((select public.current_agent_is_admin()))
  with check ((select public.current_agent_is_admin()));

-- ---------- genealogy (upline -> downline) ----------
create policy "genealogy read by agents"
  on public.genealogy for select to authenticated
  using ((select public.current_agent_id()) is not null);

create policy "genealogy insert by admins"
  on public.genealogy for insert to authenticated
  with check ((select public.current_agent_is_admin()));

create policy "genealogy update by admins"
  on public.genealogy for update to authenticated
  using ((select public.current_agent_is_admin()))
  with check ((select public.current_agent_is_admin()));

create policy "genealogy delete by admins"
  on public.genealogy for delete to authenticated
  using ((select public.current_agent_is_admin()));

-- ---------- lookups ----------
create policy "property_type read by agents"
  on public.property_type for select to authenticated
  using ((select public.current_agent_id()) is not null);

create policy "lot_class read by agents"
  on public.lot_class for select to authenticated
  using ((select public.current_agent_id()) is not null);

create policy "condo_class read by agents"
  on public.condo_class for select to authenticated
  using ((select public.current_agent_id()) is not null);

-- ---------- main_listings ----------
-- Pending (and draft) listings are only seen by their owner and admins, like the Listings page.
create policy "main_listings read by agents"
  on public.main_listings for select to authenticated
  using (
    (select public.current_agent_id()) is not null
    and (status::text not in ('pending', 'draft')
         or "agent_ID" = (select public.current_agent_id())
         or (select public.current_agent_is_admin()))
  );

-- Listed as yourself; a non-admin's new listing waits for approval.
create policy "main_listings insert as yourself"
  on public.main_listings for insert to authenticated
  with check (
    "agent_ID" = (select public.current_agent_id())
    and (status::text = 'pending' or (select public.current_agent_is_admin()))
  );

-- Any agent may update a listing they can see (marking it sold, the places cache);
-- main_listings_guard decides which columns they may change.
create policy "main_listings update by agents"
  on public.main_listings for update to authenticated
  using (
    (select public.current_agent_id()) is not null
    and (status::text not in ('pending', 'draft')
         or "agent_ID" = (select public.current_agent_id())
         or (select public.current_agent_is_admin()))
  )
  with check ((select public.current_agent_id()) is not null);

create policy "main_listings delete own or admin"
  on public.main_listings for delete to authenticated
  using ("agent_ID" = (select public.current_agent_id()) or (select public.current_agent_is_admin()));

-- ---------- listing sub-tables and photos ----------
-- Readable together with their listing (the EXISTS runs with the reader's own listing rules);
-- written by the listing's owner or an admin.
create policy "house_and_lot read with its listing"
  on public.house_and_lot for select to authenticated
  using (exists (select 1 from public.main_listings m where m."listing_ID" = house_and_lot."listing_ID"));
create policy "house_and_lot insert own listing or admin"
  on public.house_and_lot for insert to authenticated
  with check (public.can_manage_listing("listing_ID"));
create policy "house_and_lot update own listing or admin"
  on public.house_and_lot for update to authenticated
  using (public.can_manage_listing("listing_ID"))
  with check (public.can_manage_listing("listing_ID"));
create policy "house_and_lot delete own listing or admin"
  on public.house_and_lot for delete to authenticated
  using (public.can_manage_listing("listing_ID"));

create policy "lot_only read with its listing"
  on public.lot_only for select to authenticated
  using (exists (select 1 from public.main_listings m where m."listing_ID" = lot_only."listing_ID"));
create policy "lot_only insert own listing or admin"
  on public.lot_only for insert to authenticated
  with check (public.can_manage_listing("listing_ID"));
create policy "lot_only update own listing or admin"
  on public.lot_only for update to authenticated
  using (public.can_manage_listing("listing_ID"))
  with check (public.can_manage_listing("listing_ID"));
create policy "lot_only delete own listing or admin"
  on public.lot_only for delete to authenticated
  using (public.can_manage_listing("listing_ID"));

create policy "condominium read with its listing"
  on public.condominium for select to authenticated
  using (exists (select 1 from public.main_listings m where m."listing_ID" = condominium."listing_ID"));
create policy "condominium insert own listing or admin"
  on public.condominium for insert to authenticated
  with check (public.can_manage_listing("listing_ID"));
create policy "condominium update own listing or admin"
  on public.condominium for update to authenticated
  using (public.can_manage_listing("listing_ID"))
  with check (public.can_manage_listing("listing_ID"));
create policy "condominium delete own listing or admin"
  on public.condominium for delete to authenticated
  using (public.can_manage_listing("listing_ID"));

create policy "memorial read with its listing"
  on public.memorial for select to authenticated
  using (exists (select 1 from public.main_listings m where m."listing_ID" = memorial."listing_ID"));
create policy "memorial insert own listing or admin"
  on public.memorial for insert to authenticated
  with check (public.can_manage_listing("listing_ID"));
create policy "memorial update own listing or admin"
  on public.memorial for update to authenticated
  using (public.can_manage_listing("listing_ID"))
  with check (public.can_manage_listing("listing_ID"));
create policy "memorial delete own listing or admin"
  on public.memorial for delete to authenticated
  using (public.can_manage_listing("listing_ID"));

create policy "listing_images read with its listing"
  on public.listing_images for select to authenticated
  using (exists (select 1 from public.main_listings m where m."listing_ID" = listing_images."listing_ID"));
create policy "listing_images insert own listing or admin"
  on public.listing_images for insert to authenticated
  with check (public.can_manage_listing("listing_ID"));
create policy "listing_images update own listing or admin"
  on public.listing_images for update to authenticated
  using (public.can_manage_listing("listing_ID"))
  with check (public.can_manage_listing("listing_ID"));
create policy "listing_images delete own listing or admin"
  on public.listing_images for delete to authenticated
  using (public.can_manage_listing("listing_ID"));

-- ---------- shared_listings (temporary public links) ----------
-- Signed-out visitors never read this table: they open a link through get_shared_listing().
create policy "shared_listings read by agents"
  on public.shared_listings for select to authenticated
  using ((select public.current_agent_id()) is not null);

-- Any agent may share a live listing. The link records the listing owner's id (as the app does).
create policy "shared_listings create for a live listing"
  on public.shared_listings for insert to authenticated
  with check (
    (select public.current_agent_id()) is not null
    and exists (
      select 1 from public.main_listings m
      where m."listing_ID" = shared_listings."listing_ID"
        and m."agent_ID" = shared_listings."agent_ID"
        and m.status::text not in ('pending', 'draft')
    )
  );

-- Expired links are cleaned up by whoever shares next; admins may remove any link.
create policy "shared_listings delete expired or admin"
  on public.shared_listings for delete to authenticated
  using (
    (select public.current_agent_id()) is not null
    and (expires_at < now() or (select public.current_agent_is_admin()))
  );

-- ---------- developers, office hours, promo posters ----------
-- Everyone reads them; only admins manage them (the app hides the buttons from agents).
create policy "developers read by agents"
  on public.developers for select to authenticated
  using ((select public.current_agent_id()) is not null);
create policy "developers insert by admins"
  on public.developers for insert to authenticated
  with check ((select public.current_agent_is_admin()));
create policy "developers update by admins"
  on public.developers for update to authenticated
  using ((select public.current_agent_is_admin()))
  with check ((select public.current_agent_is_admin()));
create policy "developers delete by admins"
  on public.developers for delete to authenticated
  using ((select public.current_agent_is_admin()));

create policy "opening_days read by agents"
  on public.opening_days for select to authenticated
  using ((select public.current_agent_id()) is not null);
create policy "opening_days insert by admins"
  on public.opening_days for insert to authenticated
  with check ((select public.current_agent_is_admin()));
create policy "opening_days update by admins"
  on public.opening_days for update to authenticated
  using ((select public.current_agent_is_admin()))
  with check ((select public.current_agent_is_admin()));
create policy "opening_days delete by admins"
  on public.opening_days for delete to authenticated
  using ((select public.current_agent_is_admin()));

create policy "developer_promos read by agents"
  on public.developer_promos for select to authenticated
  using ((select public.current_agent_id()) is not null);
create policy "developer_promos insert by admins"
  on public.developer_promos for insert to authenticated
  with check ((select public.current_agent_is_admin()));
create policy "developer_promos update by admins"
  on public.developer_promos for update to authenticated
  using ((select public.current_agent_is_admin()))
  with check ((select public.current_agent_is_admin()));
create policy "developer_promos delete by admins"
  on public.developer_promos for delete to authenticated
  using ((select public.current_agent_is_admin()));

-- ---------- sales ----------
-- An agent sees their own sales and the sales they earn an override on (their commission cards
-- show the sale's client, project and status); admins see every sale.
create policy "sales read own, override or admin"
  on public.sales for select to authenticated
  using (
    "agent_ID" = (select public.current_agent_id())
    or (select public.current_agent_is_admin())
    or exists (
      select 1 from public.commissions c
      where c."sale_ID" = sales."sale_ID"
        and c."recipient_agent_ID" = (select public.current_agent_id())
    )
  );

-- Recorded as the seller; a sale starts as 'pending approval' (admins choose the next status).
create policy "sales insert as yourself"
  on public.sales for insert to authenticated
  with check (
    "agent_ID" = (select public.current_agent_id())
    and (status::text = 'pending approval' or (select public.current_agent_is_admin()))
  );

-- The seller may edit and delete the sale only while it is pending approval, and can't change
-- its status; admins can always.
create policy "sales update own pending or admin"
  on public.sales for update to authenticated
  using (
    (select public.current_agent_is_admin())
    or ("agent_ID" = (select public.current_agent_id()) and status::text = 'pending approval')
  )
  with check (
    (select public.current_agent_is_admin())
    or ("agent_ID" = (select public.current_agent_id()) and status::text = 'pending approval')
  );

create policy "sales delete own pending or admin"
  on public.sales for delete to authenticated
  using (
    (select public.current_agent_is_admin())
    or ("agent_ID" = (select public.current_agent_id()) and status::text = 'pending approval')
  );

-- ---------- sale_dp_divisions ----------
create policy "sale_dp_divisions read with its sale"
  on public.sale_dp_divisions for select to authenticated
  using (exists (select 1 from public.sales s where s."sale_ID" = sale_dp_divisions."sale_ID"));
create policy "sale_dp_divisions insert for an editable sale"
  on public.sale_dp_divisions for insert to authenticated
  with check (public.can_edit_sale("sale_ID"));
create policy "sale_dp_divisions update for an editable sale"
  on public.sale_dp_divisions for update to authenticated
  using (public.can_edit_sale("sale_ID"))
  with check (public.can_edit_sale("sale_ID"));
create policy "sale_dp_divisions delete for an editable sale"
  on public.sale_dp_divisions for delete to authenticated
  using (public.can_edit_sale("sale_ID"));

-- ---------- commissions (commission tabs) ----------
-- Agents see the tabs they receive; admins see every tab, generate them (insert) and remove
-- them when a sale is cancelled. commissions_guard limits what a recipient may change.
create policy "commissions read own or admin"
  on public.commissions for select to authenticated
  using ("recipient_agent_ID" = (select public.current_agent_id()) or (select public.current_agent_is_admin()));

create policy "commissions insert by admins"
  on public.commissions for insert to authenticated
  with check ((select public.current_agent_is_admin()));

create policy "commissions update own or admin"
  on public.commissions for update to authenticated
  using ("recipient_agent_ID" = (select public.current_agent_id()) or (select public.current_agent_is_admin()))
  with check ("recipient_agent_ID" = (select public.current_agent_id()) or (select public.current_agent_is_admin()));

create policy "commissions delete by admins"
  on public.commissions for delete to authenticated
  using ((select public.current_agent_is_admin()));

-- =============================================================================================
-- 4) Storage: the public "images" bucket and the "fact_sheets" bucket.
--    Both stay PUBLIC buckets, so their files still open by URL for anyone (that is how the
--    shared listing page shows its photos). These policies only control uploads and deletes
--    (and the reads the Storage API needs while doing them). support_attachments is unchanged.
-- =============================================================================================

-- The old open policies, by the names in the policy export of 2026-11-05.
drop policy if exists "Allow all public users to delete images 1ffg0oo_0" on storage.objects;
drop policy if exists "Allow all public users to delete images 1ffg0oo_1" on storage.objects;
drop policy if exists "Allow all users to upload fact sheet 1es9u07_0" on storage.objects;
drop policy if exists "Allow public uploads (need to change later) 1ffg0oo_0" on storage.objects;
drop policy if exists "Allow user to see shit 1es9u07_0" on storage.objects;
drop policy if exists "allow anon inserts during dev 1ffg0oo_0" on storage.objects;

-- And any other policy on these two buckets (for example one added later in the dashboard).
do $$
declare
  p record;
begin
  for p in
    select pol.policyname
    from pg_policies pol
    where pol.schemaname = 'storage'
      and pol.tablename = 'objects'
      and (coalesce(pol.qual, '') ~ '''(images|fact_sheets)''::text'
           or coalesce(pol.with_check, '') ~ '''(images|fact_sheets)''::text')
  loop
    execute format('drop policy %I on storage.objects', p.policyname);
  end loop;
end $$;

-- images: listing photos, profile pictures, developer pictures, promo posters, payment proofs.
create policy "images read by agents"
  on storage.objects for select to authenticated
  using (bucket_id = 'images' and (select public.current_agent_id()) is not null);

create policy "images upload own or admin"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'images' and public.can_manage_image(name));

create policy "images delete own or admin"
  on storage.objects for delete to authenticated
  using (bucket_id = 'images' and public.can_manage_image(name));

-- fact_sheets: uploaded with upsert, so the Storage API also needs select and update.
create policy "fact_sheets read by agents"
  on storage.objects for select to authenticated
  using (bucket_id = 'fact_sheets' and (select public.current_agent_id()) is not null);

create policy "fact_sheets upload own listing or admin"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'fact_sheets' and public.can_manage_fact_sheet(name));

create policy "fact_sheets update own listing or admin"
  on storage.objects for update to authenticated
  using (bucket_id = 'fact_sheets' and public.can_manage_fact_sheet(name))
  with check (bucket_id = 'fact_sheets' and public.can_manage_fact_sheet(name));

-- =============================================================================================
-- 5) The shared listing page (/shared/listing/:token), for signed-out clients.
--    Returns the listing behind a valid, unexpired link that isn't pending or a draft, with only
--    what the page shows. The commission, the incentives, the fact sheet and the agent's contact
--    details are never returned. The token is the link's random uuid (122 random bits), so links
--    can't be guessed, and the shared_listings table itself stays closed to signed-out visitors.
--    Same JSON shape as the old shared_listings + main_listings embed, so the page barely changed.
-- =============================================================================================
create or replace function public.get_shared_listing(p_token uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_share   public.shared_listings%rowtype;
  v_listing public.main_listings%rowtype;
begin
  select * into v_share from public.shared_listings s where s.share_id = p_token;
  if not found then
    raise exception 'This shared link is invalid or has been removed.';
  end if;

  if v_share.expires_at <= now() then
    raise exception 'This shared link has expired.';
  end if;

  select * into v_listing from public.main_listings m where m."listing_ID" = v_share."listing_ID";
  if not found or v_listing.status::text in ('pending', 'draft') then
    raise exception 'This listing is not yet available for viewing.';
  end if;

  return jsonb_build_object(
    'share_id',   v_share.share_id,
    'expires_at', v_share.expires_at,
    'main_listings', jsonb_build_object(
      'listing_ID',       v_listing."listing_ID",
      'listing_title',    v_listing.listing_title,
      'property_type_ID', v_listing."property_type_ID",
      'price',            v_listing.price,
      'max_price',        v_listing.max_price,
      'is_bulk',          v_listing.is_bulk,
      'location',         v_listing.location,
      'longitude',        v_listing.longitude,
      'latitude',         v_listing.latitude,
      'description',      v_listing.description,
      'faq',              v_listing.faq,
      'created_at',       v_listing.created_at,
      'nearby_pois',      v_listing.nearby_pois,
      'house_and_lot', (select to_jsonb(h) from public.house_and_lot h where h."listing_ID" = v_listing."listing_ID" limit 1),
      'lot_only',      (select to_jsonb(l) from public.lot_only l where l."listing_ID" = v_listing."listing_ID" limit 1),
      'condominium',   (select to_jsonb(c) from public.condominium c where c."listing_ID" = v_listing."listing_ID" limit 1),
      'memorial',      (select to_jsonb(r) from public.memorial r where r."listing_ID" = v_listing."listing_ID" limit 1),
      'listing_images', coalesce((
        select jsonb_agg(jsonb_build_object('image_url', i.image_url, 'display_order', i.display_order)
                         order by i.display_order nulls last)
        from public.listing_images i
        where i."listing_ID" = v_listing."listing_ID"
      ), '[]'::jsonb),
      'agents', (
        select jsonb_build_object('first_name', a.first_name, 'last_name', a.last_name)
        from public.agents a where a."agent_ID" = v_listing."agent_ID"
      ),
      'developers', (
        select jsonb_build_object('name', d.name)
        from public.developers d where d."dev_ID" = v_listing."dev_ID"
      )
    )
  );
end;
$$;

revoke execute on function public.get_shared_listing(uuid) from public;
grant execute on function public.get_shared_listing(uuid) to anon, authenticated;

-- =============================================================================================
-- 6) Team Insights: each agent's completed sales (sum of contract prices), the only part of
--    other agents' sales the Genealogy page needs. Agents can no longer read those sales rows.
-- =============================================================================================
create or replace function public.team_completed_sales()
returns table ("agent_ID" integer, completed_sales numeric)
language sql
stable
security definer
set search_path = ''
as $$
  select s."agent_ID", coalesce(sum(s.total_contract_price), 0)::numeric
  from public.sales s
  where public.current_agent_id() is not null
    and s.status::text = 'complete'
  group by s."agent_ID";
$$;

revoke execute on function public.team_completed_sales() from public, anon;
grant execute on function public.team_completed_sales() to authenticated;

-- =============================================================================================
-- 7) Checks: warn (they don't fail the file) about anything this file couldn't cover.
-- =============================================================================================
do $$
declare
  r record;
begin
  -- Tables in public with RLS switched off are open to anyone with the anon key.
  for r in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
  loop
    raise warning 'Table public.% has RLS switched off. Enable it and add policies.', r.relname;
  end loop;

  -- Policies that still let signed-out visitors (anon / public) in.
  for r in
    select pol.schemaname, pol.tablename, pol.policyname
    from pg_policies pol
    where pol.schemaname in ('public', 'storage')
      and (pol.roles && array['anon', 'public']::name[])
  loop
    raise warning 'Policy "%" on %.% is open to signed-out visitors. Check it.', r.policyname, r.schemaname, r.tablename;
  end loop;
end $$;

notify pgrst, 'reload schema';

commit;
