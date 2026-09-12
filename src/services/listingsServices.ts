import { supabase } from '../supabaseClient';
import { type Property } from '../assets/classes/listings';

//added a subtable
const SUB_TABLE_MAP: Record<number, string> = {
  1: 'house_and_lot',
  2: 'lot_only',
  3: 'condominium',
  4: 'memorial',

};

export const listingsService = {
  // Fetch all active listings
  async getListings(limit: number = 20): Promise<Property[]> {
    const { data, error } = await supabase
      .from('main_listings')
      .select(`
        listing_ID,
        listing_title,
        price,
        max_price,
        commission, 
        location,
        longitude,
        latitude,
        description,
        created_at,
        status,
        is_bulk,
        agent_incentive,
        realty_incentive,
        agents (first_name, last_name),
        property_type (property_type),
        developers (name),
        listing_images (image_url, display_order)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit); // Adjust the limit as needed

    if (error) {
      console.error('Error fetching listings:', error);
      throw error;
    }

    return (data || []).map((item: any) => this.mapToProperty(item));
  },

  // Map database payload to Property interface
  mapToProperty(item: any): Property {
    // Sort images to find the lowest display_order for the thumbnail
    const sortedImages = [...(item.listing_images || [])].sort((a: any, b: any) => a.display_order - b.display_order);
    const thumbnailUrl = sortedImages.length > 0 ? sortedImages[0].image_url : undefined;

    return {
      listing_id: item.listing_ID,
      listing_title: item.listing_title,
      agent_name: `${item.agents?.first_name || ''} ${item.agents?.last_name || ''}`.trim(),
      property_type: item.property_type?.property_type || 'Unknown',
      price: item.price,
      max_price: item.max_price,
      commission: item.commission,
      location: item.location,
      lng: item.longitude,
      lat: item.latitude,
      description: item.description,
      created_at: new Date(item.created_at),
      status: item.status,
      developer_name: item.developers?.name || 'None',
      image_url: thumbnailUrl, // Attach the thumbnail
      faq: item.faq,
      is_bulk: item.is_bulk || false,
      agent_incentive: item.agent_incentive ?? null,
      realty_incentive: item.realty_incentive ?? null
    };
  },

  // Fetch a single listing by ID
  async getListingById(id: number, propertyTypeId: number) {
    const subTable = SUB_TABLE_MAP[propertyTypeId];
 
    const selectQuery = subTable
      ? `*, agents (first_name, last_name), developers (name), listing_images (image_url, display_order), ${subTable} (*)`
      : `*, agents (first_name, last_name), developers (name), listing_images (image_url, display_order)`;
 
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
  async getAgentFromListing(listingId: number) {
    try {
      const { data, error } = await supabase
        .from('main_listings')
        .select('agent_ID')
        .eq('listing_ID', listingId)
        .single();
      console.log("Agent ID from listing:", data?.agent_ID, "for listing ID:", listingId);
      return data?.agent_ID;
      
    } catch (error) {
      console.error('Error fetching agent from listing:', error);
      throw error;
    }
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
      const { data: mainData, error: mainError } = await supabase
        .from('main_listings')
        .update(mainListingData)
        .eq('listing_ID', listingId)
        .select(); // Returns modified rows (do not ERASE so that we can catch RLS blocks)

      if (mainError) throw mainError;

      // Detects if RLS blocked the update
      if (!mainData || mainData.length === 0) {
        console.error('Update failed silently. Zero rows modified in main_listings.');
        return { success: false };
      }
      
      if (specificPropertyData && Object.keys(specificPropertyData).length > 0) {
        const subTable = SUB_TABLE_MAP[propertyTypeId];

        if (subTable) {
          const { data: subData, error: subError } = await supabase
            .from(subTable)
            .update(specificPropertyData)
            .eq('listing_ID', listingId)
            .select(); // Returns modified rows (do not ERASE so that we can catch RLS blocks)

          if (subError) throw subError;

          // Detects if RLS blocked the update
          if (!subData || subData.length === 0) {
            console.error('Update failed silently. Zero rows modified in ${subTable}.');
            return { success: false };
          }
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating listing:', error);
      throw error;
    }
  },

// Upload images to Supabase Storage and link them to the listing
  async uploadPropertyImages(listingId: number, files: File[]) {
    try {
      const uploadedRecords = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;
        
        // create a unique, safe file name
        const fileExt = file.name.split('.').pop() || 'bin';
        const fileName = `${listingId}-${Date.now()}-${i}.${fileExt}`;
        
        const filePath = `listings/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);

        //Prepare the row to be inserted into the listing_images table
        uploadedRecords.push({
          listing_ID: listingId,
          image_url: publicUrl,
          display_order: i + 1 
        });
      }

      //Bulk insert the URLs into the database
      if (uploadedRecords.length > 0) {
        const { error: dbError } = await supabase
          .from('listing_images')
          .insert(uploadedRecords);
          
        if (dbError) throw dbError;
      }

      return { success: true };
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  },

