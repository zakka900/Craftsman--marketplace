/**
 * LAYER API REALE — parla con il backend NestJS su Railway.
 * Le firme sono le stesse del vecchio mock: le schermate non cambiano.
 *
 * Strategia: le funzioni sync (getRequests, getArtisan, ...) leggono una cache
 * locale; le azioni async chiamano l'API e aggiornano la cache; subscribe/emit
 * fa ri-renderizzare le schermate (hook useLive). Un polling ogni 15s tiene
 * aggiornati richieste, chat e notifiche (sostituto semplice del realtime).
 */
import { io, Socket } from 'socket.io-client';
import {
  AppNotification, Artisan, Bank, BANKS, ChatMessage, Contract, Conversation,
  COUNTRIES, InfoRequest, JobRequest, Quote, ReviewInput, User
} from '@artisan/shared';
import { initPaymentSheet, presentPaymentSheet } from '@stripe/stripe-react-native';
import { AI_PHOTO_HINTS } from './mockData';
import { api, loadToken, saveToken } from './http';
import { API_URL } from './config';
import {
  CURRENCY, PROP_TO_BACKEND, toArtisan, toContract, toConversation, toInfoRequest,
  toMessage, toNotification, toQuote, toRequest, toUser, URGENCY_TO_BACKEND
} from './mappers';
import { useAuthStore } from '../store';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** In sviluppo il backend accetta il codice 123456; in produzione l'OTP arriva via email. */
export const DEMO_OTP = '123456';

// ---------------- CACHE LOCALE ----------------
const cache = {
  artisans: new Map<string, Artisan>(),
  showcase: [] as { title: string; before: string; after: string; artisan: string; artisanId: string }[],
  requests: [] as JobRequest[],
  quotesByRequest: new Map<string, Quote[]>(),
  infoByRequest: new Map<string, InfoRequest[]>(),
  contracts: new Map<string, Contract>(),
  conversations: [] as Conversation[],
  messagesByConv: new Map<string, ChatMessage[]>(),
  notifications: [] as AppNotification[]
};

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
  const unread = cache.notifications.filter((n) => !n.read).length;
  useAuthStore.getState().setUnread(unread);
}
export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

// ---------------- SOCKET.IO (realtime chat) ----------------
// Il polling ogni 15s resta come rete di sicurezza (riconnessioni, notifiche
// non di chat); i messaggi e il "sta scrivendo" dentro una conversazione
// aperta arrivano invece in tempo reale via socket, niente attesa.
let socket: Socket | null = null;
const joinedRooms = new Set<string>();

function connectSocket() {
  if (socket) return;
  const base = API_URL.replace(/\/api\/?$/, '');
  socket = io(`${base}/chat`, { transports: ['websocket'], reconnection: true });

  socket.on('connect', () => {
    joinedRooms.forEach((id) => socket!.emit('join', { conversationId: id }));
  });

  socket.on('message', (raw: any) => {
    const msg = toMessage(raw);
    const list = cache.messagesByConv.get(msg.conversationId) ?? [];
    if (list.some((m) => m.id === msg.id)) return; // già presente (es. eco del mio invio)
    list.push(msg);
    cache.messagesByConv.set(msg.conversationId, list);
    const conv = cache.conversations.find((c) => c.id === msg.conversationId);
    if (conv) { conv.lastMessage = msg.text || '📷 Photo'; conv.lastDate = msg.date; }
    emit();
  });

  socket.on('typing', (dto: { conversationId: string; typing: boolean }) => {
    const conv = cache.conversations.find((c) => c.id === dto.conversationId);
    if (conv) { conv.artisanTyping = dto.typing; emit(); }
  });
}

function disconnectSocket() {
  socket?.disconnect();
  socket = null;
  joinedRooms.clear();
}

/** Entra nella "stanza" della conversazione: da qui in poi i suoi messaggi arrivano via socket. */
function joinRoom(conversationId: string) {
  if (joinedRooms.has(conversationId)) return;
  joinedRooms.add(conversationId);
  socket?.emit('join', { conversationId });
}

