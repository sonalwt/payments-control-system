const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
// Backend origin without the /api/vN path — used to construct static file URLs.
const BACKEND_ORIGIN = API_URL.replace(/\/api\/v\d+\/?$/, '');
const TOKEN_KEY = 'pcs.token';

/**
 * Returns a full URL for a stored file path.
 * Paths starting with /uploads/ are relative to the backend origin.
 */
export function resolveFileUrl(fileUrl: string): string {
  if (fileUrl.startsWith('/uploads/')) return `${BACKEND_ORIGIN}${fileUrl}`;
  return fileUrl;
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const text = await res.text();
  const body = text ? safeJson(text) : null;
  if (!res.ok) {
    const msg =
      (body && typeof body === 'object' && 'message' in body
        ? Array.isArray((body as { message: unknown }).message)
          ? ((body as { message: string[] }).message.join(', '))
          : String((body as { message: unknown }).message)
        : res.statusText) || 'Request failed';
    throw new ApiError(res.status, msg, body);
  }
  return body as T;
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

async function uploadRequest<T>(path: string, file: File): Promise<T> {
  const token = getToken();
  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });
  const text = await res.text();
  const body = text ? safeJson(text) : null;
  if (!res.ok) {
    const msg =
      (body && typeof body === 'object' && 'message' in body
        ? Array.isArray((body as { message: unknown }).message)
          ? ((body as { message: string[] }).message.join(', '))
          : String((body as { message: unknown }).message)
        : res.statusText) || 'Upload failed';
    throw new ApiError(res.status, msg, body);
  }
  return body as T;
}

async function formRequest<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken();
  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });
  const text = await res.text();
  const body = text ? safeJson(text) : null;
  if (!res.ok) {
    const msg =
      (body && typeof body === 'object' && 'message' in body
        ? Array.isArray((body as { message: unknown }).message)
          ? ((body as { message: string[] }).message.join(', '))
          : String((body as { message: unknown }).message)
        : res.statusText) || 'Request failed';
    throw new ApiError(res.status, msg, body);
  }
  return body as T;
}

/**
 * Translates any API / network error into a plain, user-readable sentence.
 * Use this in every `onError` handler instead of `err.message`.
 */
