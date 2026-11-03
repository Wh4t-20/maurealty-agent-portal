// supabase/functions/agent-account/index.ts
// Supabase Edge Function (Deno). Creates and removes agent logins (Supabase Auth users).
//
// Why a server function: creating a login needs the service-role key, which must never reach
// the browser. This function runs on Supabase's servers, where SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY are provided automatically.
//
// Who can call it: a signed-in agent with agents.admin_access = true. The check happens here
// on the server, so a non-admin can't create or remove logins even by calling it directly.
//
// Actions (POST, JSON body). The browser calls them through src/services/accountService.ts:
//   { action: 'create', agent: {...}, uplineId, password }
//       New agent: Auth user + agents row (user_id linked) + upline edge + encrypted initial
//       password (public.agent_credentials). If any step fails, the earlier steps are undone.
//   { action: 'create-login', agentId, password }
//       Login for an existing agent that has none (agents added before automatic accounts).
//   { action: 'delete-login', userId }
//       Removes the login of an agent who was just deleted, so they can't sign in anymore.
//
// Deploy: Dashboard > Edge Functions > Deploy a new function > Via editor, name it
// `agent-account` and paste this file, or run `supabase functions deploy agent-account`.
// Hierarchy rules (one Supervisor per team, ...) are still checked in the app
// (genealogyService.checkPlacement) before this function is called.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// An error whose message is safe to show to the admin.
class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

// ---------- Input cleaning (same rules as src/utils/sanitize.ts) ----------
// Values are sent to Postgres through supabase-js (PostgREST binds them as parameters), so they
// can't inject SQL. These checks still reject malformed input and keep the stored values tidy.

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^[0-9+()\-.\s]{5,30}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SEX_VALUES = ['Male', 'Female', 'Non-Binary', 'Other'];
const DEFAULT_CONFIGS = { userDefaultCurrency: 'PHP', userDefaultAreaUnit: 'Metric', disableAnimations: false, darkThemeEnabled: false };

function cleanText(value: unknown, field: string, maxLength: number, required: boolean): string | null {
  if (value != null && typeof value !== 'string') throw new HttpError(400, `${field} must be text.`);
  const text = (typeof value === 'string' ? value : '').replace(CONTROL_CHARS, ' ').replace(/\s+/g, ' ').trim();
  if (!text) {
    if (required) throw new HttpError(400, `${field} is required.`);
    return null;
  }
  if (text.length > maxLength) throw new HttpError(400, `${field} must be at most ${maxLength} characters.`);
  return text;
}

function cleanEmail(value: unknown): string {
  const email = (cleanText(value, 'Email', 254, true) as string).replace(/\s/g, '').toLowerCase();
  if (!EMAIL_PATTERN.test(email)) throw new HttpError(400, 'Enter a valid email address.');
  return email;
}

function cleanDate(value: unknown, field: string): string {
  const text = cleanText(value, field, 10, true) as string;
  const parsed = new Date(`${text}T00:00:00Z`);
  if (!DATE_PATTERN.test(text) || Number.isNaN(parsed.getTime())) throw new HttpError(400, `${field} must be a valid date.`);
  return text;
}

function cleanId(value: unknown, field: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, `${field} is not valid.`);
  return id;
}

// Passwords are never changed (no trimming): Supabase Auth hashes them exactly as given.
function cleanPassword(value: unknown): string {
  if (typeof value !== 'string') throw new HttpError(400, 'The initial password is missing.');
  if (value.length < 8 || value.length > 72) throw new HttpError(400, 'The initial password must be 8 to 72 characters long.');
  if (/[\s\u0000-\u001F\u007F]/.test(value)) throw new HttpError(400, 'The initial password cannot contain spaces.');
  return value;
}

