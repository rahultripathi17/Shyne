import { Stack } from 'expo-router';

import { ink } from '../../components/home/homeTheme';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: ink.surface },
        animation: 'slide_from_right',
      }}
    />
  );
}
