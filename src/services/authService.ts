// src/services/authService.ts
// Who is signed in (getSessionUser, getCurrentAgent) and signing out. Every page uses
// getCurrentAgent() for its permission checks (admin_access) and to scope its queries.
import type { User } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

// The signed-in Supabase Auth user, read from the session the browser already holds.
// supabase.auth.getSession() only goes to the network when the access token needs refreshing,
// while getUser() asked the auth server on every call: one extra round trip before every page's
// first query and on every live refresh. The user id is only the key for the agents lookup;
// every query still carries the access token, which the database verifies, and RLS decides what
// it may read. (Writes that build a storage path from the uid, like ticketService.createTicket,
// still call getUser().)
export async function getSessionUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error reading the session:', error);
    return null;
  }
  return data.session?.user ?? null;
}

// The agent profile tied to the active session.
async function loadCurrentAgent() {
  try {
    const user = await getSessionUser();

    if (!user) {
      return null;
    }

    const { data: agentData, error: agentError } = await supabase
      .from('agents')
      .select('agent_ID, first_name, middle_name, last_name, admin_access')
      .eq('user_id', user.id)
      .single();

    if (agentError) {
      console.error('Error fetching agent profile:', agentError);
      return null;
    }

    return agentData;
  } catch (error) {
    console.error('Unexpected error fetching current agent:', error);
    return null;
  }
}

// A page and its panels often ask at the same moment (the Genealogy page and Team Insights, for
// example); calls that start while one is running share it. Nothing is cached afterwards, so a
// sign-in or sign-out is seen on the next call. Callers only read the result.
let currentAgentInFlight: ReturnType<typeof loadCurrentAgent> | null = null;

export const authService = {
  async getCurrentAgent() {
    if (!currentAgentInFlight) {
      currentAgentInFlight = loadCurrentAgent().finally(() => { currentAgentInFlight = null; });
    }
    return currentAgentInFlight;
  },

async logoutUser() {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Error during logout:', error.message);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      console.error('Unexpected error during logout:', err);
      return { success: false, error: err.message };
    }
  }
};

