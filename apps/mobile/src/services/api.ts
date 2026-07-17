/**
 * LAYER API MOCK — simula l'intero backend in-memory.
 * Ogni funzione rispecchia un endpoint reale del backend NestJS (apps/backend).
 * PROVIDER REALE: sostituire le implementazioni con fetch verso l'API,
 * mantenendo le stesse firme (l'app non deve cambiare).
 *
 * Codice OTP demo: 123456
 */
import {
  AppNotification, Artisan, Bank, BANKS, ChatMessage, Contract, Conversation,
  COUNTRIES, HistoryEvent, InfoRequest, JobRequest, Quote, ReviewInput, User
} from '@artisan/shared';
import { AI_PHOTO_HINTS, AI_TEXT_HINTS, ARTISANS, QUOTE_NOTES } from './mockData';
import { useAuthStore } from '../store';

const delay = (ms = 500) => new Promise((r) => setTimeout(r, ms));
const id = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();
export const DEMO_OTP = '123456';

// ---------------- DB in-memory ----------------
interface DbUser extends User { password: string; phoneVerified: boolean; emailVerified: boolean; }

const db = {
  users: [] as DbUser[],
  requests: [] as JobRequest[],
  quotes: [] as Quote[],
  infoRequests: [] as InfoRequest[],
  contracts: [] as Contract[],
  conversations: [] as Conversation[],
  messages: [] as ChatMessage[],
  notifications: [] as AppNotification[],
  listeners: new Set<() => void>()
};

function emit() {
  db.listeners.forEach((l) => l());
  const unread = db.notifications.filter((n) => !n.read).length;
  useAuthStore.getState().setUnread(unread);
}
export function subscribe(fn: () => void) {
  db.listeners.add(fn);
  return () => { db.listeners.delete(fn); };
}

function notify(n: Omit<AppNotification, 'id' | 'date' | 'read'>) {
  db.notifications.unshift({ ...n, id: id(), date: now(), read: false });
  emit();
}

function addHistory(req: JobRequest, type: HistoryEvent['type'], text: string) {
  req.history.push({ id: id(), type, text, date: now() });
}

// ---------------- AUTH ----------------
export interface RegisterInput {
  firstName: string; lastName: string; phone: string; dial: string;
  email: string; password: string;
}

export async function register(input: RegisterInput): Promise<{ userId: string }> {
  await delay(700);
  if (db.users.some((u) => u.email === input.email.toLowerCase())) {
    throw new Error('EMAIL_EXISTS');
  }
  const country = COUNTRIES.find((c) => c.dial === input.dial)?.code || 'SA';
  const user: DbUser = {
    id: id(),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: input.email.toLowerCase().trim(),
    phone: `${input.dial} ${input.phone}`,
    country,
    password: input.password,
    bankVerified: false,
    phoneVerified: false,
    emailVerified: false
  };
  db.users.push(user);
  console.log(`[MOCK OTP] SMS to ${user.phone}: ${DEMO_OTP}`);
  return { userId: user.id };
}

export async function sendOtp(userId: string, channel: 'phone' | 'email', via: 'sms' | 'whatsapp' = 'sms') {
  await delay(400);
  console.log(`[MOCK OTP] ${channel} (${via}) for ${userId}: ${DEMO_OTP}`);
}

export async function verifyOtp(userId: string, channel: 'phone' | 'email', code: string): Promise<User> {
  await delay(600);
  const u = db.users.find((x) => x.id === userId);
  if (!u || code !== DEMO_OTP) throw new Error('WRONG_CODE');
  if (channel === 'phone') u.phoneVerified = true; else u.emailVerified = true;
  return u;
}

export async function login(identifier: string, password: string): Promise<User> {
  await delay(700);
  const idl = identifier.toLowerCase().trim();
  const u = db.users.find((x) => x.email === idl || x.phone.replace(/\s/g, '').endsWith(idl.replace(/\s/g, '')));
  if (!u) throw new Error('NOT_FOUND');
  if (u.password !== password) throw new Error('WRONG_PASSWORD');
  if (!u.phoneVerified || !u.emailVerified) {
    const err: any = new Error('NOT_VERIFIED');
    err.userId = u.id;
    err.channel = !u.phoneVerified ? 'phone' : 'email';
    throw err;
  }
  return u;
}

