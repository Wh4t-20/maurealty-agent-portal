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
        .select(`
          *,
          positions (
            position
          )
        `)
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
  }
};