const country = () => useAuthStore.getState().user?.country ?? 'SA';

function cacheArtisan(a: any) {
  if (a?.id) cache.artisans.set(a.id, toArtisan(a));
}

// ---------------- REFRESH & POLLING ----------------
async function refreshArtisans() {
  const [list, showcase] = await Promise.all([
    api<any[]>('/artisans'),
    api<any[]>('/artisans/showcase')
  ]);
  list.forEach(cacheArtisan);
  cache.showcase = showcase.map((p) => ({
    title: p.description ?? 'Project',
    before: p.beforeUrl,
    after: p.afterUrl,
    artisan: p.artisan?.name ?? '',
    artisanId: p.artisanId
  }));
}

async function refreshRequests() {
  const tabs = await Promise.all([
    api<any[]>('/requests'),
    api<any[]>('/requests?tab=completed'),
    api<any[]>('/requests?tab=cancelled'),
    api<any[]>('/requests?tab=disputed')
  ]);
  const c = country();
  const prevById = new Map(cache.requests.map((r) => [r.id, r]));
  const merged: JobRequest[] = [];
  tabs.flat().forEach((raw) => {
    const mapped = toRequest(raw, c);
    const prev = prevById.get(mapped.id);
    if (prev) {
      // La lista non include timeline/aggiornamenti: conserva quelli del dettaglio.
      if (!mapped.history.length) mapped.history = prev.history;
      if (!mapped.jobUpdates.length) mapped.jobUpdates = prev.jobUpdates;
      if (!mapped.zone) mapped.zone = prev.zone;
    }
    (raw.quotes ?? []).forEach((q: any) => cacheArtisan(q.artisan));
    if (raw.quotes) cache.quotesByRequest.set(mapped.id, raw.quotes.map(toQuote));
    merged.push(mapped);
  });
  merged.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  cache.requests = merged;
}

function chatUnread(conversationId: string) {
  return cache.notifications.filter(
    (n) => n.type === 'chat' && !n.read && n.conversationId === conversationId
  ).length;
}

async function refreshConversations() {
  const list = await api<any[]>('/conversations');
  list.forEach((c) => { cacheArtisan(c.artisan); joinRoom(c.id); });
  cache.conversations = list.map((c) => toConversation(c, chatUnread(c.id)));
}

async function refreshNotifications() {
  const list = await api<any[]>('/notifications');
  cache.notifications = list.map(toNotification);
}

let pollTimer: ReturnType<typeof setInterval> | null = null;
let demoTimer: ReturnType<typeof setTimeout> | null = null;

async function refreshAll() {
  await Promise.all([refreshRequests(), refreshNotifications()]);
  await refreshConversations(); // dopo le notifiche (per i badge non letti)
  emit();
}

/** Popola chat demo con gli artigiani (no-op se il cliente ha già conversazioni). */
async function seedDemoChats() {
  try {
    const res = await api<{ seeded: boolean }>('/conversations/seed-demo', { method: 'POST' });
    if (res.seeded) await refreshAll();
  } catch {}
}

async function bootstrap() {
  try {
    await refreshArtisans();
    await refreshAll();
  } catch {
    // offline / primo avvio: le schermate mostrano stati vuoti
  }
  if (!pollTimer) pollTimer = setInterval(() => { refreshAll().catch(() => {}); }, 15000);
  if (!demoTimer) demoTimer = setTimeout(() => { seedDemoChats(); }, 10000);
  connectSocket();
}

function teardown() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  if (demoTimer) { clearTimeout(demoTimer); demoTimer = null; }
  disconnectSocket();
  cache.requests = [];
  cache.quotesByRequest.clear();
  cache.infoByRequest.clear();
  cache.contracts.clear();
  cache.conversations = [];
  cache.messagesByConv.clear();
  cache.notifications = [];
  emit();
}

