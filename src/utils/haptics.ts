import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Haptics are a no-op on web; guard so the prototype runs everywhere.
const enabled = Platform.OS === 'ios' || Platform.OS === 'android';

export const haptic = {
  tap() {
    if (enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  press() {
    if (enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  },
  success() {
    if (enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
  error() {
    if (enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  },
};
