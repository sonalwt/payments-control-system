/**
 * Marks all pre-Section-8-Reconciliation migrations as already applied.
 * Use once on a DB bootstrapped via schema.sql + ad-hoc migrations so that
 * `npm run migration:run` only applies 1753-Section8Reconciliation.
 *
 *   node scripts/mark-prior-migrations.js
 */
const { DataSource } = require('typeorm');
const { dataSourceOptions } = require('../dist/database/data-source.js');

const rows = [
  ['1700000000000', 'InitialSchema1700000000000'],
  ['1701000000000', 'Section6BeneficiaryAccounts1701000000000'],
  ['1702000000000', 'Section7ExceptionReports1702000000000'],
  ['1703000000000', 'Section8VendorPaymentFields1703000000000'],
  ['1748000000000', 'AddApprovalMatrices1748000000000'],
  ['1749000000000', 'AddSanctionedCountries1749000000000'],
  ['1750000000000', 'Section5PayrollAndEbac1750000000000'],
  ['1751000000000', 'Section6Enhancements1751000000000'],
  ['1752000000000', 'IncomingReceipts1752000000000'],
];

(async () => {
  const ds = new DataSource(dataSourceOptions);
  await ds.initialize();
  await ds.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      timestamp BIGINT NOT NULL,
      name VARCHAR NOT NULL
    )
  `);
  for (const [t, n] of rows) {
    await ds.query(
      `INSERT INTO migrations(timestamp, name)
       SELECT $1::bigint, $2::varchar
       WHERE NOT EXISTS (SELECT 1 FROM migrations WHERE name = $2::varchar)`,
      [t, n],
    );
  }
  const applied = await ds.query('SELECT timestamp, name FROM migrations ORDER BY timestamp');
  console.log(`Marked ${applied.length} migrations as applied:`);
  for (const r of applied) console.log(`  ${r.timestamp}  ${r.name}`);
  await ds.destroy();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
