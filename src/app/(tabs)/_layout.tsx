import { Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Platform } from 'react-native';

import { BottomTabBar } from '../../components/BottomTabBar';
import { ink } from '../../components/home/homeTheme';

const TABS = [
  { name: 'index', title: 'Home', sf: ['house', 'house.fill'] },
  // Outline and filled versions of the same shape, so a tab never changes form when selected.
  // "Bookings" covers ongoing, upcoming and past services.
  { name: 'bookings', title: 'Bookings', sf: ['doc.text', 'doc.text.fill'] },
  { name: 'rewards', title: 'Rewards', sf: ['gift', 'gift.fill'] },
  { name: 'profile', title: 'Profile', sf: ['person.crop.circle', 'person.crop.circle.fill'] },
] as const;

export default function TabsLayout() {
  if (Platform.OS === 'ios') {
    // Apple's own tab bar — Liquid Glass on iOS 26+.
    return (
      <NativeTabs tintColor={ink.yellowDeep} minimizeBehavior="never">
        {TABS.map((t) => (
          // Home draws its banner under the status bar, so it opts out of the automatic top inset.
          <NativeTabs.Trigger key={t.name} name={t.name} disableAutomaticContentInsets={t.name === 'index'}>
            <NativeTabs.Trigger.Label>{t.title}</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon sf={{ default: t.sf[0], selected: t.sf[1] }} />
          </NativeTabs.Trigger>
        ))}
      </NativeTabs>
    );
  }

  // Android & web: a solid docked bar (no glass — it doesn't suit Android).
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <BottomTabBar {...props} />}>
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} options={{ title: t.title }} />
      ))}
    </Tabs>
  );
}
