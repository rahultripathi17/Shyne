import { useState } from 'react';
import { Animated, StyleSheet } from 'react-native';

// Like React Native's useAnimatedValue, which react-native-web doesn't provide.
export const useAnimatedValue = (initial: number) => useState(() => new Animated.Value(initial))[0];

// Placeholder palette — swap these values when the Figma designs arrive.
export const colors = {
  brand: '#0A66FF',
  brandDark: '#0047B3',
  brandLight: '#E8F0FF',
  brandOnDark: '#BFD4FF',
  accent: '#00C2A8',
  text: '#0F172A',
  textMuted: '#64748B',
  background: '#F4F6FA',
  card: '#FFFFFF',
  border: '#E2E8F0',
  success: '#16A34A',
  warning: '#D97706',
};

export const shared = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    // TabScroll adds the safe-area top and tab-bar bottom space on every platform.
    paddingBottom: 120,
    paddingTop: 12,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: colors.brand,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export const formatPrice = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

/** App-wide rule: scroll views stay in place at their edges (no iOS bounce, no Android stretch glow). */
export const noBounce = {
  bounces: false,
  alwaysBounceVertical: false,
  alwaysBounceHorizontal: false,
  overScrollMode: 'never',
} as const;

// From the Hoora Figma home screen (Designer File — Customer App Changes).
export const figma = {
  text: '#202020',
  textMuted: '#646464',
  sheet: '#FAFAFB',
  gold: '#A98000',
  navy: '#012E89',
  navyDark: '#001846',
  plate: '#2A3C6E',
  plateText: '#153E8E',
  alert: '#FF5151',
  pillText: '#B6A62B',
  watermark: 'rgba(32,32,32,0.2)',
  cardShadow: 'rgba(32,32,32,0.08)',
  addressText: '#E7E6E7',
};

// Weight roles, tuned to the Figma (Dev File): text is mostly Medium/SemiBold, Bold is for the few
// numbers and headings that lead a screen. Plus Jakarta Sans runs wide, so the heavy cuts read as
// shouting on a phone: `bold` maps to SemiBold and `extraBold` to Bold. The 800 cut is kept only
// for the italic "BLACK" wordmark.
export const fonts = {
  extraLight: 'PlusJakartaSans_200ExtraLight',
  light: 'PlusJakartaSans_300Light',
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_600SemiBold',
  extraBold: 'PlusJakartaSans_700Bold',
  extraBoldItalic: 'PlusJakartaSans_800ExtraBold_Italic',
};
