import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ink } from './home/homeTheme';
import { fonts } from './theme';

type Props = {
  title: ReactNode;
  topInset: number;
  onBack: () => void;
  right?: ReactNode;
  /** A quieter title, for screens whose main heading sits in the content below. */
  subtle?: boolean;
};

/** Standard app bar: back button and title on one row, optional action on the right. */
export function TopBar({ title, topInset, onBack, right, subtle }: Props) {
  return (
    <View style={[styles.bar, { paddingTop: topInset + 4 }]}>
      <Pressable
        onPress={onBack}
        hitSlop={10}
        style={({ pressed }) => [styles.back, pressed && { opacity: 0.6 }]}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <Ionicons name="chevron-back" size={24} color={ink.text} />
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
    paddingHorizontal: 8,
    paddingBottom: 6,
    minHeight: 52,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    marginLeft: 2,
    fontFamily: fonts.extraBold,
    fontSize: 17,
    letterSpacing: -0.3,
    color: ink.text,
  },
  titleSubtle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    letterSpacing: -0.1,
    color: ink.label,
  },
  right: {
    minWidth: 40,
    alignItems: 'flex-end',
    paddingRight: 8,
  },
});
