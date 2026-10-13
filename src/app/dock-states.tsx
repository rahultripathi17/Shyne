import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DockCard } from '../components/BookingDock';
import { ink } from '../components/home/homeTheme';
import { TopBar } from '../components/TopBar';
import { fonts } from '../components/theme';
import { ALL_DOCK_STATES } from '../data/bookingDock';

/**
 * Every state of the booking dock with sample data, in priority order — for design review and
 * the developer handoff. Opened by long-pressing the dock (development builds only).
 */
export default function DockStatesScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.screen}>
      <TopBar title="Booking dock · all states" topInset={insets.top} onBack={() => router.back()} subtle />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.lead}>
          Shown above the nav, most time-critical first. Swipe when there’s more than one.
        </Text>
        {ALL_DOCK_STATES.map(({ label, item }, i) => (
          <View key={label} style={styles.row}>
            <Text style={styles.label}>
              {i + 1}. {label}
            </Text>
            <DockCard item={item} onDismiss={() => {}} />
          </View>
        ))}
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
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 18,
  },
  lead: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: ink.muted,
    paddingHorizontal: 4,
  },
  row: {
    gap: 8,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: ink.label,
    paddingHorizontal: 4,
  },
});
