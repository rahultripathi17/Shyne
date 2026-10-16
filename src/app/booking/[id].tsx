import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { JourneyTimeline, StatusTag } from '../../components/BookingJourney';
import { ink } from '../../components/home/homeTheme';
import { fonts, formatPrice, noBounce } from '../../components/theme';
import { Toast, useToast } from '../../components/Toast';
import { TopBar } from '../../components/TopBar';
import { ServiceTracking } from '../../components/tracking/ServiceTracking';
import { journeyFor, journeyStep, VERTICALS } from '../../data/bookingsDemo';
import { isTrackStage, stageFor } from '../../data/serviceTracking';
import { useAllBookings } from '../../lib/bookings';

/** The full booking page: status, schedule, journey, extras, payment, rating and help. */
export default function BookingDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { id, stage, due } = useLocalSearchParams<{ id: string; stage?: string; due?: string }>();
  const item = useAllBookings().find((b) => b.id === id);
  const toast = useToast();
  const [stars, setStars] = useState(0);

  if (!item) {
    return (
      <View style={styles.screen}>
        <TopBar title="Booking details" topInset={insets.top} onBack={() => router.back()} />
        <Text style={styles.missing}>This booking isn’t available any more.</Text>
      </View>
    );
  }

  // Wash and garage visits get the live tracking page; `?stage=` previews any stage.
  if ((item.vertical === 'washes' || item.vertical === 'garage') && !item.usage) {
    const at = isTrackStage(stage) ? stage : stageFor(item);
    return <ServiceTracking key={`${item.id}-${at}`} item={item} stage={at} dueOverride={Number(due) || undefined} />;
  }

  const vertical = VERTICALS.find((v) => v.key === item.vertical) ?? VERTICALS[0];
  const isService = item.vertical === 'washes' || item.vertical === 'garage';
  const journey = journeyFor(item);
  const step = journeyStep(item);
  const inProgress = isService && step >= 1 && step < 3 && item.status !== 'Cancelled';
  const upcoming = item.vertical === 'washes' && step === 0 && !item.history;
  const canRate = isService && !!journey && step >= journey.steps.length;
  const used = item.usage ? item.usage.total - item.usage.left : 0;
  const soon = (what: string) => toast.show(`${what} — coming soon`);

  return (
    <View style={styles.screen}>
      <TopBar title="Booking details" topInset={insets.top} onBack={() => router.back()} />
      <ScrollView {...noBounce} contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 28 }]}>
        {/* What */}
        <View style={styles.card}>
          <View style={styles.hero}>
            <View style={styles.heroArt}>
              {item.photo ? (
                <Image source={item.photo} resizeMode="cover" style={styles.heroPhoto} />
              ) : (
                <Image source={item.image ?? vertical.image} resizeMode="contain" style={styles.heroImg} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>{item.title}</Text>
              <Text style={styles.heroMeta}>{item.meta}</Text>
              <View style={styles.chips}>
                <View style={styles.typeChip}>
                  <Text style={styles.typeText}>{item.eyebrow}</Text>
                </View>
                <StatusTag label={item.status} tone={item.tone} />
              </View>
            </View>
          </View>
        </View>

        {item.alert ? (
          <View style={styles.alert}>
            <Ionicons name="warning" size={16} color="#C22F2F" />
            <Text style={styles.alertText}>{item.alert}</Text>
          </View>
        ) : null}

        {/* When & where */}
        <View style={styles.card}>
          <View style={styles.whenRow}>
            <Ionicons name="calendar-clear-outline" size={18} color={ink.text} />
            <Text style={styles.when}>{item.when.title}</Text>
          </View>
          <View style={styles.row}>
            <Ionicons
              name={item.subIsNote ? 'information-circle-outline' : 'location-outline'}
              size={18}
              color={ink.muted}
            />
            <Text style={styles.rowText}>{item.when.sub}</Text>
          </View>
          {upcoming && (
            <View style={styles.inlineActions}>
              <Pressable onPress={() => soon('Reschedule')} style={styles.inlineBtn} accessibilityRole="button">
                <Ionicons name="calendar-outline" size={15} color={ink.text} />
                <Text style={styles.inlineText}>Reschedule</Text>
              </Pressable>
              <Pressable onPress={() => soon('Cancel booking')} style={styles.inlineBtn} accessibilityRole="button">
                <Ionicons name="close-circle-outline" size={15} color={ink.text} />
                <Text style={styles.inlineText}>Cancel</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Journey */}
        {journey && (
          <View style={styles.card}>
            <JourneyTimeline item={item} />
          </View>
        )}

        {/* Plans and packs */}
        {item.usage && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Package usage</Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${(used / item.usage.total) * 100}%` }]} />
            </View>
            <Text style={styles.rowText}>
              <Text style={styles.strong}>
                {item.usage.left} of {item.usage.total}
              </Text>{' '}
              {item.usage.label}
            </Text>
          </View>
        )}

        {/* Extras */}
        {item.addOns?.length ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Extra add-ons</Text>
            {item.addOns.map((a) => (
              <View key={a.name} style={styles.line}>
                <Text style={styles.rowText}>{a.name}</Text>
                <Text style={styles.strong}>{a.qty} ×</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Payment */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <View style={styles.line}>
            <Text style={styles.rowText}>{item.amountDue ? 'Amount due' : 'Amount paid'}</Text>
            <Text style={[styles.amount, item.amountDue && { color: '#C22F2F' }]}>{formatPrice(item.amount)}</Text>
          </View>
          <View style={styles.line}>
            <Text style={styles.rowMuted}>{item.placed}</Text>
            {item.vertical !== 'washes' && <Text style={styles.rowMuted}>{item.ref}</Text>}
          </View>
        </View>

        {/* Rating */}
        {canRate && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>How was your service?</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable
                  key={n}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setStars(n);
                  }}
                  hitSlop={4}
                  accessibilityRole="radio"
                  accessibilityLabel={`${n} out of 5 stars`}
                  accessibilityState={{ selected: n <= stars }}
                >
                  <Ionicons
                    name={n <= stars ? 'star' : 'star-outline'}
                    size={30}
                    color={n <= stars ? ink.yellowDeep : '#C9CBD2'}
                  />
                </Pressable>
              ))}
            </View>
            <Text style={styles.rowMuted}>{stars ? 'Thanks for rating your service' : 'Tap a star to rate'}</Text>
          </View>
        )}

        {/* Help */}
        <View style={styles.help}>
          {inProgress && (
            <Pressable
              onPress={() => soon('Calling your professional')}
              style={styles.helpBtn}
              accessibilityRole="button"
            >
              <Ionicons name="call-outline" size={17} color={ink.text} />
              <Text style={styles.helpText}>Call professional</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => router.push({ pathname: '/help/raise', params: { booking: item.id } })}
            style={styles.helpBtn}
            accessibilityRole="button"
          >
            <Ionicons name="headset-outline" size={17} color={ink.text} />
            <Text style={styles.helpText}>Get help</Text>
          </Pressable>
        </View>
      </ScrollView>
      <Toast toast={toast} bottom={insets.bottom + 24} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },
  missing: {
    margin: 24,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: ink.muted,
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 6,
    gap: 12,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEDF1',
  },
  hero: {
    flexDirection: 'row',
    gap: 14,
  },
  heroArt: {
    width: 72,
    height: 72,
    borderRadius: 14,
    backgroundColor: '#F6F7F9',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroPhoto: {
    width: '100%',
    height: '100%',
  },
  heroImg: {
    width: 60,
    height: 56,
  },
  heroTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
    color: ink.text,
  },
  heroMeta: {
    marginTop: 3,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: ink.label,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F2F3F5',
  },
  typeText: {
    fontFamily: fonts.semiBold,
    fontSize: 11.5,
    color: ink.label,
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFEDEC',
  },
  alertText: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 13,
    color: '#C22F2F',
  },
  whenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  when: {
    flex: 1,
    fontFamily: fonts.extraBold,
    fontSize: 16,
    color: ink.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  rowText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13.5,
    color: ink.label,
  },
  rowMuted: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: ink.muted,
  },
  strong: {
    fontFamily: fonts.bold,
    color: ink.text,
  },
  inlineActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  inlineBtn: {
    flex: 1,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DADCE2',
  },
  inlineText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: ink.text,
  },
  sectionTitle: {
    marginBottom: 12,
    fontFamily: fonts.extraBold,
    fontSize: 14,
    color: '#42464C',
  },
  track: {
    height: 6,
    marginBottom: 8,
    borderRadius: 3,
    backgroundColor: '#F1F2F5',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: ink.text,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 4,
  },
  amount: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
    color: ink.text,
  },
  stars: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  help: {
    flexDirection: 'row',
    gap: 10,
  },
  helpBtn: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DADCE2',
  },
  helpText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: ink.text,
  },
});
