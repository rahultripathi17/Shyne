import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ink } from './home/homeTheme';
import { fonts } from './theme';
import { fs, sz } from './responsive';

type Props = {
  title: ReactNode;
  topInset: number;
  onBack: () => void;
  right?: ReactNode;
  /** A quieter title, for screens whose main heading sits in the content below. */
  subtle?: boolean;
  /** Android-style back arrow (←) instead of the chevron. */
  arrow?: boolean;
};

/** Standard app bar: back button and title on one row, optional action on the right. */
export function TopBar({ title, topInset, onBack, right, subtle, arrow }: Props) {
  return (
    <View style={[styles.bar, { paddingTop: topInset + 4 }]}>
      <Pressable
        onPress={onBack}
        hitSlop={10}
        style={({ pressed }) => [styles.back, pressed && { opacity: 0.6 }]}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <Ionicons name={arrow ? 'arrow-back' : 'chevron-back'} size={arrow ? 22 : 24} color={ink.text} />
      </Pressable>
      <Text style={[styles.title, subtle && styles.titleSubtle]} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sz(8),
    paddingBottom: sz(6),
    minHeight: sz(52),
  },
  back: {
    width: sz(40),
    height: sz(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    marginLeft: sz(2),
    fontFamily: fonts.extraBold,
    fontSize: fs(17),
    letterSpacing: -0.3,
    color: ink.text,
  },
  titleSubtle: {
    fontFamily: fonts.bold,
    fontSize: fs(16),
    letterSpacing: -0.1,
    color: ink.label,
  },
  right: {
    minWidth: sz(40),
    alignItems: 'flex-end',
    paddingRight: sz(8),
  },
});
