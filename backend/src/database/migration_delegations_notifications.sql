-- Migration: Delegations & Notifications
-- Created for delegation workflow continuity feature

-- ── Delegations ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS delegations (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  delegator_id UUID         NOT NULL REFERENCES users(id),
  delegatee_id UUID         NOT NULL REFERENCES users(id),
  start_date   DATE         NOT NULL,
  end_date     DATE         NOT NULL,
  reason       TEXT,
  status       VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE | CANCELLED | EXPIRED
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ,
  created_by   UUID,
  updated_by   UUID,
  CONSTRAINT no_self_delegation CHECK (delegator_id <> delegatee_id),
  CONSTRAINT chk_delegation_dates CHECK (end_date >= start_date),
  CONSTRAINT chk_delegation_status CHECK (status IN ('ACTIVE','CANCELLED','EXPIRED'))
);

CREATE INDEX IF NOT EXISTS idx_delegations_delegator ON delegations(delegator_id);
CREATE INDEX IF NOT EXISTS idx_delegations_delegatee ON delegations(delegatee_id, status);

-- ── Notifications ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID         NOT NULL REFERENCES users(id),
  type       VARCHAR(50)  NOT NULL,     -- DELEGATION_ASSIGNED | DELEGATION_CANCELLED
  title      VARCHAR(200) NOT NULL,
  message    TEXT         NOT NULL,
  is_read    BOOLEAN      NOT NULL DEFAULT false,
  metadata   JSONB,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
