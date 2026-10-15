import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts, noBounce } from '../../components/theme';
import { Toast, useToast } from '../../components/Toast';
import { Checklist, SavedBand } from '../../components/tracking/ServiceTracking';
import { InstructionsSheet, YellowButton } from '../../components/tracking/TrackingSheets';
import { T } from '../../components/tracking/trackTheme';
import { TRACK } from '../../data/serviceTracking';
import { useAllBookings } from '../../lib/bookings';

const CAR = require('../../../assets/booking/track/booked-car.png');

/** Right after booking a wash (Figma 4347): confirmed, what's booked, and what to keep ready. */
export default function BookingConfirmedScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { id, saved } = useLocalSearchParams<{ id?: string; saved?: string }>();
  const all = useAllBookings();
  const item = all.find((b) => b.id === id) ?? all.find((b) => b.id === 'w2')!;
  const [instructions, setInstructions] = useState(false);
  const [sheet, setSheet] = useState(false);
  const vehicle = item.meta.split(' · ')[0];

  return (
    <View style={styles.screen}>
      <ScrollView {...noBounce} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={[styles.head, { paddingTop: insets.top + 24 }]}>
          <View style={styles.check}>
            <Ionicons name="checkmark" size={30} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>Booking Confirmed</Text>
          <Text style={styles.sub}>Your service partner will arrive at the scheduled time.</Text>
        </View>
        <SavedBand amount={Number(saved) || TRACK.saved} />

        <View style={styles.body}>
          <View style={styles.card}>
            <View style={styles.carRow}>
              <Image source={item.image ?? CAR} style={styles.car} resizeMode="contain" />
              <View style={styles.flex}>
                <Text style={styles.vehicle} numberOfLines={1}>
                  {vehicle}
                </Text>
                <Text style={styles.service} numberOfLines={1}>
                  {item.title}
                </Text>
              </View>
            </View>
            <View style={styles.cardLine} />
            <View style={styles.metaRow}>
              <View style={styles.meta}>
                <Ionicons name="calendar-clear-outline" size={14} color={T.ink} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {item.when.title}
                </Text>
              </View>
              <View style={[styles.meta, styles.flex]}>
                <Ionicons name="location-outline" size={14} color={T.ink} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {item.when.sub}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable onPress={() => setSheet(true)} accessibilityRole="button" style={styles.addInstr}>
              <Text style={styles.addInstrText}>{instructions ? 'Instructions added' : 'Add Instructions'}</Text>
              <Ionicons name={instructions ? 'checkmark' : 'pencil'} size={14} color="#1B5FD0" />
            </Pressable>
            <Pressable
              onPress={() => router.replace({ pathname: '/booking/[id]', params: { id: item.id } })}
              accessibilityRole="button"
              style={({ pressed }) => [styles.track, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.trackText}>Track Order</Text>
            </Pressable>
          </View>

          <View style={styles.titleRow}>
            <Text style={styles.section}>Before Our Partner Arrives</Text>
            <Ionicons name="information-circle" size={16} color={T.ink} />
          </View>
          <Checklist />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <YellowButton label="Go to Home" onPress={() => router.replace('/')} />
      </View>

      <InstructionsSheet
        visible={sheet}
        onClose={() => setSheet(false)}
        onSubmit={() => {
          setInstructions(true);
          setSheet(false);
          toast.show('Instructions shared with your partner');
        }}
      />
      <Toast toast={toast} bottom={insets.bottom + 90} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  head: {
    paddingHorizontal: 24,
    paddingBottom: 22,
    alignItems: 'center',
    backgroundColor: T.headBg,
  },
  check: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1BA81B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 12,
    fontFamily: fonts.bold,
    fontSize: 21,
    color: T.ink,
  },
  sub: {
    marginTop: 4,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 14,
    color: T.muted,
  },
  body: {
    padding: 16,
  },
  card: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: T.border,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  carRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  car: {
    width: 80,
    height: 40,
  },
  vehicle: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: T.ink,
  },
  service: {
    marginTop: 3,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: T.muted,
  },
  cardLine: {
    marginVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EDEDED',
    borderStyle: 'dashed',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 14,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: '55%',
  },
  metaText: {
    flexShrink: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: T.ink,
  },
  actions: {
    marginTop: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addInstr: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
  },
  addInstrText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#1B5FD0',
  },
  track: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: T.ink,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  section: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: T.ink,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: T.border,
    backgroundColor: '#FFFFFF',
  },
});