export function friendlyError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  const status = err instanceof ApiError ? err.status : 0;

  // 401 / 403 are always generic — the backend message adds no value here.
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to perform this action.';

  // Pattern-match well-known backend messages BEFORE falling back to
  // status-based generics — this ensures specific errors are always shown.
  const lower = raw.toLowerCase();

  // Approval matrix errors
  if (lower.includes('no published approval matrix'))
    return `No approval matrix is configured for this payment type. Ask your administrator to create and publish one under Payment Types & Approvals.`;
  if (lower.includes('no band') && lower.includes('matrix') && lower.includes('covers'))
    return 'The payment amount falls outside the bands defined in the approval matrix. Ask your administrator to update the matrix bands under Payment Types & Approvals.';
  // Matrix band-shape validation raised while *saving* a matrix — show the
  // real cause rather than the payment-amount message below.
  if (lower.includes('maxamount') && lower.includes('minamount'))
    return "A band's maximum amount must be greater than its minimum amount. Check the band ranges in the matrix.";
  if (lower.includes('open-ended band'))
    return 'Only one open-ended band (a band with no maximum amount) is allowed per matrix.';

  if (lower.includes('cooling') && lower.includes('period'))
    return 'This account is still within its cooling-off period. Use Force Activate to override, or wait for it to expire.';
  if (lower.includes('cooling'))
    return 'Cooling-off period has not yet elapsed for this account.';
  if (lower.includes('sanctioned') || lower.includes('sanction_warning') || lower.includes('sanctionacknowledgement'))
    return 'This request involves a sanctioned country. A written acknowledgement is required before approving.';
  if (lower.includes('callback') && lower.includes('required'))
    return 'Callback evidence is required for ADD and MODIFY requests.';
  if (lower.includes('callback'))
    return 'Callback evidence must be provided before verifying this request.';
  if (lower.includes('required document') || (lower.includes('missing') && lower.includes('document')))
    return raw; // Already user-readable: lists exactly which documents are missing
  if (lower.includes('duplicate key') || lower.includes('already exists') || lower.includes('unique constraint'))
    return 'A record with this information already exists.';
  if (lower.includes('foreign key') || lower.includes('referenced by'))
    return 'This record is in use by other data and cannot be deleted.';
  if (lower.includes('verified_by') && lower.includes('requested_by'))
    return 'The verifier cannot be the same person who created this request (maker-checker rule).';
  if (lower.includes('not in pending_verification') || lower.includes('not in verified'))
    return 'This request cannot be actioned because its current status does not allow this operation.';
  if (lower.includes('cannot be cancelled') || lower.includes('cannot cancel'))
    return 'This request cannot be cancelled in its current status.';
  if (lower.includes('insufficient') || lower.includes('minimum balance'))
    return 'The selected account does not have sufficient balance for this payment.';
  if (lower.includes('do not hold the required role'))
    return 'You do not have the required approval role for this legal entity. Ask your administrator.';
  if (lower.includes('not the designated approver'))
    return 'This step is assigned to a specific approver and you are not that person.';
  if (lower.includes('no pending approval step'))
    return 'This step has already been actioned. Please refresh to see the latest status.';
  if (lower.includes('pending_approval status'))
    return 'This request is no longer awaiting approval. Please refresh.';
  if (lower.includes('active') && lower.includes('beneficiary'))
    return 'Only ACTIVE beneficiary accounts can be used as a copy source.';
  if (lower.includes('status') && lower.includes('cannot') && lower.includes('edit'))
    return raw; // Status transition errors are already clear
  if (lower.includes('must provide') || lower.includes('is required') || lower.includes('should not be empty'))
    return raw; // class-validator messages are already user-readable

  // ── Common 500-class causes ──────────────────────────────────────────────
  // The backend HttpExceptionFilter forwards the original exception message
  // for 500s, so we can still pattern-match and show something actionable.
  if (lower.includes('database error') || lower.includes('query failed'))
    return 'A database error occurred. Please try again. If the problem persists, contact your system administrator.';
  if (lower.includes('connection') && lower.includes('refused'))
    return 'Could not connect to the server. Please check that the backend service is running.';
  if (lower.includes('jwt') || lower.includes('token') || lower.includes('unauthorized'))
    return 'Your session has expired or is invalid. Please sign in again.';
  if (lower.includes('entity') && lower.includes('not found'))
    return 'The record you are trying to access no longer exists. It may have been deleted.';
  if (lower.includes('no approval') || lower.includes('approval matrix'))
    return 'No approval matrix is configured for this payment type. Ask your administrator to set one up under Payment Types & Approvals.';
  if (lower.includes('payment amount') && (lower.includes('band') || lower.includes('range')))
    return 'The payment amount is outside the configured approval bands. Ask your administrator to update the matrix.';
  if (lower.includes('status') && lower.includes('draft'))
    return 'This action can only be performed on a Draft request.';
  if (lower.includes('beneficiary') && lower.includes('active'))
    return 'The beneficiary account must be in ACTIVE status before a payment can be submitted.';
  if (lower.includes('source account') || lower.includes('bank account'))
    return 'The selected bank account is not available or does not exist.';

  // For 404 and 500: if the backend sent a specific message (not the default
  // NestJS generic text) pass it through directly so the user sees exactly what
  // went wrong instead of a vague fallback.
  const isGenericBackendMsg =
    raw === 'Internal server error' ||
    raw === 'Not Found' ||
    raw === 'Bad Gateway' ||
    raw.toLowerCase() === 'request failed';

  if (!isGenericBackendMsg && raw.length > 0 && raw.length <= 300) return raw;

  if (status === 404) return 'The requested record was not found.';
  if (status >= 500) return 'An unexpected server error occurred. Please try again or contact support.';

  // Generic fallback
  if (raw.length > 300) return 'An unexpected error occurred. Please try again.';
  return raw || 'An unexpected error occurred. Please try again.';
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload: (file: File) =>
    uploadRequest<{ url: string; fileName: string }>('/uploads/file', file),
  /**
   * Best-effort, local read of an invoice PDF for cross-checking against the
   * entered values. Advisory only — the file is not stored by this call.
   */
  extractInvoice: (file: File) =>
    uploadRequest<ExtractedInvoice>('/uploads/extract-invoice', file),
  /**
   * Best-effort, local read of a bank remittance / SWIFT / MT103 copy for
   * cross-checking the entered reference + amount. Advisory only; not stored.
   */
  extractRemittance: (file: File) =>
    uploadRequest<ExtractedRemittance>('/uploads/extract-remittance', file),
  postForm: <T>(path: string, formData: FormData) => formRequest<T>(path, formData),
};

