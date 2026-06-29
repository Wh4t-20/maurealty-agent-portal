import { supabase } from '../supabaseClient';
import { type Developer } from '../assets/classes/developers';

const formatToAMPM = (timeStr: any): string => { // Helper function to format time from supabase default to AM/PM format
  if (!timeStr) return '';
  
  const [hoursStr, minutes, useless] = timeStr.split(':');
  let hours = parseInt(hoursStr);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours > 12 ? hours % 12 : hours; 
  return `${hours}:${minutes} ${ampm}`;
};

export const developerService = {
    async getDevelopers(): Promise<Developer[]> {
        // Embed each developer's listings in one query (avoids an N+1 per card).
        const { data, error } = await supabase
            .from('developers')
            .select('*, main_listings(listing_ID, listing_title, created_at, status, property_type(property_type))');
        if (error || !data) {
            console.error('Fetch error:', error);
            return [];
        }
        var developers: Developer[] = data.map((item:any): Developer => ({

            dev_ID: item.dev_ID,
            image_url: item.profile_url,
            name: item.name,
            phone: item.contact_number,
            email: item.contact_email,
            location: item.location,
            days: (item.available_days) ? `${item.available_days} `: null,
            hours: (item.open_hours && item.close_hours) ? `${formatToAMPM(item.open_hours)} - ${formatToAMPM(item.close_hours)}` : null,
            projects: (item.main_listings || [])
                // Recent real projects only — skip drafts.
                .filter((l: any) => l.status !== 'draft')
                .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 3)
                .map((l: any) => ({
                    listing_ID: l.listing_ID,
                    listing_title: l.listing_title || 'Untitled Listing',
                    property_type: l.property_type?.property_type || 'Unknown',
                }))
        }));

        return developers;
    },
    // fetch only the names for the filter dropdown
    async getDeveloperNames(): Promise<string[]> {
        try {
        const { data, error } = await supabase
            .from('developers')
            .select('name')
            .order('name');

        if (error) {
            console.error('Error fetching developer names:', error);
            return [];
        }

        return data.map(dev => dev.name);
        } catch (error) {
        console.error('Unexpected error fetching developer names:', error);
        return [];
        }
    }

}

    
