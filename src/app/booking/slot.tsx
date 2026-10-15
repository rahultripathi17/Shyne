import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddressRow } from '../../components/booking/AddressBar';
import { fonts, noBounce } from '../../components/theme';
import { Toast, useToast } from '../../components/Toast';
import { TopBar } from '../../components/TopBar';
import { YellowButton } from '../../components/tracking/TrackingSheets';
import { T } from '../../components/tracking/trackTheme';
import { nextDays, setDraft, SLOT_HOURS, slotRange, useDraft } from '../../data/bookingFlow';
import { useAppStore } from '../../store/AppStore';

// Slot (Figma "OD" 12391:6044): instant in 30 minutes, or a day and a one-hour start window.

export default function SlotScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const draft = useDraft();
  const { location } = useAppStore();
  const [now] = useState(() => new Date());
  const days = nextDays(now);
  const instantOk = draft.plan === 'one-time' && now.getHours() >= 7 && now.getHours() < 18;
  const instant = instantOk && draft.instant;
  const date = draft.date ?? days[0].iso;
  const day = days.find((d) => d.iso === date) ?? days[0];
  const past = (h: number) => date === days[0].iso && h <= now.getHours();
  const ready = instant || draft.hour !== undefined;

  const pickDate = (iso: string) => {
    void Haptics.selectionAsync();
    setDraft({ instant: false, date: iso, hour: draft.date === iso ? draft.hour : undefined });
  };

  const next = () => {
    if (!location) {
      toast.show('Add the address for your service');
      router.push('/address');
      return;
    }
    if (!ready) {
      toast.show('Pick a start time');
      return;
    }
    if (!instant && !draft.date) setDraft({ date });
    router.push('/booking/checkout');
  };

  return (
    <View style={styles.screen}>
      <TopBar
        title={draft.plan === 'package' ? 'Select your first wash slot' : 'Select your wash slot'}
        topInset={insets.top}
        onBack={() => router.back()}
      />
      <ScrollView {...noBounce} contentContainerStyle={styles.body}>
        <Text style={styles.q}>When should the service partner arrive?</Text>

        {instantOk && (
          <Pressable
            onPress={() => setDraft({ instant: true })}
            accessibilityRole="radio"
            accessibilityState={{ selected: instant }}
            style={[styles.card, styles.instant]}
          >
            <View style={styles.flex}>
              <View style={styles.fast}>
                <Ionicons name="flash" size={11} color="#FFE300" />
                <Text style={styles.fastText}>In 30 mins</Text>
              </View>
              <Text style={styles.cardTitle}>Get Instant Service</Text>
            </View>
            <Radio on={instant} />
          </Pressable>
        )}

        <View style={styles.card}>
          <Pressable
            onPress={() => setDraft({ instant: false, date })}
            accessibilityRole="radio"
            accessibilityState={{ selected: !instant }}
            style={styles.laterHead}
          >
            <View style={styles.flex}>
              <Text style={styles.cardTitle}>Schedule for later</Text>
              <Text style={styles.cardSub}>Select the date of your Service</Text>
            </View>
            <Radio on={!instant} />
          </Pressable>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days}>
            {days.map((d) => {
              const on = !instant && d.iso === date;
              return (
                <Pressable
                  key={d.iso}
                  onPress={() => pickDate(d.iso)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  style={[styles.day, on && styles.dayOn]}
                >
                  <Text style={[styles.dayName, on && styles.dayNameOn]}>{d.day}</Text>
                  <Text style={styles.dayNum}>{d.date}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.dash} />
          <Text style={styles.timeHead}>Select the start time of service</Text>
          <Text style={styles.dayLabel}>{day.label}</Text>
          <View style={styles.grid}>
            {SLOT_HOURS.map((h) => {
              const off = past(h);
              const on = !instant && draft.hour === h && draft.date === date;
              return (
                <Pressable
                  key={h}
                  disabled={off}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setDraft({ instant: false, date, hour: h });
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on, disabled: off }}
                  style={[styles.time, on && styles.dayOn, off && styles.timeOff]}
                >
                  <Text style={[styles.timeText, off && styles.timeTextOff]}>{slotRange(h)}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.terms}>
          <Ionicons name="information-circle" size={18} color="#C9A23A" />
          <Text style={styles.termsText}>
            By proceeding further you agree to our service{' '}
            <Text style={styles.termsLink} onPress={() => toast.show('Terms & Conditions')}>
              Terms & Conditions
            </Text>
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <AddressRow />
        <View style={styles.footerBtn}>
          <YellowButton label="Continue" onPress={next} />
        </View>
      </View>
      <Toast toast={toast} bottom={insets.bottom + 140} />
    </View>
  );
}

function Radio({ on }: { on: boolean }) {
  return <View style={[styles.radio, on && styles.radioOn]}>{on && <View style={styles.radioInner} />}</View>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  body: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  q: {
    fontFamily: fonts.medium,
    fontSize: 17,
    color: T.text,
  },
  card: {
    marginTop: 14,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E3E5E9',
  },
  instant: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fast: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#1B891F',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  fastText: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: '#FFFFFF',
  },
  cardTitle: {
    marginTop: 6,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: T.text,
  },
  cardSub: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: T.muted,
  },
  laterHead: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#C9CBD2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: {
    borderColor: T.text,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: T.text,
  },
  days: {
    paddingTop: 14,
    gap: 12,
  },
  day: {
    width: 56,
    height: 58,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D9DBE0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayOn: {
    borderColor: '#F2D23A',
    backgroundColor: '#FFFBE6',
  },
  dayName: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: T.muted,
  },
  dayNameOn: {
    color: T.ink,
  },
  dayNum: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: T.text,
  },
  dash: {
    marginVertical: 16,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E3E3E3',
  },
  timeHead: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: T.text,
  },
  dayLabel: {
    marginTop: 12,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: T.text,
  },
  grid: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  time: {
    width: '30.5%',
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D9DBE0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeOff: {
    backgroundColor: '#F5F5F5',
    borderColor: '#EEEEEE',
  },
  timeText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: T.text,
  },
  timeTextOff: {
    color: '#BDBDBD',
  },
  terms: {
    marginTop: 18,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FFF9E8',
    flexDirection: 'row',
    gap: 10,
  },
  termsText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: T.ink,
  },
  termsLink: {
    textDecorationLine: 'underline',
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E3E5E9',
    backgroundColor: '#FFFFFF',
  },
  footerBtn: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
});