/** Social login mock (Google/Apple). PROVIDER REALE: Expo AuthSession. */
export async function socialLogin(provider: 'google' | 'apple'): Promise<User> {
  await delay(900);
  let u = db.users.find((x) => x.email === `demo.${provider}@example.com`);
  if (!u) {
    u = {
      id: id(), firstName: provider === 'google' ? 'Demo' : 'Apple', lastName: 'User',
      email: `demo.${provider}@example.com`, phone: '+966 500000000', country: 'SA',
      password: '', bankVerified: false, phoneVerified: true, emailVerified: true
    };
    db.users.push(u);
  }
  return u;
}

export async function requestPasswordReset(identifier: string) {
  await delay(500);
  console.log(`[MOCK OTP] password reset for ${identifier}: ${DEMO_OTP}`);
}

export async function resetPassword(identifier: string, code: string, newPassword: string) {
  await delay(600);
  if (code !== DEMO_OTP) throw new Error('WRONG_CODE');
  const idl = identifier.toLowerCase().trim();
  const u = db.users.find((x) => x.email === idl || x.phone.replace(/\s/g, '').endsWith(idl.replace(/\s/g, '')));
  if (u) u.password = newPassword;
}

// ---------------- VERIFICA BANCARIA (Open Banking mock) ----------------
// PROVIDER REALE: modulo bank-verification del backend (Lean Technologies / Tarabut).
export function getBanks(country: string): Bank[] {
  return BANKS.filter((b) => b.country === country);
}

export async function startBankVerification(bankId: string): Promise<{ verificationId: string }> {
  await delay(800); // simula redirect/deep-link all'app della banca
  return { verificationId: id() };
}

export async function pollBankVerification(_verificationId: string): Promise<'pending' | 'verified' | 'failed'> {
  await delay(1200);
  // Simula: l'utente approva nell'app bancaria dopo ~4s (90% successo)
  (pollBankVerification as any).calls = ((pollBankVerification as any).calls || 0) + 1;
  if ((pollBankVerification as any).calls % 4 !== 0) return 'pending';
  const ok = Math.random() > 0.1;
  if (ok) {
    const u = useAuthStore.getState().user;
    const dbu = db.users.find((x) => x.id === u?.id);
    if (dbu) dbu.bankVerified = true;
    notify({ type: 'bank', title: 'Bank account verified', body: 'Your payments are now fully enabled.' });
  }
  return ok ? 'verified' : 'failed';
}

// ---------------- RICERCA & ARTIGIANI ----------------
export async function searchArtisans(q: string): Promise<Artisan[]> {
  await delay(250);
  const ql = q.toLowerCase();
  return ARTISANS.filter(
    (a) => a.name.toLowerCase().includes(ql) || a.categoryId.includes(ql) ||
      a.city.toLowerCase().includes(ql) || a.zone.toLowerCase().includes(ql)
  );
}

export function getArtisan(artisanId: string): Artisan | undefined {
  return ARTISANS.find((a) => a.id === artisanId);
}

export function getShowcase() {
  return ARTISANS.flatMap((a) => a.portfolio.map((p) => ({ ...p, artisan: a.name, artisanId: a.id })));
}

// ---------------- AI (mock) ----------------
export async function aiAnalyzeText(categoryId: string, text: string): Promise<string[]> {
  await delay(600);
  const hints = AI_TEXT_HINTS[categoryId] || AI_TEXT_HINTS.default;
  // Non riproporre suggerimenti già "coperti" dal testo (euristica semplice)
  return hints.filter((h) => {
    const kw = h.split(' ').filter((w) => w.length > 5).slice(0, 2);
    return !kw.some((w) => text.toLowerCase().includes(w.toLowerCase()));
  }).slice(0, 3);
}