// Logout dal profilo → pulisci token e cache.
useAuthStore.subscribe((state, prev) => {
  if (prev.user && !state.user) {
    saveToken(null).catch(() => {});
    teardown();
  }
});

/** Ripristina la sessione all'avvio (token JWT salvato su AsyncStorage). */
export async function restoreSession(): Promise<boolean> {
  const token = await loadToken();
  if (!token) return false;
  try {
    const me = await api<any>('/users/me');
    useAuthStore.getState().setUser(toUser(me));
    bootstrap();
    return true;
  } catch {
    await saveToken(null);
    return false;
  }
}

/** Aggiorna nome/cognome/telefono — PATCH /users/me, già presente lato backend. */
export async function updateProfile(input: { firstName?: string; lastName?: string; phone?: string }): Promise<User> {
  const raw = await api<any>('/users/me', { method: 'PATCH', body: input });
  const user = toUser(raw);
  useAuthStore.getState().setUser(user);
  return user;
}

// ---------------- AUTH ----------------
export interface RegisterInput {
  firstName: string; lastName: string; phone: string; dial: string;
  email: string; password: string;
}

// Email in attesa di verifica OTP (register/login/reset la impostano).
let pendingEmail = '';

export async function register(input: RegisterInput): Promise<{ userId: string }> {
  const countryCode = COUNTRIES.find((c) => c.dial === input.dial)?.code || 'SA';
  const res = await api<{ userId: string; email: string }>('/auth/register', {
    body: {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: input.email.toLowerCase().trim(),
      password: input.password,
      country: countryCode,
      phone: input.phone ? `${input.dial} ${input.phone}` : undefined
    }
  });
  pendingEmail = res.email;
  return { userId: res.userId };
}

export async function sendOtp(_userId: string, _channel: 'phone' | 'email', _via: 'sms' | 'whatsapp' = 'sms') {
  await api('/auth/otp/resend', { body: { email: pendingEmail } });
}

export async function verifyOtp(_userId: string, _channel: 'phone' | 'email', code: string): Promise<User> {
  const res = await api<{ token: string; user: any }>('/auth/otp/verify', {
    body: { email: pendingEmail, code }
  });
  await saveToken(res.token);
  bootstrap();
  return toUser(res.user);
}

export async function login(identifier: string, password: string): Promise<User> {
  const email = identifier.toLowerCase().trim();
  try {
    const res = await api<{ token: string; user: any }>('/auth/login', { body: { email, password } });
    await saveToken(res.token);
    bootstrap();
    return toUser(res.user);
  } catch (e: any) {
    if (e?.message === 'NOT_VERIFIED') {
      pendingEmail = email; // il backend ha già re-inviato l'OTP
      e.userId = email;
      e.channel = 'email';
    }
    throw e;
  }
}

/** Social login non ancora attivo sul backend (fase 2: Expo AuthSession). */
export async function socialLogin(_provider: 'google' | 'apple'): Promise<User> {
  await delay(300);
  throw new Error('NOT_AVAILABLE');
}

export async function requestPasswordReset(identifier: string) {
  pendingEmail = identifier.toLowerCase().trim();
  await api('/auth/password/forgot', { body: { email: pendingEmail } });
}

export async function resetPassword(identifier: string, code: string, newPassword: string) {
  await api('/auth/password/reset', {
    body: { email: identifier.toLowerCase().trim(), code, newPassword }
  });
}

// ---------------- VERIFICA BANCARIA ----------------
export function getBanks(countryCode: string): Bank[] {
  return BANKS.filter((b) => b.country === countryCode);
}

export async function startBankVerification(bankId: string): Promise<{ verificationId: string }> {
  return api('/bank/verify', { body: { bankId } });
}

