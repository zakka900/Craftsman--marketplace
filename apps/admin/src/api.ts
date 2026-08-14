/** Client API minimale verso lo stesso backend NestJS usato dall'app mobile. */
const API_URL = import.meta.env.VITE_API_URL || 'https://artisanbackend-production.up.railway.app/api';

const TOKEN_KEY = 'artisan_admin_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function api<T = any>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? (options.body !== undefined ? 'POST' : 'GET'),
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined
  });

  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }

  if (!res.ok) {
    const msg = Array.isArray(data?.message) ? data.message[0] : data?.message || `HTTP_${res.status}`;
    throw new ApiError(msg, res.status);
  }
  return data as T;
}

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'CLIENT' | 'ADMIN';
}

export async function login(email: string, password: string): Promise<AdminUser> {
  const res = await api<{ token: string; user: AdminUser }>('/auth/login', { body: { email, password } });
  if (res.user.role !== 'ADMIN') throw new ApiError('NOT_ADMIN', 403);
  setToken(res.token);
  return res.user;
}

export interface Dispute {
  id: string;
  requestId: string;
  clientId: string;
  reason: string;
  description: string;
  photos: string[];
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED_CLIENT' | 'RESOLVED_ARTISAN' | 'CLOSED';
  createdAt: string;
  client: { firstName: string; lastName: string; email: string };
  request: {
    id: string;
    categoryId: string;
    description: string;
    contract?: {
      artisan?: { name: string };
      payment?: { status: string; providerId?: string };
    } | null;
  };
}

export function listDisputes(): Promise<Dispute[]> {
  return api<Dispute[]>('/admin/disputes');
}

export function resolveDispute(id: string, resolution: 'CLIENT' | 'ARTISAN'): Promise<{ ok: boolean }> {
  return api(`/admin/disputes/${id}/resolve`, { body: { resolution } });
}
