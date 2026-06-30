import { supabase } from '../supabaseClient';
import { type Developer, type OfficeHourSlot, type DayOption, days } from '../assets/classes/developers';

const formatHours = (time: string) => {
    const [hoursPart = '0', minutesPart = '00'] = time.split(':');
    const hoursInt = parseInt(hoursPart, 10);
    const realHours = hoursInt % 12 || 12;
    const period = hoursInt >= 12 ? 'PM' : 'AM';

    return `${realHours}:${minutesPart} ${period}`;
};

const convertTo24Hour = (time12h: string): string => {
    const [time = '0:00', modifier = 'AM'] = time12h.trim().split(/\s+/);
    const [hoursPart = '0', minutesPart = '00'] = time.split(':');
    let hoursInt = parseInt(hoursPart, 10);

    if (modifier.toUpperCase() === 'PM' && hoursInt < 12) {
        hoursInt += 12;
    }

    if (modifier.toUpperCase() === 'AM' && hoursInt === 12) {
        hoursInt = 0;
    }

    const formattedHours = hoursInt.toString().padStart(2, '0');
    return `${formattedHours}:${minutesPart}`;
};

export const reformatHours = (time: string): string[] => {
    const [openTime = '', closeTime = ''] = time.split('-');
    const closeHours = convertTo24Hour(closeTime.trim());
    const openHours = convertTo24Hour(openTime.trim());
    return [openHours, closeHours];
};

// helper function to navigate through dayOption
const dayGetter = (dayName: string): DayOption | undefined => {
    return days.find(day => day.name === dayName);
};
export const developerService = {
    async getDevelopers(): Promise<Developer[]> {
        const { data, error } = await supabase
            .from('developers')
            .select('dev_ID, profile_url, name, contact_number, contact_email, location, opening_days(day, open_hours, close_hours),  main_listings(listing_ID, listing_title, created_at, status, property_type(property_type))');
            console.log('Fetched developers:', data);
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
            OfficeHours: item.opening_days.map((day: any) => {
                const matchedDay = dayGetter(day.day); 
                return {
                    selectedDays: matchedDay ? [matchedDay] : [],
                    openTime: day.open_hours,   
                    closeTime: day.close_hours,
                };
            }),
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
        developers.forEach(dev => { 
            var newOfficeHours: OfficeHourSlot[] = [];
            var openTimeComparator: string = '';
            dev.OfficeHours?.forEach(slot => {
                if (newOfficeHours.length === 0) {
                    newOfficeHours.push(slot);
                    openTimeComparator = `${slot.openTime}-${slot.closeTime}`;
                }
                else if (newOfficeHours.length > 0 && openTimeComparator !== `${slot.openTime}-${slot.closeTime}`) {
                    newOfficeHours.push(slot);
                    openTimeComparator = `${slot.openTime}-${slot.closeTime}`;
                }
                else if (newOfficeHours.length > 0 && openTimeComparator === `${slot.openTime}-${slot.closeTime}`) {
                    const lastOfficeHour = newOfficeHours[newOfficeHours.length - 1];
                    const day = slot.selectedDays?.[0];
                    if (lastOfficeHour && day) {
                        lastOfficeHour.selectedDays.push(day);
                    }
                }
            });
            dev.OfficeHours = newOfficeHours;
            console.log(dev);
        });

        return developers;
    },
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
    },
    async addDeveloper(developer: Developer): Promise<any> {
        const { data: inserted, error } = await supabase
            .from('developers')
            .insert(
                {
                    profile_url: developer.image_url,
                    name: developer.name,
                    contact_number: developer.phone,
                    contact_email: developer.email,
                    location: developer.location,
                }
            )
            .select('dev_ID')
            .single();
        if (error) {
            console.error('Error adding developer:', error);
        }
        if(inserted && developer.OfficeHours && developer.OfficeHours.length > 0) {
            const officeHoursData = developer.OfficeHours.flatMap(slot => {
                return slot.selectedDays.map(day => ({
                    id: inserted.dev_ID,
                    day: days[day.id-1]?.name || '',
                    open_hours: slot.openTime,
                    close_hours: slot.closeTime
                }));
            });
            console.log('Office hours data to insert:', officeHoursData);
            const { data: insertedHours, error: officeHoursError } = await supabase
                .from('opening_days')
                .insert(officeHoursData); 
               
            if (officeHoursError) {
                console.error('Error adding office hours:', officeHoursError);
            }
            else if (insertedHours) {
                console.log('Office hours added to developer', developer.dev_ID, ':', insertedHours);
            }
            return inserted.dev_ID;
        }   
        if (inserted) {
            console.log('Developer added with ID:', inserted.dev_ID, inserted);
            return inserted.dev_ID;

        }
        
    },
    async updateDeveloper(developer: Developer, oldOfficeHours: OfficeHourSlot[]): Promise<void> {
        const {error} = await supabase
        .from('developers')
        .update({
                    profile_url: developer.image_url,
                    name: developer.name,
                    contact_number: developer.phone,
                    contact_email: developer.email,
                    location: developer.location,
                })
        .eq("dev_ID", developer.dev_ID)
        .throwOnError();
        if (error) {
            console.error('Error updating developer:', error);
        }
        console.log("Attempting to delete opening_days for developer ID:", developer.dev_ID);

        const { error: deleteError } = await supabase
            .from('opening_days')
            .delete()
            .eq('id', developer.dev_ID);
        if (deleteError) {
            console.error('Error deleting old office hours:', deleteError);
        }
        else {
            console.log('Old office hours deleted for developer', developer.dev_ID);
        }
        if(developer.OfficeHours && developer.OfficeHours.length > 0) {
            
            
            
            console.log("Attempting to add new opening_days for developer ID:", JSON.stringify(developer.OfficeHours));
            const officeHoursData = developer.OfficeHours.flatMap(slot => {
                return slot.selectedDays.map(day => ({
                    id: developer.dev_ID,
                    day: days[day.id-1]?.name || '',
                    open_hours: slot.openTime,
                    close_hours: slot.closeTime
                }));
            });
            const { data: insertedHours, error: officeHoursError } = await supabase
                .from('opening_days')
                .insert(officeHoursData);
            if (officeHoursError) {
                console.error('Error adding office hours:', officeHoursError);
            }
            else if (insertedHours) {
                console.log('Office hours added to developer', developer.dev_ID, ':', insertedHours);
            }
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
    },
    async deleteDeveloper(developer: Developer): Promise<void> {
        const { error: deleteError } = await supabase
                .from('opening_days')
                .delete()
                .eq('id', developer.dev_ID);
            if (deleteError) {
                console.error('Error deleting old office hours:', deleteError);
            }

        const { error: devDeleteError } = await supabase
            .from('developers')
            .delete()
            .eq('dev_ID', developer.dev_ID);
        if (devDeleteError) {
            console.error('Error deleting developer:', devDeleteError);
        }
        else if (developer.dev_ID) {
            console.log('Developer deleted with ID:', developer.dev_ID);
        }
    }
};