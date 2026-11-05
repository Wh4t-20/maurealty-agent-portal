import { supabase } from '../supabaseClient';

// helper function to delete expired links muahahhaha
// (RLS lets any signed-in agent delete links that have already expired, see
// supabase/migrations/20261105120000_harden_rls.sql, "shared_listings delete expired or admin".)
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

// A share token is the link's share_id, a uuid.
const TOKEN_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The public page (/shared/listing/:token) is opened by clients who are not signed in, and the
// tables are closed to signed-out visitors. The SQL function get_shared_listing() checks the link
// (exists, not expired, listing not pending) and returns only what the page shows: never the
// commission, the incentives or the agent's contact details. Same shape as before:
// { share_id, expires_at, main_listings: { ...listing, house_and_lot, ..., listing_images, agents, developers } }
export const getSharedListing = async (token: string) => {
  const cleanToken = String(token ?? '').trim();
  if (!TOKEN_PATTERN.test(cleanToken)) {
    throw new Error('This shared link is invalid.');
  }

  const { data, error } = await supabase.rpc('get_shared_listing', { p_token: cleanToken });

  if (error) {
    // PGRST202 = the function doesn't exist yet (the RLS migration hasn't been run): read the
    // tables the old way until it is.
    if (error.code === 'PGRST202') return getSharedListingFromTables(cleanToken);
    console.error('Error loading shared listing:', error);
    throw new Error(error.message || 'Failed to load listing or the link is invalid.');
  }

  return data;
};

// Fallback for a database without get_shared_listing() (before 20261105120000_harden_rls.sql).
// Only selects the columns the page shows.
async function getSharedListingFromTables(token: string) {
  const { data, error } = await supabase
    .from('shared_listings')
    .select(`
      share_id,
      expires_at,
      main_listings (
        listing_ID, listing_title, property_type_ID, price, max_price, is_bulk, location,
        longitude, latitude, description, faq, created_at, status, nearby_pois,
        house_and_lot (*),
        lot_only (*),
        condominium (*),
        memorial (*),
        listing_images (image_url, display_order),
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

  const listing: any = Array.isArray(data.main_listings) ? data.main_listings[0] : data.main_listings;
  if (!listing || listing.status === 'pending' || listing.status === 'draft') {
    throw new Error('This listing is not yet available for viewing.');
  }

  return data;
}
