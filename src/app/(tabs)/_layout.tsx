import { Tabs } from 'expo-router';

import { BottomTabBar } from '../../components/BottomTabBar';

const TABS = [
  { name: 'index', title: 'Home' },
  { name: 'bookings', title: 'Bookings' },
  { name: 'rewards', title: 'Rewards' },
  { name: 'profile', title: 'Profile' },
] as const;

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <BottomTabBar {...props} />}>
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} options={{ title: t.title }} />
      ))}
    </Tabs>
  );
}
