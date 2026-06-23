// One-off: generate a bank-statement PDF (via pdf-lib, so the file is a valid
// PDF that pdf-parse/pdf.js reads cleanly) in the layout the reconciliation
// parser understands: a date-only line, narrative line, then a summary line
// holding "amount  running-balance" (each money value with 2 decimals).
//
// Statement for the Intesa Sanpaolo USD account (SS484-001-0001) — the account
// used by Trade Payment PR-2026-00072 and the incoming receipts.
//
// Opening balance: 2,600,000.00   Closing balance: 2,601,000.00
//   2026-06-18  +7,500.00 inward remittance (matches incoming receipt) -> 2,607,500.00
//   2026-06-20  -7,500.00 trade payment PR-2026-00072                  -> 2,600,000.00
//   2026-06-22  +1,000.00 misc credit                                  -> 2,601,000.00
const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts } = require('pdf-lib');

const LINES = [
  'INTESA SANPAOLO  (SINGAPORE BRANCH)',
  'ACCOUNT STATEMENT',
  'Account Name   : Radiant World Corporation Pte Ltd',
  'Account Number : SS484-001-0001      Currency: USD',
  'SWIFT/BIC      : BCITISGSGXXX',
  'Statement Period: 01 Jun 2026 to 30 Jun 2026',
  'Opening Balance: 2,600,000.00',
  'Closing Balance: 2,601,000.00',
  '',
  'Txn Date / Narrative / Amount / Running Balance',
  '',
  '2026-06-18',
  'INWARD REMITTANCE RECEIVED FROM ASIA METALS PTE LTD REF INW-2026-0098',
  '7,500.00          2,607,500.00',
  '2026-06-20',
  'OUTWARD TRADE PAYMENT TO GULF TRADE PARTNERS LLC PR-2026-00072 TT-2026-0451',
  '7,500.00          2,600,000.00',
  '2026-06-22',
  'INWARD CREDIT - MISCELLANEOUS ADJUSTMENT',
  '1,000.00          2,601,000.00',
  '',
  'End of statement.',
];

(async () => {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const font = await doc.embedFont(StandardFonts.Courier);
  const size = 11;
  const lineHeight = 15;
  let y = 760;
  for (const line of LINES) {
    if (line.length) page.drawText(line, { x: 50, y, size, font });
    y -= lineHeight;
  }
  // useObjectStreams:false => a traditional uncompressed xref table, which the
  // app's pdf-parse (old pdf.js) reads reliably. The default (object streams /
  // compressed xref) makes pdf-parse fail with "Invalid PDF structure".
  const bytes = await doc.save({ useObjectStreams: false });
  const outDir = path.join(__dirname, '..', 'sample-docs');
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, 'bank-statement-SS484-001-0001.pdf');
  fs.writeFileSync(out, bytes);
  console.log('Wrote: ' + out);
})();
