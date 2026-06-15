'use client';

import { Download, Eye } from 'lucide-react';
import { downloadFile, viewFile, type PresignFn } from '@/lib/api';

/**
 * Standard pair of controls for a stored file/document:
 *   - View (eye)  — opens the file inline in a new tab (presigned, private bucket)
 *   - Download    — forces a direct download (Save) with the original filename
 *
 * Files live in a private S3 bucket, so both actions go through a short-lived
 * presigned URL minted by the backend. The presign call is realm-specific, so
 * pass `presign` (e.g. the employee-realm presign) where needed; it defaults to
 * the staff realm.
 */
export function FileActions({
  fileUrl,
  fileName,
  presign,
  className,
}: {
  fileUrl: string;
  fileName?: string;
  presign?: PresignFn;
  className?: string;
}): React.ReactElement {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <button
        type="button"
        onClick={() => { void viewFile(fileUrl, presign); }}
        title="View"
        aria-label="View"
        className="text-muted-foreground hover:text-foreground"
      >
        <Eye className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => { void downloadFile(fileUrl, fileName, presign); }}
        title="Download"
        aria-label="Download"
        className="text-muted-foreground hover:text-foreground"
      >
        <Download className="h-4 w-4" />
      </button>
    </span>
  );
}
