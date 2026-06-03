-- =====================================================================
-- Payments Control System — Remove the document policy from payment types.
--
-- Payment types no longer carry a per-type document policy. The column is
-- dropped; document attachment on requests is no longer policy-driven.
--
-- Idempotent.
-- =====================================================================

ALTER TABLE payment_types
    DROP COLUMN IF EXISTS document_policy;
