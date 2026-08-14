import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Centralized haptic feedback (iOS Taptic Engine).
 * Every call is fire-and-forget and can never crash the app.
 */
const ios = Platform.OS === 'ios';

/** Light tap: buttons, chips, menu rows. */
export const hapticTap = () => {
  if (ios) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
};

/** Selection: tab change, toggles, choices within a group. */
export const hapticSelect = () => {
  if (ios) Haptics.selectionAsync().catch(() => {});
};

/** Success: payment succeeded, verification completed, review submitted. */
export const hapticSuccess = () => {
  if (ios) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
};

/** Warning: validation failed, action blocked. */
export const hapticWarning = () => {
  if (ios) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
};

/** Error: wrong OTP, payment rejected. */
export const hapticError = () => {
  if (ios) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
};
