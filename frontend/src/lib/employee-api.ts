'use client';

import { ApiError } from '@/lib/api';

/**
 * Employee self-service API client. Kept entirely separate from the staff
 * `api` client: it uses its own token under a distinct localStorage key so
 * the two auth realms never collide.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
const EMPLOYEE_TOKEN_KEY = 'pcs.employee.token';

export function getEmployeeToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(EMPLOYEE_TOKEN_KEY);
}

export function setEmployeeToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem(EMPLOYEE_TOKEN_KEY, token);
  else window.localStorage.removeItem(EMPLOYEE_TOKEN_KEY);
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getEmployeeToken();
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const text = await res.text();
  const body = text ? safeJson(text) : null;
  if (!res.ok) {
    const msg =
      body && typeof body === 'object' && 'message' in body
        ? Array.isArray((body as { message: unknown }).message)
          ? (body as { message: string[] }).message.join(', ')
          : String((body as { message: unknown }).message)
        : res.statusText || 'Request failed';
    throw new ApiError(res.status, msg, body);
  }
  return body as T;
}

export const employeeApi = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  upload,
};

async function upload(file: File): Promise<{ url: string; fileName: string }> {
  const token = getEmployeeToken();
  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const form = new FormData();
  form.append('file', file);

  // No Content-Type header — the browser sets the multipart boundary itself.
  const res = await fetch(`${API_URL}/employee/uploads/file`, {
    method: 'POST',
    headers,
    body: form,
  });
  const text = await res.text();
  const body = text ? safeJson(text) : null;
  if (!res.ok) {
    const msg =
      body && typeof body === 'object' && 'message' in body
        ? Array.isArray((body as { message: unknown }).message)
          ? (body as { message: string[] }).message.join(', ')
          : String((body as { message: unknown }).message)
        : res.statusText || 'Upload failed';
    throw new ApiError(res.status, msg, body);
  }
  return body as { url: string; fileName: string };
}

// ── Domain shapes used by the portal ───────────────────────────────────────

/** A supporting document attached to a reimbursement request. */
export interface EmployeeDocumentInput {
  documentCode: string;
  documentLabel?: string;
  fileName: string;
  fileUrl: string;
  fileSizeBytes?: number;
  mimeType?: string;
}

export interface EmployeeLoginResponse {
  accessToken: string;
  expiresIn: string;
  employee: { id: string; workEmail: string; fullName: string };
}

export interface EmployeePaymentType {
  id: string;
  code: string;
  name: string;
  description?: string | null;
}

export interface EmployeeBeneficiaryAccount {
  id: string;
  accountHolderName: string;
  accountNumber: string;
  iban?: string | null;
  currencyId: string;
  currency?: { id: string; code: string } | null;
  bank?: { id: string; name: string } | null;
}

export interface EmployeePaymentRequest {
  id: string;
  requestNumber: string;
  amount: string;
  status: string;
  purposeDescription?: string | null;
  createdAt: string;
  paymentType?: { code: string; name: string } | null;
  currency?: { code: string } | null;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
