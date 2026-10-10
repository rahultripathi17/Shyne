import type { ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';

import { ink } from '../home/homeTheme';
import { fonts } from '../theme';

/** One short line under the top bar that says why this step matters. */
export function OnboardingLead({ children }: { children: ReactNode }) {
  return <Text style={styles.lead}>{children}</Text>;
}

const styles = StyleSheet.create({
  lead: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: ink.muted,
  },
});
