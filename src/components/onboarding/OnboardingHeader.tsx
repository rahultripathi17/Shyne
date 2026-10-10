import { router } from 'expo-router';

import { TopBar } from '../TopBar';

type Props = {
  title: string;
  topInset: number;
  onBack?: () => void;
};

/** Onboarding top bar: the app-wide standard, back button with the screen title beside it. */
export function OnboardingHeader({ title, topInset, onBack }: Props) {
  return <TopBar title={title} topInset={topInset} onBack={onBack ?? (() => router.back())} />;
}