export async function aiAnalyzePhotos(categoryId: string, photos: string[]): Promise<string[]> {
  await delay(900);
  const hints: string[] = [];
  const pool = AI_PHOTO_HINTS[categoryId] || AI_PHOTO_HINTS.default;
  if (photos.length < 2) hints.push(pool[0]);
  else hints.push(pool[1] || pool[0]);
  if (photos.length && photos.length % 3 === 0) hints.push('__BLURRY__'); // segnala foto sfocata (mock)
  return hints;
}

// ---------------- RICHIESTE ----------------
export async function createRequest(draft: any, user: User): Promise<JobRequest> {
  await delay(900);
  const currency = COUNTRIES.find((c) => c.code === user.country)?.currency || 'SAR';
  const req: JobRequest = {
    id: id(),
    categoryId: draft.categoryId,
    subcategory: draft.subcategory,
    description: draft.description,
    photos: draft.photos,
    city: draft.city,
    zone: draft.zone,
    propertyType: draft.propertyType,
    urgency: draft.urgency,
    budgetMin: draft.budgetOn ? draft.budgetMin : undefined,
    budgetMax: draft.budgetOn ? draft.budgetMax : undefined,
    currency,
    status: 'awaiting_quotes',
    createdAt: now(),
    jobUpdates: [],
    history: [],
    directToArtisanId: draft.directToArtisanId
  };
  addHistory(req, 'created', 'Request created');
  db.requests.unshift(req);
  scheduleMockArtisanActivity(req);
  emit();
  return req;
}

export function getRequests(): JobRequest[] {
  return db.requests;
}
export function getRequest(requestId: string): JobRequest | undefined {
  return db.requests.find((r) => r.id === requestId);
}
export function getQuotes(requestId: string): Quote[] {
  return db.quotes.filter((q) => q.requestId === requestId);
}
export function getInfoRequests(requestId: string): InfoRequest[] {
  return db.infoRequests.filter((i) => i.requestId === requestId);
}
export function getInfoRequest(infoId: string): InfoRequest | undefined {
  return db.infoRequests.find((i) => i.id === infoId);
}

/** Simula l'attività lato artigiano: preventivi + eventuale "richiedi più info". */
function scheduleMockArtisanActivity(req: JobRequest) {
  const pool = req.directToArtisanId
    ? ARTISANS.filter((a) => a.id === req.directToArtisanId)
    : ARTISANS.filter((a) => a.categoryId === req.categoryId).concat(
        ARTISANS.filter((a) => a.categoryId !== req.categoryId).slice(0, 1)
      );
  const artisans = pool.slice(0, 3);

  // "Richiedi più informazioni" dal primo artigiano dopo ~8s
  if (!req.directToArtisanId && artisans[0]) {
    setTimeout(() => {
      if (req.status !== 'awaiting_quotes' && req.status !== 'quotes_received') return;
      const a = artisans[0];
      const info: InfoRequest = {
        id: id(), requestId: req.id, artisanId: a.id,
        message: 'Could you tell me if the area is easily accessible and on which floor? It affects the price.',
        photoHints: ['A photo of the access/entrance', 'A wider shot of the area'],
        createdAt: now()
      };
      db.infoRequests.push(info);
      addHistory(req, 'info_request', `${a.name} requested more information`);
      notify({ type: 'info_request', title: 'More info needed', body: `${a.name} needs more information for your job`, requestId: req.id });
    }, 8000);
  }

  // Preventivi a 10s / 18s / 26s
  artisans.forEach((a, i) => {
    setTimeout(() => {
      if (['artisan_selected', 'in_progress', 'completed', 'cancelled', 'disputed'].includes(req.status)) return;
      const base = 300 + Math.round(Math.random() * 900);
      const labor = Math.round(base * 0.6);
      const quote: Quote = {
        id: id(), requestId: req.id, artisanId: a.id,
        total: base, labor, materials: base - labor,
        days: 1 + Math.round(Math.random() * 5),
        note: QUOTE_NOTES[i % QUOTE_NOTES.length],
        createdAt: now()
      };
      db.quotes.push(quote);
      markRecommended(req.id);
      req.status = 'quotes_received';
      addHistory(req, 'quote', `Quote received from ${a.name}`);
      notify({ type: 'quote', title: 'New quote received', body: `${a.name} sent you a quote`, requestId: req.id });
    }, 10000 + i * 8000);
  });
}

