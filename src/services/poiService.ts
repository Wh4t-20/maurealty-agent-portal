// src/services/poiService.ts
// Nearby points-of-interest for a listing (hospitals, schools, etc.), fetched
// from the Mapbox Search Box category API and cached per-listing on
// main_listings.nearby_pois so cost scales with listings, not page views.
//
// Degrades gracefully: if the nearby_pois column doesn't exist yet (migration
// not applied) the cache read/write just fail quietly and we fetch live.
import { supabase } from '../supabaseClient';

export interface Poi {
  name: string;
  lng: number;
  lat: number;
}

// categories keyed by Mapbox canonical category id.
export type PoiCategories = Record<string, Poi[]>;

export interface NearbyPois {
  fetched_at: string;
  categories: PoiCategories;
}

// The category chips shown on the map. `id` must be a Mapbox canonical category
// id (https://docs.mapbox.com/api/search/search-box/#category-search). Tweak the
// list here if a category returns nothing useful for PH locations.
export const POI_CATEGORIES = [
  { id: 'hospital', label: 'Hospitals', color: '#e11d48' },
  { id: 'school', label: 'Schools', color: '#2563eb' },
  { id: 'police', label: 'Police', color: '#1e3a8a' },
  { id: 'pharmacy', label: 'Pharmacies', color: '#059669' },
  { id: 'fire_station', label: 'Fire Stations', color: '#ea580c' },
  { id: 'supermarket', label: 'Supermarkets', color: '#7c3aed' },
] as const;

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const PER_CATEGORY_LIMIT = 5;

// Great-circle distance in km between two lng/lat points.
export function haversineKm(aLng: number, aLat: number, bLng: number, bLat: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

async function readCache(listingId: number): Promise<NearbyPois | null> {
  try {
    const { data, error } = await supabase
      .from('main_listings')
      .select('nearby_pois')
      .eq('listing_ID', listingId)
      .single();
    if (error) return null; // column missing or row not found
    return (data?.nearby_pois as NearbyPois) ?? null;
  } catch {
    return null;
  }
}

async function writeCache(listingId: number, payload: NearbyPois): Promise<void> {
  // best-effort; ignore failures (e.g. column not yet migrated)
  await supabase
    .from('main_listings')
    .update({ nearby_pois: payload })
    .eq('listing_ID', listingId);
}

async function fetchCategory(categoryId: string, lng: number, lat: number): Promise<Poi[]> {
  const token = import.meta.env.VITE_MAPBOX_TOKEN;
  const url =
    `https://api.mapbox.com/search/searchbox/v1/category/${categoryId}` +
    `?access_token=${token}&proximity=${lng},${lat}&limit=${PER_CATEGORY_LIMIT}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`POI fetch failed for "${categoryId}":`, res.status);
      return [];
    }
    const json = await res.json();
    return (json.features || [])
      .map((f: any): Poi | null => {
        const coords = f.geometry?.coordinates;
        if (!coords) return null;
        return { name: f.properties?.name || categoryId, lng: coords[0], lat: coords[1] };
      })
      .filter((p: Poi | null): p is Poi => p !== null);
  } catch (e) {
    console.warn(`POI fetch error for "${categoryId}":`, e);
    return [];
  }
}

export const poiService = {
  // Return nearby POIs for a listing — from cache when fresh, otherwise fetched
  // from Mapbox and cached. Pass force to bypass the cache.
  async getNearbyPois(
    listingId: number,
    lng: number,
    lat: number,
    opts: { force?: boolean } = {},
  ): Promise<NearbyPois> {
    if (!opts.force) {
      const cached = await readCache(listingId);
      if (cached?.fetched_at && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS) {
        return cached;
      }
    }

    const categories: PoiCategories = {};
    // Sequential to stay gentle on the rate limit; the set is small (6 calls).
    for (const c of POI_CATEGORIES) {
      categories[c.id] = await fetchCategory(c.id, lng, lat);
    }

    const payload: NearbyPois = { fetched_at: new Date().toISOString(), categories };
    await writeCache(listingId, payload);
    return payload;
  },
};