function ageFrom(birthDate: string): number {
  const today = new Date();
  const birth = new Date(`${birthDate}T00:00:00`);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// Only these agents columns can be written; anything else in the request is ignored.
function cleanAgent(raw: unknown) {
  if (!raw || typeof raw !== 'object') throw new HttpError(400, 'The agent details are missing.');
  const a = raw as Record<string, unknown>;

  const sex = cleanText(a.sex, 'Sex', 20, true) as string;
  if (!SEX_VALUES.includes(sex)) throw new HttpError(400, 'Choose a valid sex.');

  const contact = cleanText(a.contact_number, 'Contact number', 30, true) as string;
  if (!PHONE_PATTERN.test(contact)) throw new HttpError(400, 'The contact number can only have digits, spaces and + ( ) - .');

  const birthDate = cleanDate(a.birth_date, 'Birth date');
  const age = ageFrom(birthDate);
  if (age < 0 || age > 120) throw new HttpError(400, 'The birth date is not valid.');

  if (typeof a.admin_access !== 'boolean') throw new HttpError(400, 'Admin access must be true or false.');
  const configs = a.configs && typeof a.configs === 'object' && !Array.isArray(a.configs)
    ? { ...DEFAULT_CONFIGS, ...(a.configs as Record<string, unknown>) }
    : DEFAULT_CONFIGS;

  return {
    first_name: cleanText(a.first_name, 'First name', 100, true) as string,
    middle_name: cleanText(a.middle_name, 'Middle name', 100, false),
    last_name: cleanText(a.last_name, 'Last name', 100, true) as string,
    sex,
    birth_date: birthDate,
    age, // derived on the server so it always matches the birth date
    hire_date: cleanDate(a.hire_date, 'Hire date'),
    contact_number: contact,
    email_address: cleanEmail(a.email_address),
    home_address: cleanText(a.home_address, 'Home address', 500, true) as string,
    position_ID: cleanId(a.position_ID, 'Position'),
    admin_access: a.admin_access,
    configs,
  };
}

// ---------- Helpers ----------

// The caller must be a signed-in admin. Returns their auth id and agent id.
async function requireAdmin(admin: SupabaseClient, req: Request) {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) throw new HttpError(401, 'Sign in first.');

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) throw new HttpError(401, 'Your session has expired. Sign in again.');

  const { data: me, error: meError } = await admin
    .from('agents')
    .select('agent_ID, admin_access')
    .eq('user_id', data.user.id)
    .maybeSingle();
  if (meError) throw new HttpError(500, 'Could not check your access.');
  if (!me?.admin_access) throw new HttpError(403, 'Only admins can manage agent logins.');

  return { userId: data.user.id, agentId: me.agent_ID as number };
}

async function createAuthUser(admin: SupabaseClient, email: string, password: string, firstName: string, lastName: string): Promise<string> {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // the admin vouches for the email, so the agent can sign in right away
    user_metadata: { first_name: firstName, last_name: lastName },
  });
  if (error || !data?.user) {
    const code = (error as { code?: string } | null)?.code;
    const message = error?.message ?? '';
    if (code === 'email_exists' || /already (been )?registered|already exists/i.test(message)) {
      throw new HttpError(409, 'A login with this email already exists. Use a different email.');
    }
    if (code === 'weak_password') throw new HttpError(400, `Supabase rejected the password: ${message}`);
    throw new HttpError(400, message || 'Could not create the login.');
  }
  return data.user.id;
}

// Best effort: used while undoing a failed request.
async function removeAuthUser(admin: SupabaseClient, userId: string) {
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) console.error('agent-account: could not remove auth user', userId, error.message);
}

async function storeInitialPassword(admin: SupabaseClient, agentId: number, userId: string, password: string, createdBy: number) {
  const { error } = await admin.rpc('store_agent_initial_password', {
    p_agent_id: agentId,
    p_user_id: userId,
    p_password: password,
    p_created_by: createdBy,
  });
  if (error) {
    throw new HttpError(500, `Could not store the initial password (${error.message}). Run the agent accounts migration in the SQL editor.`);
  }
}

// ---------- Actions ----------

