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
        const { data, error } = await supabase
            .from('developers')
            .select('*');
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
            hours: (item.available_days && item.open_hours && item.close_hours) ?  
            `${item.available_days} ${formatToAMPM(item.open_hours)} - ${formatToAMPM(item.close_hours)}`
            : '${item.available_days} office hours not specified'
        }));

        return developers;
    }
}

    
