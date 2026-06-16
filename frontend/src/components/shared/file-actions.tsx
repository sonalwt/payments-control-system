'use client';

import { Download, Eye, Loader2 } from 'lucide-react';
import { downloadFile, type PresignFn } from '@/lib/api';
import { useFilePreview } from './use-file-preview';

/**
 * Standard pair of controls for a stored file/document:
 *   - View (eye)  — shows the file in an embedded panel on the page (presigned,
 *                   private bucket); an iframe renders PDFs and images directly
 *   - Download    — forces a direct download (Save) with the original filename
 *
 * Files live in a private S3 bucket, so both actions go through a short-lived
 * presigned URL minted by the backend. The presign call is realm-specific, so
 * pass `presign` (e.g. the employee-realm presign) where needed; it defaults to
 * the staff realm.
 *
 * By default the preview panel renders right below these controls. Pass `onView`
 * to instead hand the click up to the page (e.g. to render the document in a
 * dedicated page area) — when set, FileActions renders no panel of its own.
 */
export function FileActions({
  fileUrl,
  fileName,
  presign,
  className,
  onView,
}: {
  fileUrl: string;
  fileName?: string;
  presign?: PresignFn;
  className?: string;
  onView?: (fileUrl: string, fileName?: string) => void;
}): React.ReactElement {
  const { openPreview, preview, loading } = useFilePreview(presign);
  const handleView = onView ?? ((u, n) => { void openPreview(u, n); });

  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <button
        type="button"
        onClick={() => handleView(fileUrl, fileName)}
        disabled={loading}
        title="View"
        aria-label="View"
        className="text-muted-foreground hover:text-foreground disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
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
      {!onView && preview}
    </span>
  );
}
