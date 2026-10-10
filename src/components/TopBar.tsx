import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ink } from './home/homeTheme';
import { fonts } from './theme';

type Props = {
  title: string;
  topInset: number;
  onBack: () => void;
  right?: ReactNode;
};

/** Standard app bar: back button and title on one row, optional action on the right. */
export function TopBar({ title, topInset, onBack, right }: Props) {
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
      <Text style={styles.title} numberOfLines={1}>
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
    fontSize: 18,
    letterSpacing: -0.3,
    color: ink.text,
  },
  right: {
    minWidth: 40,
    alignItems: 'flex-end',
    paddingRight: 8,
  },
});
