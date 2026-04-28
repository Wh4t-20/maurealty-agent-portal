import { supabase } from '../supabaseClient';

export const generateShareLink = async (listingId: number, agentId: number, daysValid: number = 1) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + daysValid);

  const { data, error } = await supabase
    .from('shared_listings')
    .insert([
      { 
        listing_ID: listingId, 
        agent_ID: agentId, 
        expires_at: expiresAt.toISOString() 
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getSharedListing = async (token: string) => {
  const { data, error } = await supabase
    .from('shared_listings')
    .select(`
      *,
      main_listings (
        *,
        listing_images (image_url)
      )
    `)
    .eq('share_id', token)
    .single();

  if (error) throw error;

  const now = new Date();
  const expiresAt = new Date(data.expires_at);
  
  if (now > expiresAt) {
    throw new Error('This shared link has expired.');
  }

  return data;
};