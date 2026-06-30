'use client';

import * as React from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';
import { presignFileUrl, type PresignFn } from '@/lib/api';

/**
 * Static stand-in shown whenever a record has no attached file or its file
 * can't be presigned (e.g. a missing/invalid reference). Served from /public so
 * the iframe can always render *something* instead of failing.
 */
const PLACEHOLDER_FILE = '/placeholder-document.svg';

/** Best-effort display name from a stored file URL (last path segment). */
function nameFromUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const path = url.split('?')[0].split('#')[0];
  const seg = path.substring(path.lastIndexOf('/') + 1);
  if (!seg) return undefined;
  try {
    return decodeURIComponent(seg);
  } catch {
    return seg;
  }
}

/**
 * Inline file preview for stored documents. `openPreview` mints a short-lived
 * presigned URL and renders the file in an embedded panel *on the page* (not a
 * popup/modal) — an iframe shows PDFs and images directly.
 *
 * If the file is unavailable (no URL, or presign fails) the panel falls back to
 * a placeholder document rather than erroring.
 *
 * Files live in a private S3 bucket, so the presign call is realm-specific —
 * pass `presign` (e.g. the employee-realm presign) where needed; it defaults to
 * the staff realm.
 *
 * Render `preview` in the page where the document should appear, and wire a
 * control to `openPreview(fileUrl, fileName?)`. `preview` renders nothing until
 * a file is opened.
 */
export function useFilePreview(presign: PresignFn = presignFileUrl): {
  openPreview: (fileUrl: string | null | undefined, fileName?: string) => Promise<void>;
  closePreview: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoom: number;
  preview: React.ReactElement;
  isOpen: boolean;
  loading: boolean;
} {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState<string | undefined>(undefined);
  const [loading, setLoading] = React.useState(false);
  const [zoom, setZoom] = React.useState(1);

  const closePreview = React.useCallback(() => setPreviewUrl(null), []);
  const zoomIn = React.useCallback(() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2))), []);
  const zoomOut = React.useCallback(() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2))), []);

  const openPreview = React.useCallback(
    async (fileUrl: string | null | undefined, fileName?: string): Promise<void> => {
      // Keep the record's real name on the panel even when we fall back to the
      // placeholder — the dummy is shown "as" the missing file.
      setTitle(fileName ?? nameFromUrl(fileUrl));
      setZoom(1);
      if (!fileUrl) {
        setPreviewUrl(PLACEHOLDER_FILE);
        return;
      }
      setLoading(true);
      try {
        const url = await presign(fileUrl);
        setPreviewUrl(url);
      } catch {
        // Missing/invalid reference or transient presign failure — show the
        // placeholder so View always renders something.
        setPreviewUrl(PLACEHOLDER_FILE);
      } finally {
        setLoading(false);
      }
    },
    [presign],
  );

  const preview = (
    <>
      {previewUrl && (
        <div className="flex flex-col overflow-hidden rounded-lg border bg-background">
          <div className="flex items-center justify-between gap-2 border-b px-4 py-2">
            <span className="truncate text-sm font-medium" title={title}>
              {title ?? 'Preview'}
            </span>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={zoomOut}
                disabled={zoom <= 0.5}
                aria-label="Zoom out"
                title="Zoom out"
                className="rounded-sm p-1 text-muted-foreground hover:text-foreground disabled:opacity-40"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="w-12 text-center text-xs tabular-nums text-muted-foreground">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={zoomIn}
                disabled={zoom >= 3}
                aria-label="Zoom in"
                title="Zoom in"
                className="rounded-sm p-1 text-muted-foreground hover:text-foreground disabled:opacity-40"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <span className="mx-1 h-4 w-px bg-border" />
              <button
                type="button"
                onClick={closePreview}
                aria-label="Close preview"
                title="Close"
                className="rounded-sm p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="h-[600px] overflow-auto bg-muted/20">
            <iframe
              src={previewUrl}
              title={title ?? 'File preview'}
              className="h-[600px] w-full border-0"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
            />
          </div>
        </div>
      )}
    </>
  );

  return { openPreview, closePreview, zoomIn, zoomOut, zoom, preview, isOpen: previewUrl !== null, loading };
}
