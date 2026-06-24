// src/services/authService.ts
import { supabase } from '../supabaseClient';

export const authService = {
  // Retrieves the agent profile tied to the active session
  async getCurrentAgent() {
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authData?.user) {
        return null;
      }

      const { data: agentData, error: agentError } = await supabase
        .from('agents')
        .select('agent_ID, first_name, last_name, admin_access')
        .eq('user_id', authData.user.id)
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

