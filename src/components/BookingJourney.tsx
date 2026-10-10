import Ionicons from '@expo/vector-icons/Ionicons';
import { type StyleProp, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { type BookingItem, journeyFor, journeyStep, type Tone } from '../data/bookingsDemo';
import { TONES } from '../lib/bookings';
import { ink } from './home/homeTheme';
import { fonts } from './theme';

const GREEN = '#2B7A52';
const RED = '#C22F2F';

/** A booking's status as a small coloured label. */
export function StatusTag({ label, tone, style }: { label: string; tone: Tone; style?: StyleProp<ViewStyle> }) {
  const t = TONES[tone];
  return (
    <View style={[styles.tag, { backgroundColor: t.bg }, style]}>
      <Text style={[styles.tagText, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

/**
 * The steps a booking goes through: done steps get a green tick, the current one a yellow ring,
 * later ones stay grey. A cancelled booking stops where it was and ends with a red cross.
 * Plans and packs have no journey, so nothing is drawn for them.
 */
export function JourneyTimeline({ item, showTitle = true }: { item: BookingItem; showTitle?: boolean }) {
  const journey = journeyFor(item);
  if (!journey) return null;
  const cancelled = item.status === 'Cancelled';
  const current = journeyStep(item);
  const steps = cancelled
    ? [...journey.steps.slice(0, current + 1), { title: 'Cancelled', sub: 'Booking closed at this stage' }]
    : journey.steps;

  return (
    <View>
      {showTitle && <Text style={styles.title}>{journey.title}</Text>}
      {steps.map((step, i) => {
        const terminal = cancelled && i === steps.length - 1;
        const done = cancelled ? !terminal : i < current;
        const now = !cancelled && i === current;
        const last = i === steps.length - 1;
        return (
          <View key={step.title} style={styles.step}>
            <View style={styles.rail}>
              <View style={[styles.marker, done && styles.markerDone, now && styles.markerNow, terminal && styles.markerIssue]}>
                {done ? (
                  <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                ) : terminal ? (
                  <Ionicons name="close" size={13} color="#FFFFFF" />
                ) : (
                  <View style={[styles.markerCore, now && { backgroundColor: ink.yellowDeep }]} />
                )}
              </View>
              {!last && <View style={[styles.line, done && styles.lineDone]} />}
            </View>
            <View style={styles.copy}>
              <Text style={[styles.stepTitle, !done && !now && !terminal && styles.stepLater]}>{step.title}</Text>
              <Text style={styles.stepSub}>{now && item.alert ? item.alert : step.sub}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontFamily: fonts.bold,
    fontSize: 11.5,
  },
  title: {
    marginBottom: 12,
    fontFamily: fonts.extraBold,
    fontSize: 14,
    color: '#42464C',
  },
  step: {
    flexDirection: 'row',
    gap: 12,
  },
  rail: {
    width: 22,
    alignItems: 'center',
  },
  marker: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#DCDDE2',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDone: {
    borderColor: GREEN,
    backgroundColor: GREEN,
  },
  markerNow: {
    borderColor: ink.yellowDeep,
    backgroundColor: '#FFF6C9',
  },
  markerIssue: {
    borderColor: RED,
    backgroundColor: RED,
  },
  markerCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C9CBD2',
  },
  line: {
    flex: 1,
    width: 1.5,
    minHeight: 18,
    marginVertical: 3,
    backgroundColor: '#E4E5EA',
  },
  lineDone: {
    backgroundColor: GREEN,
  },
  copy: {
    flex: 1,
    paddingBottom: 16,
  },
  stepTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#272B2E',
  },
  stepLater: {
    color: '#ABB0B2',
  },
  stepSub: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: ink.muted,
  },
});
