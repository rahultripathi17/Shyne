import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Bottom padding a tab screen needs so its last item clears the tab bar. iOS's tab bar floats over
 * the content; the Android / web bar is docked, so the screen already ends above it.
 */
export function useTabBarSpace() {
  const insets = useSafeAreaInsets();
  return Platform.OS === 'ios' ? insets.bottom + 100 : 24;
}
