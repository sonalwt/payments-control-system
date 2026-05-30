-- §6.4 Anomaly flagging on payment requests
-- Adds two columns to payment_requests:
--   anomaly_flag  – boolean set to TRUE when one or more rules fire at submit time
--   anomaly_notes – newline-separated list of human-readable rule descriptions
ALTER TABLE payment_requests
  ADD COLUMN IF NOT EXISTS anomaly_flag  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS anomaly_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_pr_anomaly ON payment_requests (anomaly_flag)
  WHERE anomaly_flag = TRUE;
