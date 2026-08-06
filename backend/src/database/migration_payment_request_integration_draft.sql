-- Integration drafts: a payment request may exist before its payment type.
--
-- The invoicing webhook cannot choose a payment type — the payment type selects
-- the approval matrix, i.e. who authorises the money, so it is never inferred by
-- a machine. Requests arrive as DRAFT with payment_type_id NULL and a human
-- maker classifies them before submitting (submit() rejects a NULL type).
--
-- The FK payment_requests_payment_type_id_fkey and the partial index
-- idx_pr_payment_type both tolerate NULL, so no other DDL is needed.
--
-- Supplier bank details from the inbound invoice are deliberately NOT stored in
-- a new column: when they match the beneficiary master the account is linked,
-- and when they do not they are appended to purpose_description so the maker
-- and approvers see them where they already look. Beneficiary accounts are
-- never created from them — that would bypass KYC and the cooling-off window.

ALTER TABLE payment_requests
  ALTER COLUMN payment_type_id DROP NOT NULL;

COMMENT ON COLUMN payment_requests.payment_type_id IS
  'NULL only for integration-created drafts awaiting classification by a maker.';
