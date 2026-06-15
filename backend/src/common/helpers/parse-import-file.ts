import * as XLSX from 'xlsx';
import { BadRequestException } from '@nestjs/common';

/**
 * Parses a CSV or XLSX buffer uploaded via multipart/form-data.
 * Returns the first sheet as an array of plain objects keyed by header row.
 * All values are returned as trimmed strings.
 */
export function parseImportFile(
  file: Express.Multer.File,
): Record<string, string>[] {
  if (!file) throw new BadRequestException('No file uploaded');

  const allowedMimes = new Set([
    'text/csv',
    'application/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ]);

  const mime = file.mimetype.toLowerCase();
  const ext = (file.originalname.split('.').pop() ?? '').toLowerCase();

  if (!allowedMimes.has(mime) && !['csv', 'xlsx', 'xls'].includes(ext)) {
    throw new BadRequestException('Only CSV and Excel (.xlsx/.xls) files are accepted');
  }

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(file.buffer, { type: 'buffer', cellText: true, raw: false });
  } catch {
    throw new BadRequestException('Could not read the file. Make sure it is a valid CSV or Excel file.');
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new BadRequestException('The file contains no sheets.');

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: false,
  });

  if (rows.length === 0) throw new BadRequestException('The file contains no data rows.');

  // Normalise all cell values to trimmed strings with snake_case keys
  return rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([k, v]) => [
        k.trim().toLowerCase().replace(/\s+/g, '_'),
        String(v ?? '').trim(),
      ]),
    ),
  );
}

export interface ImportRowError {
  row: number;
  message: string;
}

export interface ImportResult {
  created: number;
  skipped: number;
  errors: ImportRowError[];
}
