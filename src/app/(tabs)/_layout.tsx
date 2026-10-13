import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { BookingDock, useVisibleDock } from '../../components/BookingDock';
import { BottomTabBar } from '../../components/BottomTabBar';

const TABS = [
  { name: 'index', title: 'Home' },
  { name: 'bookings', title: 'Bookings' },
  { name: 'rewards', title: 'Rewards' },
  { name: 'profile', title: 'Profile' },
] as const;

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

/**
 * Nav + booking dock as one white panel (rounded top, one shadow) floating over the screen —
 * the iOS 26 "tab bar accessory" idea. Without dock items it's just the normal nav bar.
 * Screens pad their end via useTabBarSpace; touches outside the panel fall through.
 */
function TabBarWithDock(props: TabBarProps) {
  const entries = useVisibleDock();
  // Bookings already lists everything the dock would show.
  const showDock = entries.length > 0 && props.state.routes[props.state.index]?.name !== 'bookings';

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      <View style={showDock && styles.panel}>
        {showDock && <BookingDock entries={entries} />}
        <BottomTabBar {...props} merged={showDock} />
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBarWithDock {...props} />}>
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} options={{ title: t.title }} />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    ...Platform.select({
      android: { elevation: 16 },
      default: {
        shadowColor: '#0B0B0F',
        shadowOpacity: 0.08,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: -4 },
      },
    }),
  },
});
