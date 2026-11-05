import { supabase } from '../supabaseClient';
import { type Developer, type DeveloperPromo, type OfficeHourSlot, type DayOption, days } from '../assets/classes/developers';
import { safeFileExtension } from '../utils/sanitize';

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

// opening_days rows for a developer: one per day. opening_days.open_hours / close_hours are
// NOT NULL time columns, so slots without days, marked "Unavailable" or missing a time are
// skipped (their '' used to fail the whole insert, losing every slot). A day picked in two slots
// keeps the first slot's hours, since (id, day) is the primary key.
const officeHourRows = (devId: number, slots: OfficeHourSlot[] | undefined) => {
    const rows: { id: number; day: string; open_hours: string; close_hours: string }[] = [];
    const seen = new Set<string>();
    for (const slot of slots ?? []) {
        if (slot.isOpenUnavailable || slot.isCloseUnavailable || !slot.openTime || !slot.closeTime) continue;
        for (const day of slot.selectedDays ?? []) {
            const name = days[day.id - 1]?.name;
            if (!name || seen.has(name)) continue;
            seen.add(name);
            rows.push({ id: devId, day: name, open_hours: slot.openTime, close_hours: slot.closeTime });
        }
    }
    return rows;
};
export const developerService = {
    async getDevelopers(): Promise<Developer[]> {
        // Embed each developer's listings in one query (avoids an N+1 per card).
        const { data, error } = await supabase
            .from('developers')
            .select('dev_ID, profile_url, name, contact_number, contact_email, location, opening_days(day, open_hours, close_hours),  main_listings(listing_ID, listing_title, created_at, status, property_type(property_type)), developer_promos("promo_ID", image_url, title, valid_until, created_at)');
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
                })),
            promos: (item.developer_promos || [])
                .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((p: any): DeveloperPromo => ({
                    promo_ID: p.promo_ID,
                    dev_ID: item.dev_ID,
                    image_url: p.image_url,
                    title: p.title || '',
                    valid_until: p.valid_until ?? null,
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
        if (error || !inserted) {
            console.error('Error adding developer:', error);
            // The caller shows this (it used to carry on with an undefined id).
            throw new Error(error?.message || 'The developer could not be added.');
        }
        const officeHoursData = officeHourRows(inserted.dev_ID, developer.OfficeHours);
        if (officeHoursData.length > 0) {
            console.log('Office hours data to insert:', officeHoursData);
            const { data: insertedHours, error: officeHoursError } = await supabase
                .from('opening_days')
                .insert(officeHoursData);

            if (officeHoursError) {
                console.error('Error adding office hours:', officeHoursError);
                throw new Error(`The developer was added, but the office hours were not saved: ${officeHoursError.message}`);
            }
            else if (insertedHours) {
                console.log('Office hours added to developer', developer.dev_ID, ':', insertedHours);
            }
        }
        console.log('Developer added with ID:', inserted.dev_ID, inserted);
        return inserted.dev_ID;
    },
    async updateDeveloper(developer: Developer, oldOfficeHours: OfficeHourSlot[]): Promise<void> {
        const {data: updated, error} = await supabase
        .from('developers')
        .update({
                    profile_url: developer.image_url,
                    name: developer.name,
                    contact_number: developer.phone,
                    contact_email: developer.email,
                    location: developer.location,
                })
        .eq("dev_ID", developer.dev_ID)
        .select('dev_ID')
        .throwOnError();
        if (error) {
            console.error('Error updating developer:', error);
        }
        // 0 rows: RLS refused the update (developers are admin-only) or the developer is gone.
        if (!updated || updated.length === 0) {
            throw new Error('The developer was not saved. Only admins can change developers.');
        }
        console.log("Attempting to delete opening_days for developer ID:", developer.dev_ID);

        const { error: deleteError } = await supabase
            .from('opening_days')
            .delete()
            .eq('id', developer.dev_ID);
        if (deleteError) {
            console.error('Error deleting old office hours:', deleteError);
            throw new Error(`The office hours could not be updated: ${deleteError.message}`);
        }
        else {
            console.log('Old office hours deleted for developer', developer.dev_ID);
        }
        const officeHoursData = officeHourRows(developer.dev_ID, developer.OfficeHours);
        if (officeHoursData.length > 0) {
            console.log("Attempting to add new opening_days for developer ID:", JSON.stringify(developer.OfficeHours));
            const { data: insertedHours, error: officeHoursError } = await supabase
                .from('opening_days')
                .insert(officeHoursData);
            if (officeHoursError) {
                console.error('Error adding office hours:', officeHoursError);
                throw new Error(`The office hours could not be saved: ${officeHoursError.message}`);
            }
            else if (insertedHours) {
                console.log('Office hours added to developer', developer.dev_ID, ':', insertedHours);
            }
        }
    },
    async uploadImage(devID: number, file: File): Promise<string | ''> {
        const fileExt = safeFileExtension(file.name);
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
    // Throws a message the page can show. A developer that listings still point to is not deleted
    // (checked first, so its office hours aren't removed for nothing).
    async deleteDeveloper(developer: Developer): Promise<void> {
        const { count, error: countError } = await supabase
            .from('main_listings')
            .select('listing_ID', { count: 'exact', head: true })
            .eq('dev_ID', developer.dev_ID);
        if (countError) throw countError;
        if ((count ?? 0) > 0) {
            throw new Error(`${developer.name} can't be deleted: ${count} listing(s) use this developer.`);
        }

        const { error: deleteError } = await supabase
                .from('opening_days')
                .delete()
                .eq('id', developer.dev_ID);
            if (deleteError) {
                console.error('Error deleting old office hours:', deleteError);
                throw deleteError;
            }

        // .select(): a delete refused by RLS (not an admin) removes 0 rows without an error.
        const { data: deleted, error: devDeleteError } = await supabase
            .from('developers')
            .delete()
            .eq('dev_ID', developer.dev_ID)
            .select('dev_ID');
        if (devDeleteError) {
            console.error('Error deleting developer:', devDeleteError);
            throw devDeleteError;
        }
        if (!deleted || deleted.length === 0) {
            throw new Error('The developer was not deleted. Only admins can delete developers.');
        }
        console.log('Developer deleted with ID:', developer.dev_ID);
    },

    // --- Developer promos (posters) ---
    // Upload a poster image to the images bucket under developer_promos/.
    async uploadPromoImage(devID: number, file: File): Promise<string | ''> {
        const fileExt = safeFileExtension(file.name);
        const fileName = `${devID}-${Date.now()}.${fileExt}`;
        const filePath = `developer_promos/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(filePath, file);

        if (uploadError) {
            console.error('Error uploading promo image:', uploadError);
            return '';
        }
        const { data: { publicUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(filePath);

        return publicUrl;
    },

    // Insert a promo row. Returns the new promo_ID (or null on failure).
    async addPromo(devID: number, promo: DeveloperPromo): Promise<number | null> {
        const { data, error } = await supabase
            .from('developer_promos')
            .insert({
                dev_ID: devID,
                image_url: promo.image_url,
                title: promo.title || null,
                valid_until: promo.valid_until || null,
            })
            .select('promo_ID')
            .single();

        if (error) {
            console.error('Error adding promo:', error);
            return null;
        }
        return data?.promo_ID ?? null;
    },

    // Delete a promo row and its storage object (best-effort on the file).
    async deletePromo(promo: DeveloperPromo): Promise<void> {
        if (promo.image_url) {
            const marker = '/object/public/images/';
            const idx = promo.image_url.indexOf(marker);
            if (idx !== -1) {
                const path = promo.image_url.slice(idx + marker.length);
                const { error: storageError } = await supabase.storage.from('images').remove([path]);
                if (storageError) console.error('Error removing promo image file:', storageError);
            }
        }
        if (promo.promo_ID != null) {
            const { error } = await supabase
                .from('developer_promos')
                .delete()
                .eq('promo_ID', promo.promo_ID);
            if (error) console.error('Error deleting promo:', error);
        }
    }
};