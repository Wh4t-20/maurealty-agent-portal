// src/services/accountService.ts
// Agent logins (Supabase Auth users) and password changes.
//
// - Creating and removing logins goes through the `agent-account` Edge Function
//   (supabase/functions/agent-account), which holds the service-role key and checks that the
//   caller is an admin.
// - Login status and revealing an initial password go through SECURITY DEFINER SQL functions
//   (supabase/migrations/20261104120000_agent_accounts.sql); they also check for an admin.
// - Changing a password uses Supabase Auth's one-time email code (the "Reset password" email,
//   whose template must contain {{ .Token }}; see project-context.md, Supabase setup).
import { supabase } from '../supabaseClient';

export interface NewAgentAccount {
  agent_ID: number;
  user_id: string;
  email: string;   // the login email (lower case)
}

export interface AgentLogin {
  hasLogin: boolean;                // agents.user_id is set
  loginEmail: string | null;        // the email the agent signs in with
  hasInitialPassword: boolean;      // initial password stored and not changed yet
  initialPassword: string | null;   // only filled when revealed
  passwordChangedAt: string | null; // when the agent last changed it (null = never)
  loginCreatedAt: string | null;    // when the app created the login (null = made by hand)
}

const ACCOUNT_FUNCTION = 'agent-account';

// Turns a failed Edge Function call into a message an admin can act on.
async function functionErrorMessage(error: any): Promise<string> {
  const response = error?.context;
  if (response && typeof response.json === 'function') {
    if (response.status === 404) {
      return 'The agent-account Edge Function is not deployed yet (see project-context.md, Supabase setup).';
    }
    try {
      const body = await response.clone().json();
      if (body?.error) return String(body.error);
    } catch {
      // not JSON: fall through to the generic message
    }
  }
  if (error?.name === 'FunctionsFetchError') {
    return 'Could not reach the agent-account Edge Function. Check your connection and that the function is deployed.';
  }
  return error?.message || 'The request failed.';
}

async function callAccountFunction<T>(body: Record<string, unknown>): Promise<T> {
  // supabase-js sends the signed-in user's access token, which the function checks.
  const { data, error } = await supabase.functions.invoke(ACCOUNT_FUNCTION, { body });
  if (error) {
    const message = await functionErrorMessage(error);
    console.error(`agent-account (${String(body.action)}) failed:`, message);
    throw new Error(message);
  }
  return data as T;
}

// Supabase Auth errors, reworded for the change-password modal.
function authErrorMessage(error: { code?: string; message?: string; status?: number }): string {
  switch (error.code) {
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Too many requests. Wait a minute, then try again.';
    case 'otp_expired':
      return 'That code is wrong or has expired. Check the latest email or send a new code.';
    case 'same_password':
      return 'Choose a password that is different from your current one.';
    case 'weak_password':
      return error.message || 'That password is too weak. Make it longer or add more kinds of characters.';
    case 'email_address_invalid':
      return 'Enter a valid email address.';
    case 'session_not_found':
    case 'session_expired':
      return 'Your code session has expired. Start again and request a new code.';
    default:
      return error.message || 'Something went wrong. Please try again.';
  }
}

export const accountService = {
  // ---------- Admin: logins (Edge Function) ----------

  // New agent with a login: Auth user + agents row + upline edge + stored initial password.
  // `agent` holds the agents columns; the function whitelists and re-validates them.
  async createAgentWithLogin(agent: Record<string, unknown>, uplineId: number | null, password: string): Promise<NewAgentAccount> {
    return callAccountFunction<NewAgentAccount>({ action: 'create', agent, uplineId, password });
  },

  // Login for an existing agent that has none (added before automatic accounts).
  // Uses the email saved on the agent's record.
  async createLoginForAgent(agentId: number, password: string): Promise<NewAgentAccount> {
    return callAccountFunction<NewAgentAccount>({ action: 'create-login', agentId, password });
  },

  // Removes a deleted agent's login. The function refuses if an agent still uses it.
  async deleteLogin(userId: string): Promise<void> {
    await callAccountFunction<{ deleted: boolean }>({ action: 'delete-login', userId });
  },

  // After an email edit (Edit Agent, Profile): make the agent's login email the email now saved
  // on their row. Admins for any agent, an agent for themselves. `changed` is false when they
  // already matched or the agent has no login.
  async syncLoginEmail(agentId: number): Promise<{ changed: boolean; email: string | null }> {
    try {
      return await callAccountFunction<{ changed: boolean; email: string | null }>({ action: 'sync-login-email', agentId });
    } catch (e: any) {
      // The function deployed before this action existed answers "Unknown action."
      if (e?.message === 'Unknown action.') {
        throw new Error('The agent-account Edge Function needs to be redeployed before login emails can follow email edits (project-context.md 3.3 step 2).');
      }
      throw e;
    }
  },

  // ---------- Admin: login status / reveal (SQL function) ----------

  // `reveal` = true also returns the initial password, if the agent hasn't changed it yet.
  async getAgentLogin(agentId: number, reveal = false): Promise<AgentLogin> {
    const { data, error } = await supabase.rpc('admin_get_agent_login', { p_agent_id: agentId, p_reveal: reveal });
    if (error) {
      console.error('Error loading agent login:', error);
      throw new Error(error.code === 'PGRST202'
        ? 'Run the agent accounts migration in the Supabase SQL editor first.'
        : error.message);
    }
    const row: any = Array.isArray(data) ? data[0] : data;
    return {
      hasLogin: !!row?.has_login,
      loginEmail: row?.login_email ?? null,
      hasInitialPassword: !!row?.has_initial_password,
      initialPassword: row?.initial_password ?? null,
      passwordChangedAt: row?.password_changed_at ?? null,
      loginCreatedAt: row?.login_created_at ?? null,
    };
  },

  // ---------- Signed-in agent ----------

  // True while the signed-in agent still uses the initial password an admin gave them.
  // Never throws: the Dashboard simply shows no reminder if this can't be checked.
  async needsPasswordChange(): Promise<boolean> {
    const { data, error } = await supabase.rpc('current_agent_needs_password_change');
    if (error) {
      console.error('Error checking the password reminder:', error);
      return false;
    }
    return data === true;
  },

  // ---------- Change password with an email code ----------

  // Step 1: email a one-time code. Supabase answers the same way whether or not the email has
  // a login, so this never reveals who has an account.
  async sendPasswordCode(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      console.error('Error sending the password code:', error);
      throw new Error(authErrorMessage(error));
    }
  },

  // Step 2: check the code. On success Supabase starts a session for that user, which step 3 needs.
  async verifyPasswordCode(email: string, code: string): Promise<void> {
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'recovery' });
    if (error) {
      console.error('Error verifying the password code:', error);
      throw new Error(authErrorMessage(error));
    }
  },

  // Step 3: save the new password. The auth.users trigger then marks it changed, which ends the
  // Dashboard reminder and deletes the stored initial password.
  async changePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      console.error('Error changing the password:', error);
      throw new Error(authErrorMessage(error));
    }
  },
};
