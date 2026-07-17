export type CountryCode = 'SA' | 'AE' | 'QA' | 'KW';
export type Urgency = 'now' | 'week' | 'flexible';
export type PropertyType = 'house' | 'apartment' | 'office' | 'site';

export type RequestStatus =
  | 'awaiting_quotes'
  | 'quotes_received'
  | 'artisan_selected'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export type JobStage = 'confirmed' | 'started' | 'working' | 'completed' | 'client_confirmed';
export type BankStatus = 'none' | 'pending' | 'verified' | 'failed' | 'skipped';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: CountryCode;
  avatarUrl?: string;
  bankVerified: boolean;
}

export interface ArtisanReview {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
}

export interface PortfolioItem {
  title: string;
  before: string;
  after: string;
}

export interface Artisan {
  id: string;
  name: string;
  categoryId: string;
  rating: number;
  reviewsCount: number;
  city: string;
  zone: string;
  yearsActive: number;
  jobsDone: number;
  licenseVerified: boolean;
  badges: string[];
  bio: string;
  portfolio: PortfolioItem[];
  reviews: ArtisanReview[];
  distanceKm: number;
  color: string;
}

export interface HistoryEvent {
  id: string;
  type: 'created' | 'quote' | 'info_request' | 'info_reply' | 'contract' | 'payment' | 'stage' | 'dispute' | 'review';
  text: string;
  date: string;
}

export interface JobUpdate {
  id: string;
  text: string;
  photos: string[];
  date: string;
}

export interface JobRequest {
  id: string;
  categoryId: string;
  subcategory: string;
  description: string;
  photos: string[];
  city: string;
  zone: string;
  propertyType: PropertyType;
  urgency: Urgency;
  budgetMin?: number;
  budgetMax?: number;
  currency: string;
  status: RequestStatus;
  createdAt: string;
  artisanId?: string;
  quoteId?: string;
  stage?: JobStage;
  jobUpdates: JobUpdate[];
  history: HistoryEvent[];
  directToArtisanId?: string;
  reviewed?: boolean;
}

export interface Quote {
  id: string;
  requestId: string;
  artisanId: string;
  total: number;
  labor?: number;
  materials?: number;
  days: number;
  note: string;
  recommended?: boolean;
  createdAt: string;
}

export interface InfoRequest {
  id: string;
  requestId: string;
  artisanId: string;
  message: string;
  photoHints: string[];
  reply?: { text: string; photos: string[]; date: string };
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  from: 'me' | 'them' | 'system';
  text: string;
  image?: string;
  date: string;
  status?: 'sent' | 'seen';
}

export interface Conversation {
  id: string;
  artisanId: string;
  requestId?: string;
  lastMessage: string;
  lastDate: string;
  unread: number;
}

export type NotificationType = 'quote' | 'info_request' | 'chat' | 'job' | 'bank' | 'promo';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  date: string;
  read: boolean;
  requestId?: string;
  conversationId?: string;
}

export interface Bank {
  id: string;
  name: string;
  country: CountryCode;
  color: string;
}

export interface Contract {
  id: string;
  requestId: string;
  quoteId: string;
  artisanId: string;
  price: number;
  currency: string;
  scope: string;
  days: number;
  terms: string[];
  signedAt?: string;
}

export interface ReviewInput {
  rating: number;
  quality: number;
  punctuality: number;
  cleanliness: number;
  communication: number;
  text: string;
  photos: string[];
  recommend: boolean;
}
