import { supabase } from '../supabaseClient';
import { type Developer } from '../assets/classes/developers';

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
            open_hours: item.open_hours,
            close_hours: item.close_hours
        }));

        return developers;
    },
    async addDeveloper(developer: Developer): Promise<void> {
        const { dev_ID, ...newData } = developer;
        const { error } = await supabase
            .from('developers')
            .insert([newData])
            .throwOnError();
        if (error) {
            console.error('Error adding developer:', error);
        }
    },
    async updateDeveloper(developer: Developer): Promise<void> {
        const { dev_ID, ...updateData } = developer;
        const {error} = await supabase
        .from('developers')
        .update(updateData)
        .eq("dev_ID", developer.dev_ID)
        .throwOnError();
        if (error) {
            console.error('Error updating developer:', error);
        }
    }
};
