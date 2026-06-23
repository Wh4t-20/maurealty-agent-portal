import { supabase } from '../supabaseClient';
import { type Developer } from '../assets/classes/developers';

const formatHours = (time: string) => {
    let [hours, minutes, garbage] = time.split(':');
    let realHours = parseInt(hours);
    let period = 'AM';
    if (realHours >= 12) {
        period = 'PM';
    }
    if (realHours > 12) {
        realHours -= 12;
    }
    return `${realHours}:${minutes} ${period}`;
};

const convertTo24Hour = (time12h: string): string => {
 
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');
  
  let hoursInt = parseInt(hours);

  
  if (modifier.toUpperCase() === 'PM' && hoursInt < 12) {
    hoursInt += 12;
  }
  
 
  if (modifier.toUpperCase() === 'AM' && hoursInt === 12) {
    hoursInt = 0;
  }

  const formattedHours = hoursInt.toString().padStart(2, '0');
  
  return `${formattedHours}:${minutes}`;
}

export const reformatHours = (time: string): string[] => {
    let [openTime, closeTime] = time.split('-');
    let closeHours = convertTo24Hour(closeTime.trim());
    let openHours = convertTo24Hour(openTime.trim());
    return [openHours, closeHours];
}


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
            profile_url: item.profile_url,
            name: item.name,
            contact_number: item.contact_number,
            contact_email: item.contact_email,
            location: item.location,
            available_days: item.available_days,
            hours: formatHours(item.open_hours) + " - " + formatHours(item.close_hours)
        }));

        return developers;
    },
    async addDeveloper(developer: Developer): Promise<any> {
        const { data: inserted, error } = await supabase
            .from('developers')
            .insert(
                {
                    profile_url: developer.profile_url,
                    name: developer.name,
                    contact_number: developer.contact_number,
                    contact_email: developer.contact_email,
                    location: developer.location,
                    available_days: developer.available_days,
                    open_hours: reformatHours(developer.hours)[0],
                    close_hours: reformatHours(developer.hours)[1]
                }
            )
            .select('dev_ID')
            .single();
        if (error) {
            console.error('Error adding developer:', error);
        }
        else if (inserted) {
            console.log('Developer added with ID:', inserted.dev_ID);
            return inserted.dev_ID;

        }
    },
    async updateDeveloper(developer: Developer): Promise<void> {
        const {error} = await supabase
        .from('developers')
        .update({
                    profile_url: developer.profile_url,
                    name: developer.name,
                    contact_number: developer.contact_number,
                    contact_email: developer.contact_email,
                    location: developer.location,
                    available_days: developer.available_days,
                    open_hours: reformatHours(developer.hours)[0],
                    close_hours: reformatHours(developer.hours)[1]
                })
        .eq("dev_ID", developer.dev_ID)
        .throwOnError();
        if (error) {
            console.error('Error updating developer:', error);
        }
    },
    async uploadImage(devID: number, file: File): Promise<string | ''> {
        const fileExt = file.name.split('.').pop() || 'bin';
        const fileName = `${devID}-${Date.now()}.${fileExt}`;
        
        const filePath = `developers/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, file);

        if (uploadError) {
            console.error('Error uploading image:', uploadError);
            return '';
        }   
        const {data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);

        return publicUrl;
    }
};