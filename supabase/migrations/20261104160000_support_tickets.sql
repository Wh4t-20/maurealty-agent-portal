-- IT support tickets (the IT Support page, /support).
--
-- Any signed-in user (agent or admin) raises a ticket about a problem, a request or feedback.
-- Admins act as IT support: they review the ticket and resolve it with a note the user reads.
--
--   raised ──admin "Start review"──► in_review ──admin "Resolve" (note required)──► resolved
--                                        ▲                                             │
--                                        └──────────────── admin "Reopen" ─────────────┘
--
-- What this file adds (idempotent, safe to re-run in the SQL editor):
--   1) public.current_agent_id()     -> agent_ID of the signed-in user (used by the policies)
--   2) public.support_tickets        -> one row per ticket, with check constraints
--   3) trigger support_tickets_guard -> status flow, who/when stamps, the 3-open-tickets limit,
--                                       attachment paths, ticket details locked after raising
--   4) RLS on support_tickets. These are REAL rules, not the open dev policy of other tables:
--        read:   your own tickets; admins read every ticket
--        insert: only as yourself
--        update: admins only, and only along the flow above (see the trigger)
--        delete: nobody (tickets are a record)
--   5) private storage bucket support_attachments (screenshots): readable by the uploader and
--      admins only, shown in the app through short-lived signed URLs
--   6) realtime for support_tickets (the page refreshes by itself)
--
-- Needs 20261104120000_agent_accounts.sql first (public.current_agent_is_admin()).
-- SQL injection: nothing here builds SQL from text (no EXECUTE / format()); every value from
-- the app arrives as a bound parameter through PostgREST.
--
-- Limits repeated in the app (src/assets/classes/ticket.ts); keep both in step:
--   3 open tickets per person, 3 screenshots per ticket (5 MB each, PNG/JPG/WEBP/GIF),
--   the text lengths in the check constraints below.

-- 0) Stop early, with a clear message, if the agent accounts migration hasn't been run.
do $$
begin
  if to_regprocedure('public.current_agent_is_admin()') is null then
    raise exception 'Run supabase/migrations/20261104120000_agent_accounts.sql first: public.current_agent_is_admin() is missing.';
  end if;
end $$;

-- 1) agent_ID of the signed-in user (NULL when the login has no agents row).
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

