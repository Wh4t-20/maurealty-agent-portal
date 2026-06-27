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
  },

  async uploadProfileImage(agentId: number, file: File) {
    try {
      // create a unique, safe file name
      const fileExt = file.name.split('.').pop() || 'bin';
      const fileName = `${agentId}-${Date.now()}.${fileExt}`;
      
      const filePath = `agents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      if (!data.publicUrl) {
        throw new Error('Failed to retrieve public URL');
      }

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  },

  async deleteProfileImage(fileUrl: string) {
    try {
      if (!fileUrl) return;
      
      // Supabase public URLs look like: 
      // https://[project].supabase.co/storage/v1/object/public/images/agents/filename.jpg
      // We need to extract the 'agents/filename.jpg' part to delete it from the 'images' bucket.
      const pathParts = fileUrl.split('/images/');
      const filePath = pathParts.length > 1 ? pathParts[1] : null;

      if (!filePath) {
        console.warn('Could not extract file path from URL:', fileUrl);
        return;
      }

      const { error } = await supabase.storage
        .from('images')
        .remove([filePath]);

      if (error) throw error;
      
      console.log('Old profile image deleted successfully');
    } catch (error) {
      console.error('Error deleting old image:', error);
      // We usually don't throw here so a failed deletion doesn't block the profile save
    }
  }
};