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

  // HTTP-status-based overrides first
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return 'The requested record was not found.';
  if (status >= 500) return 'An unexpected server error occurred. Please try again or contact support.';

  // Pattern-match well-known backend messages → user-friendly text
  const lower = raw.toLowerCase();

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
  if (lower.includes('missing') && lower.includes('document'))
    return 'One or more required supporting documents are missing. Please upload all required documents first.';
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
  if (lower.includes('must provide') || lower.includes('is required') || lower.includes('should not be empty'))
    return raw; // Keep validation messages — they're already user-readable from class-validator

  // Generic fallback: return the raw message but strip any JSON / stack noise
  if (raw.length > 200) return 'An unexpected error occurred. Please try again.';
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
  postForm: <T>(path: string, formData: FormData) => formRequest<T>(path, formData),
};
