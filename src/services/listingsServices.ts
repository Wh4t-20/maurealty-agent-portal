import { supabase } from '../supabaseClient'

export const listingsService = {
  // READ: Fetch all active listings
  async getListings() {
    const { data, error } = await supabase
      .from('main_listings')
      .select('*')
      .eq('is_active', true)
      
    if (error) throw error
    return data
  },

  // READ: Fetch a single listing by ID
  async getListingById(id: number) {
    const { data, error } = await supabase
      .from('main_listings')
      .select('*')
      .eq('listing_ID', id)
      .single()
      
    if (error) throw error
    return data
  },

  // CREATE: Insert a new listing
  async createListing(listingData: any) {
    const { data, error } = await supabase
      .from('main_listings')
      .insert([listingData])
      .select()
      
    if (error) throw error
    return data
  },

  // UPDATE: Modify an existing listing
  async updateListing(id: number, updates: any) {
    const { data, error } = await supabase
      .from('main_listings')
      .update(updates)
      .eq('listing_ID', id)
      .select()
      
    if (error) throw error
    return data
  },

  // DELETE: Remove a listing
  async deleteListing(id: number) {
    const { error } = await supabase
      .from('main_listings')
      .delete()
      .eq('listing_ID', id)
      
    if (error) throw error
    return true
  }
}