export async function pollBankVerification(verificationId: string): Promise<'pending' | 'verified' | 'failed'> {
  await delay(1200);
  const res = await api<{ status: 'pending' | 'verified' | 'failed' }>(`/bank/verify/${verificationId}`);
  if (res.status === 'verified') {
    try {
      const me = await api<any>('/users/me');
      useAuthStore.getState().setUser(toUser(me));
    } catch {}
    refreshNotifications().then(emit).catch(() => {});
  }
  return res.status;
}

// ---------------- RICERCA & ARTIGIANI ----------------
export async function searchArtisans(q: string): Promise<Artisan[]> {
  const list = await api<any[]>(`/artisans?q=${encodeURIComponent(q)}`);
  list.forEach(cacheArtisan);
  return list.map((a) => cache.artisans.get(a.id)!);
}

export function getArtisan(artisanId: string): Artisan | undefined {
  const found = cache.artisans.get(artisanId);
  if (!found) {
    // Non in cache: caricalo in background e ri-renderizza.
    api<any>(`/artisans/${artisanId}`).then((a) => { cacheArtisan(a); emit(); }).catch(() => {});
  }
  return found;
}

export function getShowcase() {
  return cache.showcase;
}

// ---------------- AI ----------------
// Testo: analisi reale via backend (Gemini, con fallback mock lato server se manca la chiave).
export async function aiAnalyzeText(categoryId: string, text: string): Promise<string[]> {
  try {
    const res = await api<{ missingInfo: string[]; questions: string[] }>('/ai/analyze-text', {
      body: { categoryId, description: text }
    });
    return res.missingInfo ?? [];
  } catch {
    return []; // suggerimenti non bloccanti: un errore AI non deve fermare il wizard
  }
}

export async function aiAnalyzePhotos(categoryId: string, photos: string[]): Promise<string[]> {
  await delay(900);
  const hints: string[] = [];
  const pool = AI_PHOTO_HINTS[categoryId] || AI_PHOTO_HINTS.default;
  if (photos.length < 2) hints.push(pool[0]);
  else hints.push(pool[1] || pool[0]);
  if (photos.length && photos.length % 3 === 0) hints.push('__BLURRY__');
  return hints;
}

// ---------------- RICHIESTE ----------------
export async function createRequest(draft: any, user: User): Promise<JobRequest> {
  const raw = await api<any>('/requests', {
    body: {
      categoryId: draft.categoryId,
      subcategory: draft.subcategory,
      description: draft.zone ? `${draft.description}\n\nZone: ${draft.zone}` : draft.description,
      photos: draft.photos ?? [],
      city: draft.city,
      propertyType: PROP_TO_BACKEND[draft.propertyType] ?? 'APARTMENT',
      urgency: URGENCY_TO_BACKEND[draft.urgency] ?? 'FLEXIBLE',
      budgetMin: draft.budgetOn ? draft.budgetMin : undefined,
      budgetMax: draft.budgetOn ? draft.budgetMax : undefined,
      directArtisanId: draft.directToArtisanId
    }
  });
  const req = toRequest(raw, user.country);
  req.zone = draft.zone ?? '';
  cache.requests.unshift(req);
  emit();
  return req;
}

export function getRequests(): JobRequest[] {
  return cache.requests;
}

// Dettaglio richiesta: fetch in background (max 1 ogni 5s per richiesta).
const lastDetailFetch = new Map<string, number>();

async function fetchRequestDetail(requestId: string) {
  const raw = await api<any>(`/requests/${requestId}`);
  if (!raw) return;
  const mapped = toRequest(raw, country());
  const idx = cache.requests.findIndex((r) => r.id === requestId);
  if (idx >= 0) {
    if (!mapped.zone) mapped.zone = cache.requests[idx].zone;
    cache.requests[idx] = mapped;
  } else {
    cache.requests.unshift(mapped);
  }
  (raw.quotes ?? []).forEach((q: any) => cacheArtisan(q.artisan));
  (raw.infoRequests ?? []).forEach((i: any) => cacheArtisan(i.artisan));
  cache.quotesByRequest.set(requestId, (raw.quotes ?? []).map(toQuote));
  cache.infoByRequest.set(requestId, (raw.infoRequests ?? []).map(toInfoRequest));
  if (raw.contract) {
    cacheArtisan(raw.contract.artisan);
    cache.contracts.set(raw.contract.id, toContract(raw.contract));
  }
  emit();
}