async function createAgent(admin: SupabaseClient, callerAgentId: number, body: Record<string, unknown>) {
  const agent = cleanAgent(body.agent);
  const uplineId = body.uplineId == null ? null : cleanId(body.uplineId, 'Upline');
  const password = cleanPassword(body.password);

  const userId = await createAuthUser(admin, agent.email_address, password, agent.first_name, agent.last_name);
  let agentId: number | null = null;

  try {
    const { data, error } = await admin
      .from('agents')
      .insert([{ ...agent, user_id: userId }])
      .select('agent_ID')
      .single();
    if (error || !data) throw new HttpError(400, `Could not save the agent: ${error?.message ?? 'no row returned'}`);
    agentId = data.agent_ID as number;

    if (uplineId != null) {
      const { error: edgeError } = await admin
        .from('genealogy')
        .insert([{ upline_agent_ID: uplineId, downline_agent_ID: agentId }]);
      if (edgeError) throw new HttpError(400, `Could not link the upline: ${edgeError.message}`);
    }

    await storeInitialPassword(admin, agentId, userId, password, callerAgentId);
    return { agent_ID: agentId, user_id: userId, email: agent.email_address };
  } catch (e) {
    // Undo in reverse order so no half-made agent or login is left behind.
    // (agent_credentials rows go with the agent through ON DELETE CASCADE.)
    if (agentId != null) {
      await admin.from('genealogy').delete().eq('downline_agent_ID', agentId);
      await admin.from('agents').delete().eq('agent_ID', agentId);
    }
    await removeAuthUser(admin, userId);
    throw e;
  }
}

async function createLoginForAgent(admin: SupabaseClient, callerAgentId: number, body: Record<string, unknown>) {
  const agentId = cleanId(body.agentId, 'Agent');
  const password = cleanPassword(body.password);

  const { data: row, error } = await admin
    .from('agents')
    .select('agent_ID, first_name, last_name, email_address, user_id')
    .eq('agent_ID', agentId)
    .maybeSingle();
  if (error) throw new HttpError(500, 'Could not load the agent.');
  if (!row) throw new HttpError(404, 'Agent not found.');
  if (row.user_id) throw new HttpError(409, 'This agent already has a login.');

  const email = cleanEmail(row.email_address);
  const userId = await createAuthUser(admin, email, password, row.first_name, row.last_name);

  try {
    // Only link if the agent still has no login (guards against two admins at once).
    const { data: linked, error: linkError } = await admin
      .from('agents')
      .update({ user_id: userId })
      .eq('agent_ID', agentId)
      .is('user_id', null)
      .select('agent_ID');
    if (linkError) throw new HttpError(400, `Could not link the login: ${linkError.message}`);
    if (!linked?.length) throw new HttpError(409, 'This agent got a login in the meantime.');

    await storeInitialPassword(admin, agentId, userId, password, callerAgentId);
    return { agent_ID: agentId, user_id: userId, email };
  } catch (e) {
    await admin.from('agents').update({ user_id: null }).eq('agent_ID', agentId).eq('user_id', userId);
    await removeAuthUser(admin, userId);
    throw e;
  }
}

async function deleteLogin(admin: SupabaseClient, callerUserId: string, body: Record<string, unknown>) {
  const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
  if (!UUID_PATTERN.test(userId)) throw new HttpError(400, 'The login id is not valid.');
  if (userId === callerUserId) throw new HttpError(400, "You can't remove your own login.");

  // Only logins that no agent uses anymore can be removed.
  const { count, error } = await admin
    .from('agents')
    .select('agent_ID', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) throw new HttpError(500, 'Could not check the login.');
  if ((count ?? 0) > 0) throw new HttpError(409, 'This login still belongs to an agent. Delete the agent first.');

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError && !/not found/i.test(deleteError.message)) throw new HttpError(400, deleteError.message);
  return { deleted: true };
}

// ---------- Entry point ----------

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return json(405, { error: 'Use POST.' });

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return json(500, { error: 'The function is missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.' });

  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  try {
    const caller = await requireAdmin(admin, req);

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, 'The request body must be JSON.');
    }

    switch (body?.action) {
      case 'create':
        return json(200, await createAgent(admin, caller.agentId, body));
      case 'create-login':
        return json(200, await createLoginForAgent(admin, caller.agentId, body));
      case 'delete-login':
        return json(200, await deleteLogin(admin, caller.userId, body));
      default:
        throw new HttpError(400, 'Unknown action.');
    }
  } catch (e) {
    if (e instanceof HttpError) return json(e.status, { error: e.message });
    console.error('agent-account failed:', e);
    return json(500, { error: 'Something went wrong while managing the login.' });
  }
});
