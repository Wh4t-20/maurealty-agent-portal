-- Agent accounts: logins are created automatically when an admin adds an agent.
--
-- Before this, an admin added the agent on the Genealogy page (agents.user_id = null), then
-- someone created the login under Authentication > Users and pasted its UID into
-- agents.user_id by hand. Now the `agent-account` Edge Function
-- (supabase/functions/agent-account) creates the Supabase Auth user, the agents row and the
-- upline edge together, and keeps an encrypted copy of the agent's INITIAL password so admins
-- can reveal it (eye icon) until the agent changes it.
--
-- What this file adds (idempotent, safe to re-run in the SQL editor):
--   1) a Vault secret that encrypts the stored initial passwords
--   2) public.agent_credentials (locked: no policies, only the functions below can read it)
--   3) public.current_agent_is_admin()                 -> used by the functions below
--   4) public.store_agent_initial_password(...)        -> service role only (the Edge Function)
--   5) public.admin_get_agent_login(agent, reveal)     -> admins: login status / reveal password
--   6) public.current_agent_needs_password_change()    -> Dashboard reminder for the signed-in agent
--   7) trigger on auth.users: a password change marks it changed and deletes the stored copy
--
-- The login password itself is only ever stored by Supabase Auth (bcrypt hash in auth.users).
-- No function here builds SQL from text (no EXECUTE / format()), so every argument is bound
-- as a parameter and can't inject SQL.

create extension if not exists pgcrypto with schema extensions;

-- 1) Encryption key for the stored initial passwords, kept in Supabase Vault (encrypted at rest).
--    Created once; re-running this file keeps the existing key, so stored passwords stay readable.
--    If this fails with "schema vault does not exist", enable Vault under
--    Dashboard > Integrations > Vault and run the file again.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'agent_password_key') then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'agent_password_key',
      'Encrypts agents'' initial passwords in public.agent_credentials. Do not delete or rotate: stored passwords become unreadable.'
    );
  end if;
end $$;

-- 2) One row per agent whose login was created by the app.
--    No row = the login was made by hand before this feature (its password can't be shown),
--    or the agent has no login at all.
create table if not exists public.agent_credentials (
  "agent_ID"           integer     primary key references public.agents("agent_ID") on delete cascade,
  user_id              uuid        not null unique references auth.users(id) on delete cascade,
  initial_password_enc bytea,                 -- pgp_sym_encrypt(initial password); NULL once the agent changes it
  password_changed_at  timestamptz,           -- NULL = the agent still uses the initial password
  created_by           integer     references public.agents("agent_ID") on delete set null, -- admin who created the login
  created_at           timestamptz not null default now()
);

-- RLS on with NO policies on purpose (unlike the open dev policy on the other tables):
-- anon and authenticated can't select, insert, update or delete here. Only the SECURITY DEFINER
-- functions below and the service role (the Edge Function) can touch it.
alter table public.agent_credentials enable row level security;
revoke all on table public.agent_credentials from anon, authenticated;

-- 3) Is the signed-in user an admin? (agents.admin_access of the row linked to auth.uid())
create or replace function public.current_agent_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select a.admin_access from public.agents a where a.user_id = auth.uid() limit 1),
    false
  );
$$;

revoke execute on function public.current_agent_is_admin() from public, anon;
grant execute on function public.current_agent_is_admin() to authenticated, service_role;

-- 4) Save (or replace) the encrypted initial password of a login the Edge Function just created.
--    Service role only: a signed-in user can't call it.
create or replace function public.store_agent_initial_password(
  p_agent_id   integer,
  p_user_id    uuid,
  p_password   text,
  p_created_by integer default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_key text;
begin
  if p_password is null or length(p_password) < 8 or length(p_password) > 72 then
    raise exception 'The initial password must be 8 to 72 characters long.';
  end if;

  select s.decrypted_secret into v_key
  from vault.decrypted_secrets s
  where s.name = 'agent_password_key';

  if v_key is null then
    raise exception 'agent_password_key is missing from Vault. Re-run the agent accounts migration.';
  end if;

  insert into public.agent_credentials ("agent_ID", user_id, initial_password_enc, password_changed_at, created_by, created_at)
  values (p_agent_id, p_user_id, extensions.pgp_sym_encrypt(p_password, v_key), null, p_created_by, now())
  on conflict ("agent_ID") do update
    set user_id              = excluded.user_id,
        initial_password_enc = excluded.initial_password_enc,
        password_changed_at  = null,
        created_by           = excluded.created_by,
        created_at           = excluded.created_at;
end;
$$;

revoke execute on function public.store_agent_initial_password(integer, uuid, text, integer) from public, anon, authenticated;
grant execute on function public.store_agent_initial_password(integer, uuid, text, integer) to service_role;

-- 5) Login details of one agent, for the Edit Agent modal. Admins only.
--    p_reveal = false: status only (initial_password stays NULL).
--    p_reveal = true:  also decrypts the initial password, if the agent hasn't changed it yet.
create or replace function public.admin_get_agent_login(p_agent_id integer, p_reveal boolean default false)
returns table (
  has_login            boolean,      -- agents.user_id is set
  login_email          text,         -- the email the agent signs in with (auth.users.email)
  has_initial_password boolean,      -- an initial password is stored and still unchanged
  initial_password     text,         -- only when p_reveal = true
  password_changed_at  timestamptz,  -- when the agent last changed their password (NULL = never)
  login_created_at     timestamptz   -- when the app created the login (NULL = made by hand)
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_key     text;
begin
  if not public.current_agent_is_admin() then
    raise exception 'Only admins can view agent logins.' using errcode = '42501';
  end if;

  select a.user_id into v_user_id
  from public.agents a
  where a."agent_ID" = p_agent_id;

  if p_reveal then
    select s.decrypted_secret into v_key
    from vault.decrypted_secrets s
    where s.name = 'agent_password_key';
  end if;

  return query
  select
    v_user_id is not null,
    u.email::text,
    c.initial_password_enc is not null,
    case
      when p_reveal and v_key is not null and c.initial_password_enc is not null
        then extensions.pgp_sym_decrypt(c.initial_password_enc, v_key)
    end,
    c.password_changed_at,
    c.created_at
  from (select 1) as one_row
  left join auth.users u on u.id = v_user_id
  left join public.agent_credentials c on c."agent_ID" = p_agent_id and c.user_id = v_user_id;
end;
$$;

revoke execute on function public.admin_get_agent_login(integer, boolean) from public, anon;
grant execute on function public.admin_get_agent_login(integer, boolean) to authenticated;

-- 6) Does the signed-in agent still use the initial password? (Dashboard reminder)
create or replace function public.current_agent_needs_password_change()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.agent_credentials c
    where c.user_id = auth.uid()
      and c.password_changed_at is null
  );
$$;

revoke execute on function public.current_agent_needs_password_change() from public, anon;
grant execute on function public.current_agent_needs_password_change() to authenticated;

-- 7) Any password change (the app's change-password modal, or a reset from the Supabase
--    dashboard) marks the agent's password as changed and deletes the stored initial password.
create or replace function public.handle_agent_password_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.agent_credentials c
     set password_changed_at  = now(),
         initial_password_enc = null
   where c.user_id = new.id;
  return new;
end;
$$;

revoke execute on function public.handle_agent_password_change() from public, anon, authenticated;

drop trigger if exists on_agent_password_changed on auth.users;
create trigger on_agent_password_changed
  after update of encrypted_password on auth.users
  for each row
  when (old.encrypted_password is distinct from new.encrypted_password)
  execute function public.handle_agent_password_change();

notify pgrst, 'reload schema';