function scheduleDetail(requestId: string, minMs = 5000) {
  const last = lastDetailFetch.get(requestId) ?? 0;
  if (Date.now() - last < minMs) return;
  lastDetailFetch.set(requestId, Date.now());
  fetchRequestDetail(requestId).catch(() => {});
}

export function getRequest(requestId: string): JobRequest | undefined {
  scheduleDetail(requestId);
  return cache.requests.find((r) => r.id === requestId);
}

export function getQuotes(requestId: string): Quote[] {
  return cache.quotesByRequest.get(requestId) ?? [];
}

export function getInfoRequests(requestId: string): InfoRequest[] {
  scheduleDetail(requestId);
  return cache.infoByRequest.get(requestId) ?? [];
}

export function getInfoRequest(infoId: string): InfoRequest | undefined {
  for (const list of cache.infoByRequest.values()) {
    const found = list.find((i) => i.id === infoId);
    if (found) return found;
  }
  return undefined;
}

export async function replyInfoRequest(infoId: string, text: string, photos: string[]) {
  const info = getInfoRequest(infoId);
  await api(`/info-requests/${infoId}/reply`, { body: { text, photos } });
  if (info) {
    lastDetailFetch.delete(info.requestId);
    await fetchRequestDetail(info.requestId);
  }
}

// ---------------- CONTRATTO & PAGAMENTO ----------------
export async function createContract(requestId: string, quoteId: string): Promise<Contract> {
  const raw = await api<any>('/contracts', { body: { quoteId } });
  const contract = toContract(raw);
  cache.contracts.set(contract.id, contract);
  return contract;
}

export function getContract(contractId: string): Contract | undefined {
  return cache.contracts.get(contractId);
}

export async function signContract(contractId: string) {
  const raw = await api<any>(`/contracts/${contractId}/sign`, { method: 'POST' });
  const contract = toContract(raw);
  cache.contracts.set(contract.id, contract);
  lastDetailFetch.delete(contract.requestId);
  await fetchRequestDetail(contract.requestId);
  return contract;
}

/**
 * Deposito in escrow con Stripe PaymentSheet:
 * 1) il backend crea il PaymentIntent → clientSecret
 * 2) l'utente paga nel foglio Stripe nativo
 * 3) il webhook Stripe segna il pagamento HELD_ESCROW e avvia il lavoro
 */
export async function payDeposit(contractId: string): Promise<{ receiptId: string }> {
  const dep = await api<{ paymentId: string; clientSecret: string }>('/payments/deposit', {
    body: { contractId }
  });

  const init = await initPaymentSheet({
    paymentIntentClientSecret: dep.clientSecret,
    merchantDisplayName: 'Artisan'
  });
  if (init.error) throw new Error(init.error.message || 'PAYMENT_INIT_FAILED');

  const result = await presentPaymentSheet();
  if (result.error) {
    if (result.error.code === 'Canceled') throw new Error('CANCELLED');
    throw new Error(result.error.message || 'PAYMENT_FAILED');
  }

  // Attendi che il webhook confermi (stato richiesta → in_progress)
  const contract = cache.contracts.get(contractId);
  if (contract) {
    for (let i = 0; i < 7; i++) {
      await delay(2000);
      lastDetailFetch.delete(contract.requestId);
      try { await fetchRequestDetail(contract.requestId); } catch {}
      const req = cache.requests.find((r) => r.id === contract.requestId);
      if (req && req.status === 'in_progress') break;
    }
  }
  refreshConversations().then(emit).catch(() => {});
  return { receiptId: dep.paymentId.slice(-8).toUpperCase() };
}

