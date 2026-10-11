import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ink } from '../home/homeTheme';
import { fonts } from '../theme';

/** One short line under the top bar that says why this step matters. */
export function OnboardingLead({ children }: { children: ReactNode }) {
  return <Text style={styles.lead}>{children}</Text>;
}

/**
 * The second and third levels of an onboarding screen: a big title that asks the question,
 * then one muted line under it. The top bar holds the first level (the step's name).
 */
export function OnboardingTitle({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <View style={styles.block}>
      <Text style={styles.title}>{title}</Text>
      {children ? <Text style={[styles.lead, styles.leadUnder]}>{children}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    paddingTop: 6,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.6,
    color: ink.text,
  },
  lead: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: ink.muted,
  },
  leadUnder: {
    marginTop: 6,
  },
});
