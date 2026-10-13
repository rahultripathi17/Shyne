import {
  PlusJakartaSans_200ExtraLight,
  PlusJakartaSans_300Light,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { SplashOverlay } from '../components/SplashOverlay';
import { ink } from '../components/home/homeTheme';
import { AppStoreProvider, useAppStore } from '../store/AppStore';

function RootNavigator({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { ready, onboarded } = useAppStore();
  if (!fontsLoaded || !ready) return null;

  return (
    <Stack screenOptions={{ headerTintColor: ink.text }}>
      {/* Onboarding until a vehicle is added; then the app. Switching the guard redirects automatically. */}
      <Stack.Protected guard={!onboarded}>
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
      </Stack.Protected>
      <Stack.Protected guard={onboarded}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="wash" options={{ title: 'Car & Bike Wash' }} />
        <Stack.Screen name="service/[id]" options={{ presentation: 'modal', title: 'Book a wash' }} />
        {/* Full screens (not sheets) with their own top bar */}
        <Stack.Screen name="add-car" options={{ headerShown: false }} />
        <Stack.Screen name="vehicles" options={{ headerShown: false }} />
        <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
        <Stack.Screen name="account-settings" options={{ headerShown: false }} />
        <Stack.Screen name="booking/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="configuration" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

/**
 * Status bar icons: white over the black splash, then the right colour for the first real screen
 * (white over Home's photo banner, dark on login). Set imperatively, because when a <StatusBar>
 * component unmounts Android falls back to white icons, which vanish on light screens.
 */
function StatusBarSync({ showSplash }: { showSplash: boolean }) {
  const { onboarded } = useAppStore();
  useEffect(() => {
    setStatusBarStyle(showSplash || onboarded ? 'light' : 'dark');
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