/** Fields read off an uploaded invoice (warn-only cross-check). */
export interface ExtractedInvoice {
  readable: boolean;
  reason?: string;
  invoiceNumber: string | null;
  amount: string | null;
}

/** Fields read off an uploaded remittance / SWIFT / MT103 copy. */
export interface ExtractedRemittance {
  readable: boolean;
  reason?: string;
  referenceNumber: string | null;
  amount: string | null;
}

// ── Stored-file viewing & downloading ──────────────────────────────────────
// Files live in a private S3 bucket. The backend mints a short-lived presigned
// URL on demand; the SPA never touches a public object URL. The presign call is
// realm-specific (staff vs. employee), so it is injected as `PresignFn`.

/** Asks the backend for a short-lived presigned URL for a stored file. */
export type PresignFn = (
  fileUrl: string,
  opts?: { download?: boolean; fileName?: string },
) => Promise<string>;

/** Staff-realm presign (uses the staff token). */
export const presignFileUrl: PresignFn = async (fileUrl, opts) => {
  const params = new URLSearchParams({ url: fileUrl });
  if (opts?.download) params.set('download', '1');
  if (opts?.fileName) params.set('fileName', opts.fileName);
  const res = await api.get<{ url: string }>(`/uploads/presign?${params.toString()}`);
  return res.url;
};

/**
 * Resolve a stored file reference to a URL the browser can open directly
 * (iframe src, new tab, download). Local files (served by the backend at
 * `/uploads/...`) are used as-is; private S3 objects need a short-lived
 * presigned URL. This lets file viewing work in both dev (local disk) and
 * production (S3) without the caller knowing where the file lives.
 */
export async function resolveViewableUrl(
  fileUrl: string,
  presign: PresignFn = presignFileUrl,
  opts?: { download?: boolean; fileName?: string },
): Promise<string> {
  if (fileUrl.startsWith('/uploads/') || fileUrl.startsWith(BACKEND_ORIGIN)) {
    return resolveFileUrl(fileUrl);
  }
  return presign(fileUrl, opts);
}

/**
 * Open a stored file inline in a new tab. The blank tab is opened synchronously
 * (inside the click gesture) to avoid popup blockers, then redirected to the
 * resolved URL once it resolves.
 */
export async function viewFile(fileUrl: string, presign: PresignFn = presignFileUrl): Promise<void> {
  // Open the tab synchronously (inside the click gesture) so it isn't blocked.
  // Can't pass 'noopener' here — that returns null and we'd lose the handle —
  // so sever the opener manually to avoid reverse-tabnabbing.
  const w = window.open('', '_blank');
  if (w) { try { w.opener = null; } catch { /* ignore */ } }
  try {
    const url = await resolveViewableUrl(fileUrl, presign);
    if (w) w.location.href = url;
    else window.open(url, '_blank', 'noopener');
  } catch {
    if (w) w.close();
  }
}

/**
 * Force a direct download of a stored file. The presigned URL carries
 * `Content-Disposition: attachment` from S3, so navigating to it saves the file
 * (with its original name) rather than opening it — no blob/CORS needed.
 */
export async function downloadFile(
  fileUrl: string,
  fileName?: string,
  presign: PresignFn = presignFileUrl,
): Promise<void> {
  const url = await resolveViewableUrl(fileUrl, presign, { download: true, fileName });
  const a = document.createElement('a');
  a.href = url;
  if (fileName) a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
