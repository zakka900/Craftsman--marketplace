import { create } from 'zustand';
import { BankStatus, User } from '@artisan/shared';

interface AuthState {
  onboarded: boolean;
  user: User | null;
  bankStatus: BankStatus;
  unread: number;
  setOnboarded: () => void;
  setUser: (u: User | null) => void;
  setBankStatus: (s: BankStatus) => void;
  setUnread: (n: number) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  onboarded: false,
  user: null,
  bankStatus: 'none',
  unread: 0,
  setOnboarded: () => set({ onboarded: true }),
  setUser: (user) => set({ user }),
  setBankStatus: (bankStatus) => set({ bankStatus }),
  setUnread: (unread) => set({ unread }),
  logout: () => set({ user: null, bankStatus: 'none', unread: 0 })
}));

// ---- Request draft (multi-step wizard, persists across steps) ----
export interface RequestDraft {
  categoryId?: string;
  subcategory?: string;
  description: string;
  photos: string[];
  city?: string;
  zone: string;
  propertyType?: 'house' | 'apartment' | 'office' | 'site';
  urgency?: 'now' | 'week' | 'flexible';
  budgetOn: boolean;
  budgetMin: number;
  budgetMax: number;
  directToArtisanId?: string;
}

const emptyDraft: RequestDraft = {
  description: '', photos: [], zone: '', budgetOn: false, budgetMin: 100, budgetMax: 1000
};

interface DraftState {
  draft: RequestDraft;
  patch: (p: Partial<RequestDraft>) => void;
  reset: (initial?: Partial<RequestDraft>) => void;
}

export const useDraftStore = create<DraftState>((set) => ({
  draft: { ...emptyDraft },
  patch: (p) => set((s) => ({ draft: { ...s.draft, ...p } })),
  reset: (initial) => set({ draft: { ...emptyDraft, ...(initial || {}) } })
}));
