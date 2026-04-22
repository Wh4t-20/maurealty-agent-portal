import { supabase } from '../supabaseClient';
import { type Property } from '../assets/classes/listings';

//added a subtable
const SUB_TABLE_MAP: Record<number, string> = {
  1: 'house_and_lot',
  2: 'lot_only',
  3: 'condominium',
  4: 'memorial'
};

export const listingsService = {
  // Fetch all active listings
  async getListings(): Promise<Property[]> {
    const { data, error } = await supabase
      .from('main_listings')
      .select(`
        listing_ID,
        price,
        commission,
        location,
        description,
        created_at,
        is_active,
        agents (first_name, last_name),
        property_type (property_type),
        developers (name),
        listing_images (image_url, display_order)
      `)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching listings:', error);
      throw error;
    }

    return (data || []).map((item: any) => this.mapToProperty(item));
  },

  // Map database payload to Property interface
  mapToProperty(item: any): Property {
    // Sort images to find the lowest display_order for the thumbnail
    const sortedImages = item.listing_images?.sort((a: any, b: any) => a.display_order - b.display_order) || [];
    const thumbnailUrl = sortedImages.length > 0 ? sortedImages[0].image_url : undefined;

    return {
      listing_id: item.listing_ID,
      agent_name: `${item.agents?.first_name || ''} ${item.agents?.last_name || ''}`.trim(),
      property_type: item.property_type?.property_type || 'Unknown',
      price: item.price,
      commission: item.commission,
      location: item.location,
      description: item.description,
      created_at: new Date(item.created_at),
      is_active: item.is_active,
      developer_name: item.developers?.name || 'None',
      image_url: thumbnailUrl // Attach the thumbnail
    };
  },

  // Fetch a single listing by ID
  async getListingById(id: number, propertyTypeId: number) {
    const subTable = SUB_TABLE_MAP[propertyTypeId];
 
    const selectQuery = subTable
      ? `*, listing_images (image_url, display_order), ${subTable} (*)`
      : `*, listing_images (image_url, display_order)`;
 
    const { data, error } = await supabase
      .from('main_listings')
      .select(selectQuery)
      .eq('listing_ID', id)
      .single();
 
    if (error) {
      console.error('Error fetching listing by ID:', error);
      throw error;
    }
 
    return data;
  },
  // insert new listing
  async createListing(mainListingData: any, specificPropertyData: any, propertyTypeId: number) {
    try {
      const { data: mainListing, error: mainError } = await supabase
        .from('main_listings')
        .insert([mainListingData])
        .select('listing_ID')
        .single();
        
      if (mainError) throw mainError;

      const newListingId = mainListing.listing_ID;
      if (specificPropertyData && Object.keys(specificPropertyData).length > 0) {
        const subTablePayload = { 
          listing_ID: newListingId, 
          ...specificPropertyData 
        };

        let subTableError = null;

        switch (propertyTypeId) {
          case 1:
            const { error: hlError } = await supabase.from('house_and_lot').insert([subTablePayload]);
            subTableError = hlError;
            break;
          case 2:
            const { error: loError } = await supabase.from('lot_only').insert([subTablePayload]);
            subTableError = loError;
            break;
          case 3:
            const { error: condoError } = await supabase.from('condominium').insert([subTablePayload]);
            subTableError = condoError;
            break;
          case 4:
            const { error: memError } = await supabase.from('memorial').insert([subTablePayload]);
            subTableError = memError;
            break;
          default:
            console.warn(`No sub-table insertion defined for property type ID: ${propertyTypeId}`);
        }

        if (subTableError) {
          console.error(`Sub-table insert failed for type ${propertyTypeId}:`, subTableError);
          await supabase.from('main_listings').delete().eq('listing_ID', newListingId);
          throw subTableError;
        }
      }

      return { success: true, data: mainListing };
    } catch (error) {
      console.error('Error creating full listing:', error);
      throw error; 
    }
  },

  async updateListing(listingId: number, mainListingData: any, specificPropertyData: any, propertyTypeId: number) {
    try {
      const { error: mainError } = await supabase
        .from('main_listings')
        .update(mainListingData)
        .eq('listing_ID', listingId);
 
      if (mainError) throw mainError;
 
      if (specificPropertyData && Object.keys(specificPropertyData).length > 0) {
        const subTable = SUB_TABLE_MAP[propertyTypeId];
 
        if (subTable) {
          const { error: subError } = await supabase
            .from(subTable)
            .update(specificPropertyData)
            .eq('listing_ID', listingId);
 
          if (subError) throw subError;
        }
      }
 
      return { success: true };
    } catch (error) {
      console.error('Error updating listing:', error);
      throw error;
    }
  },

  //soft delete only, can change to hard delete once masabotan
  async deleteListing(listingId: number) {
    try {
      const { error } = await supabase
        .from('main_listings')
        .update({ is_active: false })
        .eq('listing_ID', listingId);
 
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting listing:', error);
      throw error;
    }
  },
};