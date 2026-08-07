-- Incentives per listing. Two free-text fields matching the client's Buyer
-- Info Sheet split: Agent Incentive (agent-encoded) and Realty Incentive
-- (admin-encoded). These live on the listing and are surfaced into the sales
-- report via the sales -> main_listings FK (see salesService SALE_SELECT).
ALTER TABLE public.main_listings
  ADD COLUMN IF NOT EXISTS agent_incentive  text,
  ADD COLUMN IF NOT EXISTS realty_incentive text;

COMMENT ON COLUMN public.main_listings.agent_incentive  IS 'Agent-facing incentive for selling this listing (agent-encoded). Free text.';
COMMENT ON COLUMN public.main_listings.realty_incentive IS 'Realty/brokerage incentive for this listing (admin-encoded). Free text.';
