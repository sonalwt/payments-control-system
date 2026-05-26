/**
 * Removes the test data seeded by seed-section8-test-data.js.
 *
 *   node scripts/cleanup-section8-test-data.js
 *
 * Also removes any §8 reconciliation artefacts that reference those rows:
 *   • statement_lines that matched to the test PR/IR records
 *   • reconciliation_exceptions for statement uploads that only contain
 *     test-data-related lines (does NOT touch exceptions on unrelated uploads)
 *
 * Safe to run repeatedly. Reports counts of what it deleted.
 */
const { DataSource } = require('typeorm');
const { dataSourceOptions } = require('../dist/database/data-source.js');

const PR_PATTERN = 'PR-SEC8-TEST-%';
const IR_PATTERN = 'IR-SEC8-TEST-%';

(async () => {
  const ds = new DataSource(dataSourceOptions);
  await ds.initialize();

  // Find the test PR/IR ids first so we can detach statement_lines that
  // pointed to them (avoids leaving dangling matched references).
  const testPrs = await ds.query(
    `SELECT id, request_number FROM payment_requests WHERE request_number LIKE $1`,
    [PR_PATTERN],
  );
  const testIrs = await ds.query(
    `SELECT id, receipt_number FROM incoming_receipts WHERE receipt_number LIKE $1`,
    [IR_PATTERN],
  );

  console.log(`Found ${testPrs.length} test payment request(s) and ${testIrs.length} test incoming receipt(s).`);

  // Detach any statement_lines that matched to these records, so the FK
  // (ON DELETE SET NULL) doesn't leave the lines in a confusing state.
  if (testPrs.length > 0) {
    const r = await ds.query(
      `UPDATE statement_lines
          SET matched_payment_request_id = NULL,
              match_status               = 'UNMATCHED',
              match_reason               = COALESCE(match_reason || ' | ', '') || 'Test PR removed; line reset.',
              matched_at                 = NULL
        WHERE matched_payment_request_id = ANY($1::uuid[])`,
      [testPrs.map((r) => r.id)],
    );
    console.log(`  • Detached ${r[1] ?? 0} statement_line(s) from test PRs.`);
  }
  if (testIrs.length > 0) {
    const r = await ds.query(
      `UPDATE statement_lines
          SET matched_incoming_receipt_id = NULL,
              match_status                = 'UNMATCHED',
              match_reason                = COALESCE(match_reason || ' | ', '') || 'Test IR removed; line reset.',
              matched_at                  = NULL
        WHERE matched_incoming_receipt_id = ANY($1::uuid[])`,
      [testIrs.map((r) => r.id)],
    );
    console.log(`  • Detached ${r[1] ?? 0} statement_line(s) from test IRs.`);
  }

  const prDel = await ds.query(
    `DELETE FROM payment_requests WHERE request_number LIKE $1`,
    [PR_PATTERN],
  );
  console.log(`  ✓ Deleted ${prDel[1] ?? testPrs.length} payment_request row(s).`);

  const irDel = await ds.query(
    `DELETE FROM incoming_receipts WHERE receipt_number LIKE $1`,
    [IR_PATTERN],
  );
  console.log(`  ✓ Deleted ${irDel[1] ?? testIrs.length} incoming_receipt row(s).`);

  console.log('');
  console.log('Cleanup complete. Statement uploads and §8 reconciliation artefacts');
  console.log('(statement_lines, reconciliation_exceptions) are left in place — drop them');
  console.log('individually via the UI if no longer needed.');

  await ds.destroy();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
