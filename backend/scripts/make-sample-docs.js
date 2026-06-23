// One-off: generate two minimal but valid PDFs (invoice + SWIFT copy) to use as
// sample payment-request attachments. No external deps — builds the PDF bytes
// with a correct cross-reference table so any viewer/parser accepts them.
const fs = require('fs');
const path = require('path');

function buildPdf(lines) {
  const esc = (s) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  let content = 'BT /F1 12 Tf 72 740 Td 16 TL\n';
  lines.forEach((l, i) => {
    content += `(${esc(l)}) Tj` + (i < lines.length - 1 ? ' T*\n' : '\n');
  });
  content += 'ET';

  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objs.forEach((body, i) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefPos = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((o) => { pdf += `${String(o).padStart(10, '0')} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
  return Buffer.from(pdf, 'latin1');
}

const invoice = buildPdf([
  'INVOICE',
  '',
  'Invoice No:  INV-2026-0042',
  'Invoice Date: 2026-06-23      Due Date: 2026-07-15',
  '',
  'Supplier:  Gulf Trade Partners LLC  (CP-004)',
  'Bill To:   Radiant World Capital Pte Ltd  (RWCAP-SG)',
  '',
  'Description: Iron ore shipment - PO Gulf-2026-118',
  '',
  'Amount Due:  USD 75,000.00',
]);

const swift = buildPdf([
  'SWIFT MT103 - Single Customer Credit Transfer  (COPY)',
  '',
  ':20:   REF-INV-2026-0042',
  ':23B:  CRED',
  ':32A:  260715USD75000,00',
  ':50K:  Radiant World Capital Pte Ltd / RWCAP-SG',
  ':57A:  UGBINL2A',
  ':59:   Gulf Trade Partners LLC',
  '       Acc BEN1000111',
  ':70:   PO Gulf-2026-118 / INV-2026-0042',
  ':71A:  SHA',
]);

const outDir = path.join(__dirname, '..', 'sample-docs');
fs.mkdirSync(outDir, { recursive: true });
const f1 = path.join(outDir, 'invoice-INV-2026-0042.pdf');
const f2 = path.join(outDir, 'swift-mt103-copy.pdf');
fs.writeFileSync(f1, invoice);
fs.writeFileSync(f2, swift);
console.log('Wrote:\n  ' + f1 + '\n  ' + f2);
