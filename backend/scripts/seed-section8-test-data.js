/**
 * Seed test data so the §8 auto-matcher produces real MATCHED outcomes
 * against the rows in test-statement.csv.
 *
 *   node scripts/seed-section8-test-data.js
 *
 * Idempotent: re-running skips rows that already exist (matched by their
 * test request_number / receipt_number).
 *
 * What it inserts (against the first active AED CURRENT account, picking
 * the first available counterparty):
 *   • PAID payment_request   PR-SEC8-TEST-001  AED 15,000.00   UTR240518001  paid_at=2026-05-18
 *   • PAID payment_request   PR-SEC8-TEST-002  AED  7,500.50   UTR240519002  paid_at=2026-05-19
 *   • RECEIVED incoming_rec  IR-SEC8-TEST-001  AED 25,000.00   FT26052000123 received_at=2026-05-20
 *
 * After running this, upload test-statement.csv against the AED account
 * (statement date e.g. 2026-05-25), click Reconcile → Ingest & Auto-Match,
 * and these three rows will come back MATCHED with score 1.00. The
 * remaining five rows will become exceptions (as before).
 */
const { DataSource } = require('typeorm');
const { dataSourceOptions } = require('../dist/database/data-source.js');

(async () => {
  const ds = new DataSource(dataSourceOptions);
  await ds.initialize();

  // Pick anchor records.
  const accounts = await ds.query(
    `SELECT ba.id, ba.nickname, ba.legal_entity_id, c.code AS currency_code
       FROM bank_accounts ba
       JOIN currencies c ON c.id = ba.currency_id
      WHERE ba.is_active = true
        AND ba.account_type = 'CURRENT'
        AND ba.deleted_at IS NULL
        AND c.code = 'AED'
      ORDER BY ba.created_at
      LIMIT 1`,
  );
  if (accounts.length === 0) {
    console.error('No active AED CURRENT account found. Aborting.');
    process.exit(1);
  }
  const account = accounts[0];

  const counterparties = await ds.query(
    `SELECT id, name FROM counterparties WHERE deleted_at IS NULL ORDER BY name LIMIT 1`,
  );
  if (counterparties.length === 0) {
    console.error('No counterparty found. Aborting.');
    process.exit(1);
  }
  const cp = counterparties[0];

  console.log(`Anchor account     : ${account.nickname} (${account.currency_code})`);
  console.log(`Anchor counterparty: ${cp.name}`);
  console.log('');

  // ── PAYMENT REQUEST 1 ────────────────────────────────────────────────
  await upsertPaymentRequest(ds, {
    requestNumber: 'PR-SEC8-TEST-001',
    legalEntityId: account.legal_entity_id,
    counterpartyId: cp.id,
    sourceAccountId: account.id,
    currencyCode: account.currency_code,
    amount: '15000.0000',
    amountMinor: 1500000,
    bankReference: 'UTR240518001',
    paidAt: '2026-05-18',
    valueDate: '2026-05-18',
  });

  // ── PAYMENT REQUEST 2 ────────────────────────────────────────────────
  await upsertPaymentRequest(ds, {
    requestNumber: 'PR-SEC8-TEST-002',
    legalEntityId: account.legal_entity_id,
    counterpartyId: cp.id,
    sourceAccountId: account.id,
    currencyCode: account.currency_code,
    amount: '7500.5000',
    amountMinor: 750050,
    bankReference: 'UTR240519002',
    paidAt: '2026-05-19',
    valueDate: '2026-05-19',
  });

  // ── INCOMING RECEIPT 1 ───────────────────────────────────────────────
  await upsertIncomingReceipt(ds, {
    receiptNumber: 'IR-SEC8-TEST-001',
    legalEntityId: account.legal_entity_id,
    counterpartyId: cp.id,
    receiveFromAccountId: account.id,
    currencyCode: account.currency_code,
    expectedAmount: '25000.0000',
    receivedAmount: '25000.0000',
    inwardBankReference: 'FT26052000123',
    receivedAt: '2026-05-20',
  });

  console.log('');
  console.log(`✓ Seed complete. Now in the UI:`);
  console.log(`  1. Banking → Statement Uploads → New Upload`);
  console.log(`  2. Account: "${account.nickname}"`);
  console.log(`  3. Statement Date: 2026-05-25  Opening: 500000  Closing: 469700`);
  console.log(`  4. File: c:\\payments-control-system\\test-statement.csv`);
  console.log(`  5. Click Reconcile → Ingest & Auto-Match`);
  console.log(`  Expect: 3 lines MATCHED (score 1.00), 5 lines → exceptions.`);

  await ds.destroy();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

async function upsertPaymentRequest(ds, p) {
  const exists = await ds.query(
    `SELECT id FROM payment_requests WHERE request_number = $1`,
    [p.requestNumber],
  );
  if (exists.length > 0) {
    console.log(`  • ${p.requestNumber} already exists — skipped.`);
    return;
  }
  await ds.query(
    `
    INSERT INTO payment_requests (
      request_number, payment_type_code, legal_entity_id, counterparty_id,
      currency_code, amount, amount_minor, is_cross_currency,
      source_account_id, bank_reference, value_date, paid_at,
      status, is_amount_locked, sanction_warning,
      submitted_at, approved_at,
      created_at, updated_at
    ) VALUES (
      $1, 'VENDOR_PAYMENT', $2, $3,
      $4, $5::numeric, $6::bigint, false,
      $7, $8, $9::date, ($9::date)::timestamptz,
      'PAID', false, false,
      ($9::date - interval '2 days')::timestamptz,
      ($9::date - interval '1 day')::timestamptz,
      now(), now()
    )
    `,
    [
      p.requestNumber,
      p.legalEntityId,
      p.counterpartyId,
      p.currencyCode,
      p.amount,
      p.amountMinor,
      p.sourceAccountId,
      p.bankReference,
      p.paidAt,
    ],
  );
  console.log(`  ✓ ${p.requestNumber} inserted (PAID, ${p.currencyCode} ${p.amount}, ref ${p.bankReference}).`);
}

async function upsertIncomingReceipt(ds, r) {
  const exists = await ds.query(
    `SELECT id FROM incoming_receipts WHERE receipt_number = $1`,
    [r.receiptNumber],
  );
  if (exists.length > 0) {
    console.log(`  • ${r.receiptNumber} already exists — skipped.`);
    return;
  }
  await ds.query(
    `
    INSERT INTO incoming_receipts (
      receipt_number, legal_entity_id, counterparty_id, receive_from_account_id,
      expected_amount, expected_currency_code,
      received_amount, received_currency_code, inward_bank_reference,
      status, submitted_at, received_at,
      created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4,
      $5::numeric, $6,
      $7::numeric, $6, $8,
      'RECEIVED',
      ($9::date - interval '2 days')::timestamptz,
      ($9::date)::timestamptz,
      now(), now()
    )
    `,
    [
      r.receiptNumber,
      r.legalEntityId,
      r.counterpartyId,
      r.receiveFromAccountId,
      r.expectedAmount,
      r.currencyCode,
      r.receivedAmount,
      r.inwardBankReference,
      r.receivedAt,
    ],
  );
  console.log(`  ✓ ${r.receiptNumber} inserted (RECEIVED, ${r.currencyCode} ${r.receivedAmount}, ref ${r.inwardBankReference}).`);
}
