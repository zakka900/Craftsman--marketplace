import { Bank, CountryCode } from './types';

export interface Country {
  code: CountryCode;
  dial: string;
  currency: string;
  flag: string;
  name: string;
}

export const COUNTRIES: Country[] = [
  { code: 'SA', dial: '+966', currency: 'SAR', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: 'AE', dial: '+971', currency: 'AED', flag: '🇦🇪', name: 'United Arab Emirates' },
  { code: 'QA', dial: '+974', currency: 'QAR', flag: '🇶🇦', name: 'Qatar' },
  { code: 'KW', dial: '+965', currency: 'KWD', flag: '🇰🇼', name: 'Kuwait' }
];

export const CITIES: Record<CountryCode, string[]> = {
  SA: ['Riyadh', 'Jeddah', 'Dammam', 'Mecca', 'Medina', 'Khobar'],
  AE: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah'],
  QA: ['Doha', 'Al Rayyan', 'Al Wakrah', 'Lusail'],
  KW: ['Kuwait City', 'Hawalli', 'Salmiya', 'Farwaniya']
};

export interface Category {
  id: string;
  icon: string; // Ionicons name
  colorIndex: number;
  subs: string[];
}

// Le label localizzate sono in i18n (categories.<id>); qui solo dati strutturali.
export const CATEGORIES: Category[] = [
  { id: 'plumber', icon: 'water', colorIndex: 1, subs: ['leak', 'sanitary', 'new_system', 'water_heater', 'other'] },
  { id: 'electrician', icon: 'flash', colorIndex: 4, subs: ['fault', 'new_points', 'panel', 'lighting', 'other'] },
  { id: 'renovation', icon: 'construct', colorIndex: 0, subs: ['full_reno', 'bathroom', 'kitchen', 'flooring', 'other'] },
  { id: 'painter', icon: 'color-palette', colorIndex: 6, subs: ['interior', 'exterior', 'decorative', 'other'] },
  { id: 'hvac', icon: 'snow', colorIndex: 8, subs: ['ac_install', 'ac_repair', 'maintenance', 'other'] },
  { id: 'carpenter', icon: 'hammer', colorIndex: 9, subs: ['furniture', 'doors', 'repair', 'custom', 'other'] },
  { id: 'cleaning', icon: 'sparkles', colorIndex: 2, subs: ['deep', 'post_reno', 'regular', 'other'] },
  { id: 'moving', icon: 'cube', colorIndex: 3, subs: ['home', 'office', 'single_items', 'other'] },
  { id: 'gardening', icon: 'leaf', colorIndex: 5, subs: ['maintenance', 'landscaping', 'irrigation', 'other'] },
  { id: 'other', icon: 'ellipsis-horizontal', colorIndex: 7, subs: ['other'] }
];

export const BANKS: Bank[] = [
  { id: 'alrajhi', name: 'Al Rajhi Bank', country: 'SA', color: '#1B4B9B' },
  { id: 'snb', name: 'Saudi National Bank', country: 'SA', color: '#00A651' },
  { id: 'riyad', name: 'Riyad Bank', country: 'SA', color: '#004A99' },
  { id: 'alinma', name: 'Alinma Bank', country: 'SA', color: '#8B6F3E' },
  { id: 'enbd', name: 'Emirates NBD', country: 'AE', color: '#2A3B8F' },
  { id: 'fab', name: 'First Abu Dhabi Bank', country: 'AE', color: '#00539F' },
  { id: 'adcb', name: 'ADCB', country: 'AE', color: '#E31837' },
  { id: 'mashreq', name: 'Mashreq', country: 'AE', color: '#FF6600' },
  { id: 'qnb', name: 'QNB', country: 'QA', color: '#6A1A5F' },
  { id: 'doha', name: 'Doha Bank', country: 'QA', color: '#00539F' },
  { id: 'qib', name: 'QIB', country: 'QA', color: '#8A1538' },
  { id: 'nbk', name: 'NBK', country: 'KW', color: '#005EB8' },
  { id: 'kfh', name: 'KFH', country: 'KW', color: '#00843D' },
  { id: 'gulf', name: 'Gulf Bank', country: 'KW', color: '#E4002B' }
];

export const OTP_LENGTH = 6;
export const OTP_RESEND_SECONDS = 45;
export const UNVERIFIED_PAYMENT_LIMIT: Record<string, number> = {
  SAR: 1000, AED: 1000, QAR: 1000, KWD: 80
};
