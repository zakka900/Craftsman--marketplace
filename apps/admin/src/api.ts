/** Minimal API client for the same NestJS backend used by the mobile app. */
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

export interface Stats {
  totalUsers: number;
  totalArtisans: number;
  totalRequests: number;
  requestsByStatus: Record<string, number>;
  openDisputes: number;
  revenueByCurrency: { currency: string; total: number }[];
}

export function getStats(): Promise<Stats> {
  return api<Stats>('/admin/stats');
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ClientRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  emailVerified: boolean;
  bankVerified: boolean;
  createdAt: string;
  _count: { requests: number };
}

export function listUsers(page: number, search?: string): Promise<Page<ClientRow>> {
  const q = new URLSearchParams({ page: String(page), ...(search ? { search } : {}) });
  return api<Page<ClientRow>>(`/admin/users?${q}`);
}

export interface ArtisanRow {
  id: string;
  name: string;
  categoryId: string;
  city: string;
  country: string;
  verified: boolean;
  rating: number;
  jobsDone: number;
  _count: { contracts: number };
}

export function listArtisans(page: number, search?: string): Promise<Page<ArtisanRow>> {
  const q = new URLSearchParams({ page: String(page), ...(search ? { search } : {}) });
  return api<Page<ArtisanRow>>(`/admin/artisans?${q}`);
}

export type RequestStatus =
  | 'AWAITING_QUOTES' | 'QUOTES_RECEIVED' | 'ARTISAN_SELECTED' | 'IN_PROGRESS'
  | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';

export interface RequestRow {
  id: string;
  categoryId: string;
  subcategory: string;
  city: string;
  status: RequestStatus;
  createdAt: string;
  client: { firstName: string; lastName: string; email: string };
  contract: { price: number; currency: string; artisan: { name: string } } | null;
  _count: { quotes: number };
}

export function listRequests(page: number, status?: string): Promise<Page<RequestRow>> {
  const q = new URLSearchParams({ page: String(page), ...(status ? { status } : {}) });
  return api<Page<RequestRow>>(`/admin/requests?${q}`);
}

export interface RequestDetail {
  id: string;
  categoryId: string;
  subcategory: string;
  description: string;
  photos: string[];
  city: string;
  propertyType: string;
  urgency: string;
  budgetMin: number | null;
  budgetMax: number | null;
  status: RequestStatus;
  stage: string | null;
  createdAt: string;
  client: { firstName: string; lastName: string; email: string; phone: string | null; country: string };
  quotes: { id: string; price: number; laborCost: number; materials: number; days: number; note: string | null; recommended: boolean; createdAt: string; artisan: { name: string; city: string } }[];
  infoRequests: { id: string; question: string; replyText: string | null; createdAt: string; artisan: { name: string } }[];
  contract: {
    id: string; price: number; currency: string; scope: string; days: number; signedAt: string | null;
    artisan: { name: string };
    payment: { status: string; amount: number; currency: string; method: string } | null;
  } | null;
  dispute: { id: string; reason: string; description: string; status: string; createdAt: string } | null;
  review: { rating: number; quality: number; punctuality: number; cleanliness: number; communication: number; text: string | null; createdAt: string } | null;
  events: { id: string; type: string; text: string; createdAt: string }[];
}

export function getRequestDetail(id: string): Promise<RequestDetail> {
  return api<RequestDetail>(`/admin/requests/${id}`);
}

export interface PaymentRow {
  id: string;
  amount: number;
  currency: string;
  method: string;
  status: 'PENDING' | 'HELD_ESCROW' | 'RELEASED' | 'REFUNDED' | 'FAILED';
  createdAt: string;
  client: { firstName: string; lastName: string; email: string };
  contract: { requestId: string; artisan: { name: string } };
}

export function listPayments(page: number, status?: string): Promise<Page<PaymentRow>> {
  const q = new URLSearchParams({ page: String(page), ...(status ? { status } : {}) });
  return api<Page<PaymentRow>>(`/admin/payments?${q}`);
}

export interface ReviewRow {
  id: string;
  rating: number;
  quality: number;
  punctuality: number;
  cleanliness: number;
  communication: number;
  text: string | null;
  recommend: boolean;
  createdAt: string;
  client: { firstName: string; lastName: string };
  artisan: { name: string };
}

export function listReviews(page: number): Promise<Page<ReviewRow>> {
  const q = new URLSearchParams({ page: String(page) });
  return api<Page<ReviewRow>>(`/admin/reviews?${q}`);
}