-- 2) Tickets. Issue categories (bug, login_account, performance, data) must say how to
--    recreate the problem: steps, expected result and how often it happens. Requests
--    (feature_request, feedback, other) only need the description.
create table if not exists public.support_tickets (
  "ticket_ID"        bigint      generated always as identity primary key,  -- shown as #T-<id>
  "agent_ID"         integer     references public.agents("agent_ID") on delete set null,  -- who raised it (NULL = that agent was deleted)
  category           text        not null,
  title              text        not null,                -- the problem in one line
  area               text        not null,                -- page / feature it happened on (list in ticket.ts)
  frequency          text,                                -- every_time | sometimes | once (issues only)
  description        text        not null,                -- issues: what happened instead; requests: the details
  steps_to_reproduce text,                                -- issues only: numbered steps
  expected_result    text,                                -- issues only
  occurred_at        timestamptz,                         -- when it happened (optional, the user's estimate)
  device_info        text,                                -- browser, OS, window/screen size, filled in by the app
  attachment_paths   text[]      not null default '{}',   -- object paths in the support_attachments bucket
  status             text        not null default 'raised',
  resolution_note    text,                                -- IT support's answer; required to resolve
  reviewed_by        integer     references public.agents("agent_ID") on delete set null,  -- admin who started (or restarted) the review
  reviewed_at        timestamptz,
  resolved_by        integer     references public.agents("agent_ID") on delete set null,
  resolved_at        timestamptz,
  reopen_count       integer     not null default 0,
  reopened_at        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

comment on table  public.support_tickets is 'IT support tickets. Users raise them; admins (IT support) review and resolve them. Real RLS, see 20261104160000_support_tickets.sql.';
comment on column public.support_tickets.attachment_paths is 'Screenshots: "<auth uid>/<uuid>.<ext>" paths in the private support_attachments bucket.';
comment on column public.support_tickets.resolution_note is 'Written by the admin who resolves the ticket; shown to the user. Kept when a ticket is reopened, until the next resolution.';

-- Check constraints, dropped and re-added so re-running this file applies any change.
alter table public.support_tickets drop constraint if exists support_tickets_status_check;
alter table public.support_tickets add constraint support_tickets_status_check
  check (status in ('raised', 'in_review', 'resolved'));

alter table public.support_tickets drop constraint if exists support_tickets_category_check;
alter table public.support_tickets add constraint support_tickets_category_check
  check (category in ('bug', 'login_account', 'performance', 'data', 'feature_request', 'feedback', 'other'));

alter table public.support_tickets drop constraint if exists support_tickets_frequency_check;
alter table public.support_tickets add constraint support_tickets_frequency_check
  check (frequency is null or frequency in ('every_time', 'sometimes', 'once'));

alter table public.support_tickets drop constraint if exists support_tickets_title_check;
alter table public.support_tickets add constraint support_tickets_title_check
  check (char_length(btrim(title)) between 8 and 120);

alter table public.support_tickets drop constraint if exists support_tickets_area_check;
alter table public.support_tickets add constraint support_tickets_area_check
  check (char_length(btrim(area)) between 2 and 60);

alter table public.support_tickets drop constraint if exists support_tickets_description_check;
alter table public.support_tickets add constraint support_tickets_description_check
  check (char_length(btrim(description)) between 20 and 2000);

alter table public.support_tickets drop constraint if exists support_tickets_steps_check;
alter table public.support_tickets add constraint support_tickets_steps_check
  check (steps_to_reproduce is null or char_length(btrim(steps_to_reproduce)) between 10 and 2000);

alter table public.support_tickets drop constraint if exists support_tickets_expected_check;
alter table public.support_tickets add constraint support_tickets_expected_check
  check (expected_result is null or char_length(btrim(expected_result)) between 5 and 1000);

alter table public.support_tickets drop constraint if exists support_tickets_issue_details_check;
alter table public.support_tickets add constraint support_tickets_issue_details_check
  check (
    category not in ('bug', 'login_account', 'performance', 'data')
    or (steps_to_reproduce is not null and expected_result is not null and frequency is not null)
  );

alter table public.support_tickets drop constraint if exists support_tickets_device_info_check;
alter table public.support_tickets add constraint support_tickets_device_info_check
  check (device_info is null or char_length(device_info) <= 300);

alter table public.support_tickets drop constraint if exists support_tickets_note_check;
alter table public.support_tickets add constraint support_tickets_note_check
  check (resolution_note is null or char_length(resolution_note) <= 2000);

alter table public.support_tickets drop constraint if exists support_tickets_resolved_note_check;
alter table public.support_tickets add constraint support_tickets_resolved_note_check
  check (status <> 'resolved' or char_length(btrim(coalesce(resolution_note, ''))) >= 10);

alter table public.support_tickets drop constraint if exists support_tickets_attachments_check;
alter table public.support_tickets add constraint support_tickets_attachments_check
  check (cardinality(attachment_paths) <= 3);

create index if not exists support_tickets_agent_id_idx   on public.support_tickets ("agent_ID");
create index if not exists support_tickets_status_idx     on public.support_tickets (status);
create index if not exists support_tickets_created_at_idx on public.support_tickets (created_at desc);

-- 3) Guard trigger: the server decides the status stamps, so the app (or anyone holding the
--    anon key) can't skip a step, fake who reviewed a ticket, or edit what the user wrote.
create or replace function public.support_tickets_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid        uuid    := auth.uid();
  v_me         integer := public.current_agent_id();
  v_open_count integer;
  v_path       text;
begin
  if tg_op = 'INSERT' then
    -- Raised as the signed-in agent, whatever the app sent. Only the SQL editor or the service
    -- role (no auth.uid()) can raise a ticket for someone else.
    if v_uid is not null then
      if v_me is null then
        raise exception 'Your login is not linked to an agent record, so you can''t raise a ticket.';
      end if;
      new."agent_ID" := v_me;
    end if;

    -- Every ticket starts as Raised, with no review stamps.
    new.status          := 'raised';
    new.resolution_note := null;
    new.reviewed_by     := null;
    new.reviewed_at     := null;
    new.resolved_by     := null;
    new.resolved_at     := null;
    new.reopen_count    := 0;
    new.reopened_at     := null;
    new.created_at      := now();
    new.updated_at      := now();

    -- At most 3 open (not resolved) tickets per person. The lock stops two quick submits from
    -- both getting past the count.
    if new."agent_ID" is not null then
      perform pg_advisory_xact_lock(hashtext('support_tickets_open_limit'), new."agent_ID");
      select count(*) into v_open_count
      from public.support_tickets t
      where t."agent_ID" = new."agent_ID"
        and t.status <> 'resolved';
      if v_open_count >= 3 then
        raise exception 'You already have 3 open tickets. Wait for IT support to resolve one before raising another.';
      end if;
    end if;

    -- Screenshots must be files this user uploaded to their own folder of the bucket:
    -- "<auth uid>/<uuid>.<png|jpg|webp|gif>". (A uuid is only hex digits and dashes, so it is
    -- safe inside the pattern.)
    if v_uid is not null then
      foreach v_path in array coalesce(new.attachment_paths, '{}'::text[]) loop
        if v_path is null or v_path !~ ('^' || v_uid::text || '/[0-9a-f-]{36}\.(png|jpg|webp|gif)$') then
          raise exception 'A screenshot on this ticket was not uploaded correctly. Remove it and attach it again.';
        end if;
      end loop;
    end if;

    return new;
  end if;

  -- UPDATE ------------------------------------------------------------------------------------
  -- What the user wrote stays as written. ("agent_ID", reviewed_by and resolved_by may still
  -- become NULL: that is ON DELETE SET NULL when an agent is deleted.)
  if new.category           is distinct from old.category
  or new.title              is distinct from old.title
  or new.area               is distinct from old.area
  or new.frequency          is distinct from old.frequency
  or new.description        is distinct from old.description
  or new.steps_to_reproduce is distinct from old.steps_to_reproduce
  or new.expected_result    is distinct from old.expected_result
  or new.occurred_at        is distinct from old.occurred_at
  or new.device_info        is distinct from old.device_info
  or new.attachment_paths   is distinct from old.attachment_paths
  or new.created_at         is distinct from old.created_at
  or (new."agent_ID" is distinct from old."agent_ID" and new."agent_ID" is not null) then
    raise exception 'A ticket''s details can''t be changed after it is raised.';
  end if;

  if new.status is distinct from old.status then
    -- Stamps are set here, never taken from the app.
    new.reviewed_by  := old.reviewed_by;
    new.reviewed_at  := old.reviewed_at;
    new.resolved_by  := old.resolved_by;
    new.resolved_at  := old.resolved_at;
    new.reopen_count := old.reopen_count;
    new.reopened_at  := old.reopened_at;

    if old.status = 'raised' and new.status = 'in_review' then
      new.resolution_note := old.resolution_note;
      new.reviewed_by     := v_me;
      new.reviewed_at     := now();

    elsif old.status = 'in_review' and new.status = 'resolved' then
      if new.resolution_note is null or char_length(btrim(new.resolution_note)) < 10 then
        raise exception 'Write a resolution note (at least 10 characters) before resolving the ticket.';
      end if;
      new.resolved_by := v_me;
      new.resolved_at := now();

    elsif old.status = 'resolved' and new.status = 'in_review' then
      -- Reopened: back in review with this admin as the reviewer. The last resolution note is
      -- kept (the user can still read it) until the ticket is resolved again.
      new.resolution_note := old.resolution_note;
      new.reopen_count    := old.reopen_count + 1;
      new.reopened_at     := now();
      new.reviewed_by     := v_me;
      new.reviewed_at     := now();
      new.resolved_by     := null;
      new.resolved_at     := null;

    else
      raise exception 'A ticket moves Raised → In Review → Resolved, and only a resolved ticket can be reopened.';
    end if;

  elsif new.resolution_note is distinct from old.resolution_note
     or new.reviewed_at     is distinct from old.reviewed_at
     or new.resolved_at     is distinct from old.resolved_at
     or new.reopen_count    is distinct from old.reopen_count
     or new.reopened_at     is distinct from old.reopened_at
     or (new.reviewed_by is distinct from old.reviewed_by and new.reviewed_by is not null)
     or (new.resolved_by is distinct from old.resolved_by and new.resolved_by is not null) then
    raise exception 'Only the status of a ticket can be changed. The review details are filled in automatically.';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function public.support_tickets_guard() from public, anon, authenticated;

drop trigger if exists support_tickets_guard on public.support_tickets;
create trigger support_tickets_guard
  before insert or update on public.support_tickets
  for each row
  execute function public.support_tickets_guard();

-- 4) RLS. The (select ...) wrappers let Postgres run each function once per query, not per row.
alter table public.support_tickets enable row level security;

