// One-off: generate a sample inward-remittance / credit-advice PDF to upload as
// an incoming-receipt document. Credits the Deutsche Bank USD account used for
// the Trade Payment test (A/C 2025682-050, Radiant World Corporation Pte Ltd).
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
  objs.forEach((body, i) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${i + 1} 0 obj\n${body}\nendobj\n`; });
  const xrefPos = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((o) => { pdf += `${String(o).padStart(10, '0')} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
  return Buffer.from(pdf, 'latin1');
}

const advice = buildPdf([
  'DEUTSCHE BANK AG  (SINGAPORE BRANCH)',
  'INWARD REMITTANCE / CREDIT ADVICE',
  '',
  'Advice Date:  2026-06-23      Value Date: 2026-06-23',
  '',
  'Credit to Account:  2025682-050',
  'Account Name:       Radiant World Corporation Pte Ltd  (RWCORP-SG)',
  'SWIFT / BIC:        DEUTSGSG          Currency: USD',
  '',
  'Amount Credited:    USD 75,000.00',
  '',
  'Inward Reference:   INW-DB-2026-0098',
  'Remitter:           Asia Metals Pte Ltd',
  'Remitter Bank:      BCGE Geneva  (BCGECHGGXXX)',
  'Purpose:            Trade settlement - PO Gulf-2026-118 / INV-2026-0042',
  '',
  'This is a system-generated credit advice. No signature required.',
]);

const outDir = path.join(__dirname, '..', 'sample-docs');
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, 'incoming-receipt-credit-advice.pdf');
fs.writeFileSync(out, advice);
console.log('Wrote: ' + out);