export async function confirmCompletion(requestId: string) {
  await api(`/requests/${requestId}/confirm`, { method: 'POST' });
  lastDetailFetch.delete(requestId);
  await fetchRequestDetail(requestId);
}

export async function openDispute(requestId: string, reason: string, description: string, photos: string[]) {
  await api(`/requests/${requestId}/dispute`, { body: { reason, description, photos } });
  lastDetailFetch.delete(requestId);
  await fetchRequestDetail(requestId);
}

export async function submitReview(requestId: string, review: ReviewInput) {
  await api(`/requests/${requestId}/review`, { body: review });
  lastDetailFetch.delete(requestId);
  await fetchRequestDetail(requestId);
}

// ---------------- CHAT ----------------
export function getConversations(): Conversation[] {
  return cache.conversations;
}

/** Apre (o riusa) una conversazione con un artigiano. Ora async: va atteso con await. */
export async function openConversation(artisanId: string, requestId?: string): Promise<Conversation> {
  const raw = await api<any>('/conversations', { body: { artisanId, requestId } });
  cacheArtisan(raw.artisan);
  joinRoom(raw.id);
  const conv = toConversation(raw, chatUnread(raw.id));
  const idx = cache.conversations.findIndex((c) => c.id === conv.id);
  if (idx >= 0) cache.conversations[idx] = conv;
  else cache.conversations.unshift(conv);
  emit();
  return conv;
}

const lastMessagesFetch = new Map<string, number>();

async function fetchMessages(conversationId: string) {
  const raw = await api<any[]>(`/conversations/${conversationId}/messages`);
  cache.messagesByConv.set(conversationId, raw.map(toMessage));
  emit();
}

export function getMessages(conversationId: string): ChatMessage[] {
  const last = lastMessagesFetch.get(conversationId) ?? 0;
  if (Date.now() - last > 4000) {
    lastMessagesFetch.set(conversationId, Date.now());
    fetchMessages(conversationId).catch(() => {});
  }
  return cache.messagesByConv.get(conversationId) ?? [];
}

export async function sendMessage(conversationId: string, text: string, image?: string) {
  const raw = await api<any>(`/conversations/${conversationId}/messages`, {
    body: { text, imageUrl: image }
  });
  const msg = toMessage(raw);
  const list = cache.messagesByConv.get(conversationId) ?? [];
  list.push(msg);
  cache.messagesByConv.set(conversationId, list);
  const conv = cache.conversations.find((c) => c.id === conversationId);
  if (conv) {
    conv.lastMessage = text || '📷 Photo';
    conv.lastDate = msg.date;
  }
  emit();
  return msg;
}

// Traduzione contenuti (chat, descrizione richiesta) — cache lato backend, testo originale intatto.
export async function translateText(text: string, targetLang: 'en' | 'ar'): Promise<{ translatedText: string; sourceLang: string }> {
  return api<{ translatedText: string; sourceLang: string }>('/translate', { body: { text, targetLang } });
}

export function markConversationRead(conversationId: string) {
  const conv = cache.conversations.find((c) => c.id === conversationId);
  if (conv) conv.unread = 0;
  cache.notifications
    .filter((n) => n.type === 'chat' && !n.read && n.conversationId === conversationId)
    .forEach((n) => {
      n.read = true;
      api(`/notifications/${n.id}/read`, { method: 'POST' }).catch(() => {});
    });
  emit();
}

// ---------------- NOTIFICHE ----------------
export function getNotifications(): AppNotification[] {
  return cache.notifications;
}

export function markAllNotificationsRead() {
  cache.notifications.forEach((n) => (n.read = true));
  api('/notifications/read-all', { method: 'POST' }).catch(() => {});
  emit();
}

export function markNotificationRead(nId: string) {
  const n = cache.notifications.find((x) => x.id === nId);
  if (n) n.read = true;
  api(`/notifications/${nId}/read`, { method: 'POST' }).catch(() => {});
  emit();
}
