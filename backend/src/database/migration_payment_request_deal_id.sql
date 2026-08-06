-- Trade deal reference on a payment request.
--
-- Trade payments settle against a deal, and that reference is how finance ties
-- a payment back to the trade. Held as its own column rather than inside the
-- purpose text so it can be searched, filtered and reported on.
--
-- Not unique: a single deal is commonly settled by several invoices.
-- Nullable: only trade payments carry one, and existing rows have none.

ALTER TABLE payment_requests
  ADD COLUMN IF NOT EXISTS deal_id varchar(100);

COMMENT ON COLUMN payment_requests.deal_id IS
  'Upstream trade deal reference this payment settles. Not unique — a deal may be settled by several invoices.';

-- Supports lookup by deal ("everything paid against DL-2026-0042"). Partial, so
-- the index only carries rows that actually have a deal.
CREATE INDEX IF NOT EXISTS idx_pr_deal_id
  ON payment_requests (deal_id)
  WHERE deal_id IS NOT NULL AND deleted_at IS NULL;
