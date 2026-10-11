import { router } from 'expo-router';

import { TopBar } from '../TopBar';

type Props = {
  title: string;
  topInset: number;
  onBack?: () => void;
};

/**
 * Onboarding top bar: back button with the step's name, kept quiet — the screen's own big
 * title (OnboardingTitle) is the main heading.
 */
export function OnboardingHeader({ title, topInset, onBack }: Props) {
  return <TopBar title={title} topInset={topInset} onBack={onBack ?? (() => router.back())} subtle />;
}