/** "Consigliato" = miglior rapporto qualità/prezzo (rating alto, prezzo ragionevole). */
function markRecommended(requestId: string) {
  const qs = db.quotes.filter((q) => q.requestId === requestId);
  if (!qs.length) return;
  const maxPrice = Math.max(...qs.map((q) => q.total));
  let best: Quote | null = null;
  let bestScore = -1;
  qs.forEach((q) => {
    q.recommended = false;
    const a = getArtisan(q.artisanId);
    const score = (a?.rating || 3) * 2 - (q.total / maxPrice) * 3;
    if (score > bestScore) { bestScore = score; best = q; }
  });
  if (best) (best as Quote).recommended = true;
}

export async function replyInfoRequest(infoId: string, text: string, photos: string[]) {
  await delay(600);
  const info = db.infoRequests.find((i) => i.id === infoId);
  if (!info) throw new Error('NOT_FOUND');
  info.reply = { text, photos, date: now() };
  const req = getRequest(info.requestId);
  if (req) addHistory(req, 'info_reply', 'You replied with more information');
  emit();
}

// ---------------- CONTRATTO & PAGAMENTO ----------------
export async function createContract(requestId: string, quoteId: string): Promise<Contract> {
  await delay(700);
  const req = getRequest(requestId)!;
  const quote = db.quotes.find((q) => q.id === quoteId)!;
  const existing = db.contracts.find((c) => c.quoteId === quoteId);
  if (existing) return existing;
  const contract: Contract = {
    id: id(), requestId, quoteId, artisanId: quote.artisanId,
    price: quote.total, currency: req.currency,
    scope: `${req.subcategory} — ${req.description.slice(0, 120)}`,
    days: quote.days, terms: ['term1', 'term2', 'term3']
  };
  db.contracts.push(contract);
  return contract;
}

export function getContract(contractId: string): Contract | undefined {
  return db.contracts.find((x) => x.id === contractId);
}

export async function signContract(contractId: string) {
  await delay(600);
  const c = db.contracts.find((x) => x.id === contractId)!;
  c.signedAt = now();
  const req = getRequest(c.requestId)!;
  req.status = 'artisan_selected';
  req.artisanId = c.artisanId;
  req.quoteId = c.quoteId;
  addHistory(req, 'contract', 'Contract signed');
  emit();
  return c;
}

// PROVIDER REALE: Tap Payments / PayTabs / Moyasar (carta, Apple Pay, mada).
export async function payDeposit(contractId: string): Promise<{ receiptId: string }> {
  await delay(1500);
  const c = db.contracts.find((x) => x.id === contractId)!;
  const req = getRequest(c.requestId)!;
  req.status = 'in_progress';
  req.stage = 'confirmed';
  addHistory(req, 'payment', `Deposit of ${c.price} ${c.currency} held in escrow`);
  openConversation(c.artisanId, req.id, true);
  scheduleMockJobProgress(req);
  emit();
  return { receiptId: id().toUpperCase() };
}

/** Simula l'avanzamento del lavoro da parte dell'artigiano. */
function scheduleMockJobProgress(req: JobRequest) {
  const a = getArtisan(req.artisanId!);
  const steps: { stage: JobRequest['stage']; text: string; photo?: boolean; ms: number }[] = [
    { stage: 'started', text: 'Arrived on site and started the job', ms: 12000 },
    { stage: 'working', text: 'Work in progress — first phase done', photo: true, ms: 24000 },
    { stage: 'completed', text: 'Job completed! Final photos attached', photo: true, ms: 40000 }
  ];
  steps.forEach((s) => {
    setTimeout(() => {
      if (req.status !== 'in_progress') return;
      req.stage = s.stage;
      req.jobUpdates.push({
        id: id(), text: s.text, date: now(),
        photos: s.photo ? [`https://picsum.photos/seed/${id()}/500/340`] : []
      });
      addHistory(req, 'stage', s.text);
      notify({
        type: 'job',
        title: s.stage === 'completed' ? 'Job completed' : 'Job update',
        body: `${a?.name}: ${s.text}`,
        requestId: req.id
      });
    }, s.ms);
  });
}

