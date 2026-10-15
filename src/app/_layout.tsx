import {
  PlusJakartaSans_200ExtraLight,
  PlusJakartaSans_300Light,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  PlusJakartaSans_800ExtraBold_Italic,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { SplashOverlay } from '../components/SplashOverlay';
import { ink } from '../components/home/homeTheme';
import { setupNotifications, useNotificationRouting } from '../lib/notifications';
import { AppStoreProvider, useAppStore } from '../store/AppStore';

setupNotifications();

function RootNavigator({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { ready, onboarded } = useAppStore();
  // Tapping a notification opens its screen (booking, wallet, leaderboard…) once the app is in.
  useNotificationRouting(fontsLoaded && ready && onboarded);
  if (!fontsLoaded || !ready) return null;

  return (
    <Stack screenOptions={{ headerTintColor: ink.text }}>
      {/* Onboarding until a vehicle is added; then the app. Switching the guard redirects automatically. */}
      <Stack.Protected guard={!onboarded}>
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
      </Stack.Protected>
      <Stack.Protected guard={onboarded}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* Booking flow: Car Services → Slot → Checkout → Confirmed, and the address picker */}
        <Stack.Screen name="wash" options={{ headerShown: false }} />
        <Stack.Screen name="booking/slot" options={{ headerShown: false }} />
        <Stack.Screen name="booking/checkout" options={{ headerShown: false }} />
        <Stack.Screen name="booking/pay" options={{ headerShown: false }} />
        <Stack.Screen name="address/index" options={{ headerShown: false }} />
        <Stack.Screen name="address/map" options={{ headerShown: false }} />
        {/* Full screens (not sheets) with their own top bar */}
        <Stack.Screen name="add-car" options={{ headerShown: false }} />
        <Stack.Screen name="vehicles" options={{ headerShown: false }} />
        <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
        <Stack.Screen name="account-settings" options={{ headerShown: false }} />
        <Stack.Screen name="booking/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="booking/confirmed" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="configuration" options={{ headerShown: false }} />
        <Stack.Screen name="refer/leagues" options={{ headerShown: false }} />
        <Stack.Screen name="refer/leaderboard" options={{ headerShown: false }} />
        <Stack.Screen name="refer/referrals" options={{ headerShown: false }} />
        <Stack.Screen name="refer/points" options={{ headerShown: false }} />
        <Stack.Screen name="refer/store" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

/**
 * Status bar icons: dark over the cream splash, then the right colour for the first real screen
 * (white over Home's photo banner, dark on login). Set imperatively, because when a <StatusBar>
 * component unmounts Android falls back to white icons, which vanish on light screens.
 */
function StatusBarSync({ showSplash }: { showSplash: boolean }) {
  const { onboarded } = useAppStore();
  useEffect(() => {
    // Dark icons on the cream splash; then light over Home's photo banner, dark on login.
    setStatusBarStyle(showSplash ? 'dark' : onboarded ? 'light' : 'dark');
  }, [showSplash, onboarded]);
  return null;
}

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const hideSplash = useCallback(() => setShowSplash(false), []);
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_200ExtraLight,
    PlusJakartaSans_300Light,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    PlusJakartaSans_800ExtraBold_Italic,
  });

  return (
    <ThemeProvider value={DefaultTheme}>
      <AppStoreProvider>
        <View style={{ flex: 1, backgroundColor: ink.bg }}>
          <RootNavigator fontsLoaded={fontsLoaded} />
          {showSplash && <SplashOverlay onDone={hideSplash} />}
        </View>
        <StatusBarSync showSplash={showSplash} />
      </AppStoreProvider>
    </ThemeProvider>
  );
}
