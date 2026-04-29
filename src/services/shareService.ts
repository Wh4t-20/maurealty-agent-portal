import { supabase } from '../supabaseClient';

// helper function to delete expired links muahahhaha
const cleanupExpiredLinks = async () => {
  const now = new Date().toISOString();
  await supabase
    .from('shared_listings')
    .delete()
    .lt('expires_at', now); 
};


export const generateShareLink = async (listingId: number, agentId: number, daysValid: number = 1) => {

// execute cleanup everytime before a new share link is generated.
cleanupExpiredLinks().catch(err => console.error("Cleanup Failed: ", err));

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + daysValid);

  const { data, error } = await supabase
    .from('shared_listings')
    .insert([
      { 
        "listing_ID": listingId, 
        "agent_ID": agentId, 
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
        house_and_lot (*),
        lot_only (*),
        condominium (*),
        memorial (*),
        listing_images (image_url),
        agents (first_name, last_name),
        developers (name)
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