export async function confirmCompletion(requestId: string) {
  await delay(800);
  const req = getRequest(requestId)!;
  req.stage = 'client_confirmed';
  req.status = 'completed';
  addHistory(req, 'stage', 'You confirmed the job — payment released to the artisan');
  emit();
}

export async function openDispute(requestId: string, reason: string, description: string, photos: string[]) {
  await delay(900);
  const req = getRequest(requestId)!;
  req.status = 'disputed';
  addHistory(req, 'dispute', `Dispute opened: ${reason} — ${description.slice(0, 80)}`);
  emit();
}

export async function submitReview(requestId: string, review: ReviewInput) {
  await delay(800);
  const req = getRequest(requestId)!;
  req.reviewed = true;
  addHistory(req, 'review', `You left a ${review.rating}★ review`);
  emit();
}

// ---------------- CHAT ----------------
export function getConversations(): Conversation[] {
  return db.conversations;
}

export function openConversation(artisanId: string, requestId?: string, system = false): Conversation {
  let conv = db.conversations.find((c) => c.artisanId === artisanId && c.requestId === requestId);
  if (!conv) {
    conv = { id: id(), artisanId, requestId, lastMessage: '', lastDate: now(), unread: 0 };
    db.conversations.unshift(conv);
    if (system) {
      pushMessage(conv.id, 'system', 'Quote accepted — payment held in escrow');
    }
    emit();
  }
  return conv;
}

export function getMessages(conversationId: string): ChatMessage[] {
  return db.messages.filter((m) => m.conversationId === conversationId);
}

function pushMessage(conversationId: string, from: ChatMessage['from'], text: string, image?: string) {
  const msg: ChatMessage = { id: id(), conversationId, from, text, image, date: now(), status: 'sent' };
  db.messages.push(msg);
  const conv = db.conversations.find((c) => c.id === conversationId);
  if (conv) {
    conv.lastMessage = text || '📷 Photo';
    conv.lastDate = msg.date;
    if (from === 'them') conv.unread += 1;
  }
  emit();
  return msg;
}

export async function sendMessage(conversationId: string, text: string, image?: string) {
  const msg = pushMessage(conversationId, 'me', text, image);
  // Risposta automatica mock dell'artigiano
  setTimeout(() => {
    msg.status = 'seen';
    emit();
  }, 1200);
  setTimeout(() => {
    const replies = [
      'Thanks, noted! 👍', 'Ok, I will check and get back to you.',
      'Can do. Does tomorrow morning work for you?', 'Got it, thanks for the details.'
    ];
    const conv = db.conversations.find((c) => c.id === conversationId);
    const a = conv ? getArtisan(conv.artisanId) : null;
    pushMessage(conversationId, 'them', replies[Math.floor(Math.random() * replies.length)]);
    notify({ type: 'chat', title: a?.name || 'New message', body: 'New message', conversationId });
  }, 2500 + Math.random() * 2000);
  return msg;
}

export function markConversationRead(conversationId: string) {
  const conv = db.conversations.find((c) => c.id === conversationId);
  if (conv) conv.unread = 0;
  emit();
}

// ---------------- NOTIFICHE ----------------
export function getNotifications(): AppNotification[] {
  return db.notifications;
}
export function markAllNotificationsRead() {
  db.notifications.forEach((n) => (n.read = true));
  emit();
}
export function markNotificationRead(nId: string) {
  const n = db.notifications.find((x) => x.id === nId);
  if (n) n.read = true;
  emit();
}
