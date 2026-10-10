import { useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { type ReactNode, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ink } from './home/homeTheme';
import { useTabBarSpace } from './tabBarSpace';
import { fonts, noBounce } from './theme';

type Props = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
};

/**
 * Shared frame for the Bookings, Refer and Profile tabs: white page, a solid strip behind the
 * status bar so nothing ever scrolls under the clock / network icons, the same title style on
 * every tab, and bottom space that clears the tab bar.
 */
export function TabScroll({ title, subtitle, right, children }: Props) {
  const insets = useSafeAreaInsets();
  const bottomSpace = useTabBarSpace();

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('dark');
    }, []),
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        {...noBounce}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: bottomSpace }]}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {right}
        </View>
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  headerText: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 24,
    letterSpacing: -0.5,
    color: ink.text,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: ink.muted,
  },
});
