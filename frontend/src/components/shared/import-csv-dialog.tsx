'use client';

import { useRef, useState } from 'react';
import { Upload, Download, FileSpreadsheet, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { api, friendlyError } from '@/lib/api';

interface ImportRowError {
  row: number;
  message: string;
}

interface ImportResult {
  created: number;
  skipped: number;
  errors: ImportRowError[];
}

interface Props {
  /** Display name shown in the dialog title, e.g. "Banks" */
  entityName: string;
  /** Backend endpoint path, e.g. "/banks/import" */
  endpoint: string;
  /** Column headers for the sample file */
  sampleHeaders: string[];
  /** Sample data rows (each inner array must match sampleHeaders length) */
  sampleRows: string[][];
  /** Called after a successful import so the parent can refresh its list */
  onSuccess: () => void;
}

function buildSampleCsv(headers: string[], rows: string[][]): string {
  const escape = (v: string) =>
    v.includes(',') || v.includes('"') || v.includes('\n')
      ? `"${v.replace(/"/g, '""')}"`
      : v;
  const lines = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))];
  return lines.join('\n');
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ImportCsvDialog({
  entityName,
  endpoint,
  sampleHeaders,
  sampleRows,
  onSuccess,
}: Props) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileError, setFileError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function handleDownloadSample() {
    const csv = buildSampleCsv(sampleHeaders, sampleRows);
    downloadBlob(csv, `sample_${entityName.toLowerCase().replace(/\s+/g, '_')}.csv`, 'text/csv');
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError('');
    setResult(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.postForm<ImportResult>(endpoint, formData);
      setResult(res);
      if (res.created > 0) onSuccess();
    } catch (err) {
      setFileError(friendlyError(err));
    } finally {
      setUploading(false);
      // Reset input so the same file can be re-uploaded if needed
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function handleClose(isOpen: boolean) {
    if (!isOpen) {
      setResult(null);
      setFileError('');
    }
    setOpen(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Import CSV / Excel
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import {entityName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Step 1 – Sample */}
          <div className="rounded-lg border p-4 space-y-2">
            <p className="text-sm font-medium">Step 1 — Download the sample file</p>
            <p className="text-xs text-muted-foreground">
              Fill in your data using the exact column headers in the sample. Do not rename or
              reorder columns.
            </p>
            <div className="rounded-md bg-muted px-3 py-2 font-mono text-xs text-muted-foreground break-all">
              {sampleHeaders.join(', ')}
            </div>
            <Button variant="outline" size="sm" onClick={handleDownloadSample}>
              <Download className="mr-2 h-4 w-4" />
              Download sample CSV
            </Button>
          </div>

          {/* Step 2 – Upload */}
          <div className="rounded-lg border p-4 space-y-2">
            <p className="text-sm font-medium">Step 2 — Upload your completed file</p>
            <p className="text-xs text-muted-foreground">Accepted formats: .csv, .xlsx, .xls (max 5 MB)</p>
            <label className="flex cursor-pointer items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                type="button"
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? 'Importing…' : 'Choose file & import'}
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
            {fileError && (
              <p className="text-xs text-destructive">{fileError}</p>
            )}
          </div>

          {/* Result */}
          {result && (
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {result.created} created
                </span>
                {result.skipped > 0 && (
                  <span className="flex items-center gap-1.5 text-amber-600">
                    <XCircle className="h-4 w-4" />
                    {result.skipped} skipped
                  </span>
                )}
              </div>

              {result.errors.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Row errors:</p>
                  {result.errors.map((e, idx) => (
                    <div key={idx} className="rounded bg-destructive/10 px-2 py-1 text-xs text-destructive">
                      Row {e.row}: {e.message}
                    </div>
                  ))}
                </div>
              )}

              {result.errors.length === 0 && (
                <p className="text-xs text-muted-foreground">All rows imported successfully.</p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
