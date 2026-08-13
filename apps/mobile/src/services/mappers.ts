/**
 * MAPPER backend → tipi mobile.
 * Il backend usa enum MAIUSCOLI e nomi campo diversi: qui convertiamo tutto
 * nei tipi di packages/shared usati dalle schermate, senza toccare la UI.
 */
import {
  AppNotification, Artisan, ArtisanReview, ChatMessage, Contract, Conversation,
  InfoRequest, JobRequest, PortfolioItem, Quote, User
} from '@artisan/shared';

export const CURRENCY: Record<string, string> = { SA: 'SAR', AE: 'AED', QA: 'QAR', KW: 'KWD' };

const PALETTE = ['#1D4ED8', '#0F766E', '#A21CAF', '#B45309', '#0E7490', '#BE123C', '#4D7C0F', '#7C3AED'];
const colorFor = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
};

const lc = (s: any) => String(s ?? '').toLowerCase();
const day = (s: any) => String(s ?? '').slice(0, 10);

// ---- enum: backend ↔ mobile ----
const PROP_TO_MOBILE: Record<string, JobRequest['propertyType']> = {
  APARTMENT: 'apartment', VILLA: 'house', OFFICE: 'office', SHOP: 'site'
};
export const PROP_TO_BACKEND: Record<string, string> = {
  apartment: 'APARTMENT', house: 'VILLA', office: 'OFFICE', site: 'SHOP'
};
export const URGENCY_TO_BACKEND: Record<string, string> = {
  now: 'NOW', week: 'WEEK', flexible: 'FLEXIBLE'
};

// ---- User ----
export function toUser(u: any): User {
  return {
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    phone: u.phone ?? '',
    country: u.country,
    avatarUrl: u.avatarUrl ?? undefined,
    bankVerified: !!u.bankVerified
  };
}

// ---- Artisan ----
export function toArtisan(a: any): Artisan {
  const portfolio: PortfolioItem[] = (a.portfolio ?? []).map((p: any) => ({
    title: p.description ?? 'Project',
    before: p.beforeUrl,
    after: p.afterUrl
  }));
  const reviews: ArtisanReview[] = (a.reviews ?? []).map((r: any) => ({
    id: r.id,
    author: r.client ? `${r.client.firstName} ${(r.client.lastName ?? '').charAt(0)}.` : 'Client',
    rating: r.rating,
    text: r.text ?? '',
    date: day(r.createdAt)
  }));
  const verified = !!a.verified;
  return {
    id: a.id,
    name: a.name,
    categoryId: a.categoryId,
    rating: a.rating ?? 0,
    reviewsCount: a.reviewsCount ?? reviews.length,
    city: a.city,
    zone: a.zone ?? a.city,
    yearsActive: a.yearsActive ?? 3,
    jobsDone: a.jobsDone ?? 0,
    licenseVerified: verified,
    badges: verified ? ['Verified CR'] : [],
    distanceKm: a.distanceKm ?? 0,
    color: colorFor(a.id),
    bio: a.bio ?? '',
    portfolio,
    reviews
  };
}

// ---- Quote ----
export function toQuote(q: any): Quote {
  return {
    id: q.id,
    requestId: q.requestId,
    artisanId: q.artisanId,
    total: q.price,
    labor: q.laborCost ?? 0,
    materials: q.materials ?? 0,
    days: q.days ?? 1,
    note: q.note ?? '',
    recommended: !!q.recommended,
    createdAt: q.createdAt ?? ''
  };
}

// ---- InfoRequest ----
export function toInfoRequest(i: any): InfoRequest {
  return {
    id: i.id,
    requestId: i.requestId,
    artisanId: i.artisanId,
    message: i.question,
    photoHints: i.photoHints ?? [],
    createdAt: i.createdAt ?? '',
    reply: i.replyText
      ? { text: i.replyText, photos: i.replyPhotos ?? [], date: day(i.repliedAt) }
      : undefined
  };
}

// ---- Request ----
export function toRequest(r: any, country: string): JobRequest {
  const history = (r.events ?? []).map((e: any) => ({
    id: e.id,
    type: e.type === 'info' ? 'info_request' : (e.type ?? 'stage'),
    text: e.text,
    date: e.createdAt ?? ''
  }));
  const jobUpdates = (r.jobUpdates ?? []).map((u: any) => ({
    id: u.id,
    text: u.text ?? '',
    photos: u.photos ?? [],
    date: u.createdAt ?? ''
  }));
  return {
    id: r.id,
    categoryId: r.categoryId,
    subcategory: r.subcategory ?? '',
    description: r.description ?? '',
    photos: r.photos ?? [],
    city: r.city,
    zone: r.zone ?? '',
    propertyType: PROP_TO_MOBILE[r.propertyType] ?? 'apartment',
    urgency: lc(r.urgency) as JobRequest['urgency'],
    budgetMin: r.budgetMin ?? undefined,
    budgetMax: r.budgetMax ?? undefined,
    currency: CURRENCY[country] ?? 'SAR',
    status: lc(r.status) as JobRequest['status'],
    stage: r.stage ? (lc(r.stage) as JobRequest['stage']) : undefined,
    createdAt: r.createdAt ?? '',
    artisanId: r.contract?.artisanId ?? undefined,
    quoteId: r.contract?.quoteId ?? undefined,
    directToArtisanId: r.directArtisanId ?? undefined,
    reviewed: !!r.review,
    history,
    jobUpdates
  };
}

// ---- Contract ----
export function toContract(c: any): Contract {
  return {
    id: c.id,
    requestId: c.requestId,
    quoteId: c.quoteId,
    artisanId: c.artisanId,
    price: c.price,
    currency: c.currency,
    scope: c.scope ?? '',
    days: c.days ?? 1,
    terms: ['term1', 'term2', 'term3'],
    signedAt: c.signedAt ?? undefined
  };
}

// ---- Chat ----
export function toMessage(m: any): ChatMessage {
  return {
    id: m.id,
    conversationId: m.conversationId,
    from: m.from === 'client' ? 'me' : m.from === 'artisan' ? 'them' : 'system',
    text: m.text ?? '',
    image: m.imageUrl ?? undefined,
    date: m.createdAt ?? '',
    status: m.from === 'client' ? (m.seenAt ? 'seen' : 'sent') : undefined
  };
}

export function toConversation(c: any, unread = 0): Conversation {
  const last = c.messages?.[0];
  return {
    id: c.id,
    artisanId: c.artisanId,
    requestId: c.requestId ?? undefined,
    lastMessage: last ? (last.text || '📷 Photo') : '',
    lastDate: last?.createdAt ?? c.createdAt ?? '',
    unread,
    artisanTyping: !!c.artisanTyping
  };
}

// ---- Notification ----
export function toNotification(n: any): AppNotification {
  return {
    id: n.id,
    type: lc(n.type) as AppNotification['type'],
    title: n.title,
    body: n.body ?? '',
    date: n.createdAt ?? '',
    read: !!n.read,
    requestId: n.requestId ?? undefined,
    conversationId: n.conversationId ?? undefined
  };
}
