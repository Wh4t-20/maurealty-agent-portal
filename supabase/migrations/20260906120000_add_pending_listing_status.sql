-- Admin approval flow for agent-created listings. Agents' new listings queue
-- as 'pending' until an admin approves (-> active) or rejects (-> deleted by
-- the app, no status needed for that). Admin-created listings skip the queue
-- entirely and are inserted as 'active' directly (no self-approval step).
ALTER TYPE public.listing_status ADD VALUE IF NOT EXISTS 'pending';