async deleteListingImages(imageUrls: string[]) {
    if (!imageUrls || imageUrls.length === 0) return { success: true };

    // Convert any potential reactive proxy elements into clean string primitives
    const rawUrls = Array.from(imageUrls).map(url => String(url).trim());

    try {
      const marker = '/object/public/images/';
      const storagePaths = rawUrls
        .map((url) => {
          const index = url.indexOf(marker);
          return index === -1 ? null : url.slice(index + marker.length);
        })
        .filter((path): path is string => path !== null);

      if (storagePaths.length > 0) {
        console.log("[DEBUG] Sending storage removal paths:", storagePaths);
        const { data: storageData, error: storageError } = await supabase.storage.from('images').remove(storagePaths);
        if (storageError) throw storageError;
        console.log("[DEBUG] Storage removal response data:", storageData);
      }

      console.log("[DEBUG] Executing database DELETE query for URLs:", rawUrls);
      const { data: dbData, error: dbError } = await supabase
        .from('listing_images')
        .delete()
        .in('image_url', rawUrls)
        .select();

      if (dbError) throw dbError;

      if (!dbData || dbData.length === 0) {
        console.warn("[DEBUG] Database delete returned 0 modified rows. Check your RLS policies for table listing_images.");
        return { success: false };
      }

      console.log(`[DEBUG] Database delete successful. Removed ${dbData.length} row(s).`);
      return { success: true };
    } catch (error) {
      console.error('[DEBUG] Critical error inside deleteListingImages:', error);
      throw error;
    }
  },

  // fact sheet upload
  async uploadFactSheet(listingId: number, file: File) {
    try {
      const sanitizedName = file.name.replace(/\s+/g, '_');
      const filePath = `${listingId}-${Date.now()}-${sanitizedName}`;

      // upload the file to the fact_sheets bucket
      const { error } = await supabase.storage
        .from('fact_sheets')
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      // get the public URL of the uploaded document
      const { data: urlData } = supabase.storage
        .from('fact_sheets')
        .getPublicUrl(filePath);

      // update the main_listings table row with this file's public URL
      const { error: dbError } = await supabase
        .from('main_listings')
        .update({ fact_sheet: urlData.publicUrl })
        .eq('listing_ID', listingId)
        .select();

      if (dbError) throw dbError;

      return { success: true, url: urlData.publicUrl };
    } catch (error) {
      console.error("Storage upload failed:", error);
      throw error;
    }
  },

  async updateListingStatus(listingId: number, newStatus: string) {
    try {
      const updateTo = { status: newStatus };

      const { data, error } = await supabase
        .from('main_listings')
        .update(updateTo)  
        .eq('listing_ID', listingId)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        console.error('Update failed silently. Zero rows modified in listing.');
        return { success: false };
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating listing status:', error);
      throw error;
    }
  },
// Hard delete
  async deleteListing(listingId: number) {

    try {
      const { data, error } = await supabase
        .from('main_listings')
        .delete()
        .eq('listing_ID', listingId)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        console.error("Database delete failed silently: No rows were  deleted. ");
        return { success: false };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting listing:', error);
      throw error;
    }
  },
};

// for markdown formatting of description, FAQ, etc.
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export const compileMarkdown = (rawInput: string | undefined): string => {
  if (!rawInput) return '';
  
  // parsing the markdown input into html
  const rawHtml = marked.parse(rawInput) as string;
  
  // return the sanitized html
  return DOMPurify.sanitize(rawHtml);
};