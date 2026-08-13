import { MaterialCommunityIcons } from '@expo/vector-icons';

type MCIName = keyof typeof MaterialCommunityIcons.glyphMap;

/**
 * Icone categorie in stile solido/geometrico professionale
 * (MaterialCommunityIcons). Mappate per id categoria, così restano
 * coerenti in tutta l'app (home, card richiesta, wizard).
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
