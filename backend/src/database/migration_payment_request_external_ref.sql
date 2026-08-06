-- Integration webhook support (invoicing app -> payment request).
--
-- Records where an integration-created payment request came from, and gives
-- the webhook an idempotency key so a retried delivery returns the existing
-- request instead of raising a second payment for the same invoice.

ALTER TABLE payment_requests
  ADD COLUMN IF NOT EXISTS external_source varchar(50);

ALTER TABLE payment_requests
  ADD COLUMN IF NOT EXISTS external_reference varchar(200);

COMMENT ON COLUMN payment_requests.external_source IS
  'Originating system for integration-created requests (e.g. INVOICING).';
COMMENT ON COLUMN payment_requests.external_reference IS
  'Idempotency key from the originating system (its invoice id).';

-- One live payment request per (source, external invoice id). Soft-deleted
-- rows are excluded so a deleted draft does not block a re-delivery.
CREATE UNIQUE INDEX IF NOT EXISTS uq_pr_external_ref
  ON payment_requests (external_source, external_reference)
  WHERE external_reference IS NOT NULL AND deleted_at IS NULL;
