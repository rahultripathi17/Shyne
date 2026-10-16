import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, type StyleProp, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { ink } from './home/homeTheme';
import { fonts } from './theme';
import { fs, sz } from './responsive';

type PrimaryProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** The one main action style in the app: full-width, solid black and minimal. Disabled turns light grey. */
export function PrimaryButton({ label, onPress, disabled, icon, loading, style }: PrimaryProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primary,
        disabled && styles.primaryOff,
        pressed && !disabled && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <>
          {icon}
          <Text style={[styles.primaryText, disabled && styles.primaryTextOff]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

/** Quiet secondary action under the main button, e.g. "Skip for now". */
export function TextButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.text, pressed && { opacity: 0.55 }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.textLabel}>{label}</Text>
    </Pressable>
  );
}

/** Bottom action area: main button with an optional quiet action below it. */
export function ActionFooter({ bottomInset, children }: { bottomInset: number; children: ReactNode }) {
  return <View style={[styles.footer, { paddingBottom: Math.max(bottomInset, 14) }]}>{children}</View>;
}

const styles = StyleSheet.create({
  primary: {
    height: sz(48),
    flexDirection: 'row',
    gap: sz(8),
    borderRadius: sz(14),
    backgroundColor: ink.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryOff: {
    backgroundColor: '#ECEDF0',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  primaryText: {
    fontFamily: fonts.extraBold,
    fontSize: fs(15),
    letterSpacing: 0.1,
    color: '#FFFFFF',
  },
  primaryTextOff: {
    color: '#A3A6AE',
  },
  text: {
    height: sz(44),
    alignItems: 'center',
    justifyContent: 'center',
  },
  textLabel: {
    fontFamily: fonts.bold,
    fontSize: fs(15),
    color: ink.label,
  },
  footer: {
    paddingHorizontal: sz(20),
    paddingTop: sz(10),
    gap: sz(4),
    backgroundColor: '#FFFFFF',
  },
});