drop policy if exists "support_tickets read own or admin" on public.support_tickets;
create policy "support_tickets read own or admin"
  on public.support_tickets for select to authenticated
  using ("agent_ID" = (select public.current_agent_id()) or (select public.current_agent_is_admin()));

drop policy if exists "support_tickets raise as yourself" on public.support_tickets;
create policy "support_tickets raise as yourself"
  on public.support_tickets for insert to authenticated
  with check ("agent_ID" = (select public.current_agent_id()));

drop policy if exists "support_tickets admins update" on public.support_tickets;
create policy "support_tickets admins update"
  on public.support_tickets for update to authenticated
  using ((select public.current_agent_is_admin()))
  with check ((select public.current_agent_is_admin()));

-- No delete policy, and no access at all for anon (signed-out visitors).
revoke all on table public.support_tickets from anon, authenticated;
grant select, insert, update on table public.support_tickets to authenticated;

-- 5) Screenshots: a PRIVATE bucket (no public URLs). Files sit in a folder named after the
--    uploader's auth uid: "<auth uid>/<uuid>.<ext>".
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('support_attachments', 'support_attachments', false, 5242880,
        array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do update
  set public             = false,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Read (and create signed URLs): the uploader, and admins.
drop policy if exists "support_attachments read own or admin" on storage.objects;
create policy "support_attachments read own or admin"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'support_attachments'
    and ((storage.foldername(name))[1] = (select auth.uid())::text
         or (select public.current_agent_is_admin()))
  );

-- Upload: only into your own folder.
drop policy if exists "support_attachments upload own" on storage.objects;
create policy "support_attachments upload own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'support_attachments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Delete: your own uploads that no ticket uses yet (the app cleans up when saving a ticket
-- fails). Screenshots on a ticket stay with the ticket.
drop policy if exists "support_attachments delete own unused" on storage.objects;
create policy "support_attachments delete own unused"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'support_attachments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and not exists (select 1 from public.support_tickets t where name = any (t.attachment_paths))
  );

-- 6) Realtime: the IT Support page refreshes when a ticket is raised or changes status.
--    Realtime applies the RLS above, so a non-admin only hears about their own tickets.
do $$
begin
  alter publication supabase_realtime add table public.support_tickets;
exception
  when duplicate_object then null;  -- already added
  when undefined_object then null;  -- no realtime publication (local setups)
end $$;

notify pgrst, 'reload schema';
