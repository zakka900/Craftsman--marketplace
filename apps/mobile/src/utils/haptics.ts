import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Feedback aptico centralizzato (iOS Taptic Engine).
 * Ogni chiamata è fire-and-forget e non può mai far crashare l'app.
 */
const ios = Platform.OS === 'ios';

/** Tocco leggero: tap su bottoni, chip, righe di menu. */
export const hapticTap = () => {
  if (ios) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
};

/** Selezione: cambio tab, toggle, scelte in un gruppo. */
export const hapticSelect = () => {
  if (ios) Haptics.selectionAsync().catch(() => {});
};

/** Successo: pagamento riuscito, verifica completata, invio recensione. */
export const hapticSuccess = () => {
  if (ios) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
};

/** Avviso: validazione fallita, azione bloccata. */
export const hapticWarning = () => {
  if (ios) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
};

/** Errore: OTP sbagliato, pagamento rifiutato. */
export const hapticError = () => {
  if (ios) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
};
