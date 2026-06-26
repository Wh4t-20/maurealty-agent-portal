import { supabase } from '../supabaseClient';

export const agentService = {
  // Fetch full agent profile along with position
  async getCurrentAgentProfile() {
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError || !authData?.user) {
        return null;
      }

      const { data, error } = await supabase
        .from('agents')
        .select(`*`)
        .eq('user_id', authData.user.id)
        .single();

      if (error) {
        console.error('Error fetching agent profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
      return null;
    }
  },

  async updateProfile(agentId: number, agentData: any) {
    try {
      const { data: mainData, error: mainError } = await supabase
        .from('agents')
        .update(agentData)
        .eq('agent_ID', agentId)
        .select(); // Returns modified rows (do not ERASE so that we can catch RLS blocks)

        if (mainError) throw mainError;

        // Detects if RLS blocked the update
        if (!mainData || mainData.length === 0) {
          console.error('Update failed silently. Zero rows modified in agents.');
          return { success: false };
        }

        return { success: true };
    } catch (error) {
      console.error('Error in updating profile:', error);
      throw error;
    }
  }
};