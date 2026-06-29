-- Cache for nearby points-of-interest per listing, so Mapbox category lookups
-- run ~once per listing instead of once per page view. Critical for the public
-- shared-listing page where visitor count is unbounded.
--
-- Shape: { "fetched_at": "<iso>", "categories": { "hospital": [ {name,lng,lat}, ... ], ... } }
-- Refreshed by the app when older than its TTL (~30 days).

alter table public.main_listings
  add column nearby_pois jsonb;

comment on column public.main_listings.nearby_pois is
  'Cached nearby POIs (hospitals, schools, etc.) keyed by category, with a fetched_at timestamp. Populated on demand from Mapbox; refreshed when stale.';
