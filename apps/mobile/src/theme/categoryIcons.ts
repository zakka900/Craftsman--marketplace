import { MaterialCommunityIcons } from '@expo/vector-icons';

type MCIName = keyof typeof MaterialCommunityIcons.glyphMap;

/**
 * Category icons in a solid/geometric professional style
 * (MaterialCommunityIcons). Mapped by category id, so they stay
 * consistent across the whole app (home, request card, wizard).
 */
export const CATEGORY_ICON: Record<string, MCIName> = {
  plumber: 'pipe-wrench',
  electrician: 'lightning-bolt',
  renovation: 'hammer-wrench',
  painter: 'format-paint',
  hvac: 'air-conditioner',
  carpenter: 'hand-saw',
  cleaning: 'spray-bottle',
  moving: 'truck',
  gardening: 'shovel',
  other: 'dots-horizontal'
};

export const catIcon = (categoryId?: string): MCIName =>
  (categoryId && CATEGORY_ICON[categoryId]) || 'dots-horizontal';
