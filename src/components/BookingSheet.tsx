import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type BookingItem, journeyStep } from '../data/bookingsDemo';
import { JourneyTimeline } from './BookingJourney';
import { ink } from './home/homeTheme';
import { fonts, noBounce, useAnimatedValue } from './theme';

type Props = {
  item?: BookingItem;
  onClose: () => void;
  /** Kept for callers; the full page is reached from the card's button. */
  onDetails?: (item: BookingItem) => void;
  onHelp: (what: string) => void;
};

/**
 * The journey sheet, opened from a card's date: where the booking is right now, and the
 * two things you may need at that moment — call the professional, or get help.
 */
export function BookingSheet({ item, onClose, onHelp }: Props) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const progress = useAnimatedValue(0);
  // Keep showing the last booking while the sheet slides away.
  const [shown, setShown] = useState(item);
  if (item && item !== shown) setShown(item);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: item ? 1 : 0,
      duration: item ? 280 : 200,
      easing: item ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !item) setShown(undefined);
    });
  }, [item, progress]);

  if (!shown) return null;

  const isService = shown.vertical === 'washes' || shown.vertical === 'garage';
  const step = journeyStep(shown);
  // A professional is on the job once assigned and until the service is done.
  const canCall = isService && shown.status !== 'Cancelled' && step >= 1 && step <= 2;
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [height * 0.7, 0] });

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity: progress }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
      </Animated.View>

      <View style={styles.anchor} pointerEvents="box-none">
        <Animated.View style={[styles.sheet, { maxHeight: height * 0.85, transform: [{ translateY }] }]}>
          <View style={styles.handle} />

          {/* Which booking, and when — the close button sits beside the title, not over content */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={2}>
                {shown.title}
              </Text>
              <View style={styles.whenRow}>
                <Ionicons name="calendar-clear-outline" size={15} color={ink.muted} />
                <Text style={styles.whenText} numberOfLines={1}>
                  {shown.when.title}
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} hitSlop={8} style={styles.close} accessibilityRole="button" accessibilityLabel="Close">
              <Ionicons name="close" size={18} color={ink.text} />
            </Pressable>
          </View>

          <ScrollView {...noBounce} contentContainerStyle={styles.body}>
            {shown.usage ? (
              <View style={styles.note}>
                <Text style={styles.noteTitle}>
                  {shown.usage.left} of {shown.usage.total} {shown.usage.label}
                </Text>
                <Text style={styles.noteBody}>Manage your next visit from the plan details.</Text>
              </View>
            ) : (
              <JourneyTimeline item={shown} />
            )}

            {shown.alert ? (
              <View style={[styles.note, styles.noteRed]}>
                <Text style={[styles.noteTitle, { color: '#C22F2F' }]}>{shown.alert}</Text>
                <Text style={styles.noteBody}>We’re on it. You can call the professional or reach our team any time.</Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            {canCall && (
              <Pressable
                onPress={() => onHelp('Calling your professional')}
                style={({ pressed }) => [styles.action, styles.actionMain, pressed && { opacity: 0.88 }]}
                accessibilityRole="button"
              >
                <Ionicons name="call-outline" size={17} color="#FFFFFF" />
                <Text style={[styles.actionText, { color: '#FFFFFF' }]}>Call professional</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => onHelp('Help & Support')}
              style={({ pressed }) => [styles.action, pressed && { backgroundColor: '#F4F5F7' }]}
              accessibilityRole="button"
            >
              <Ionicons name="headset-outline" size={17} color={ink.text} />
              <Text style={styles.actionText}>Get help</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10,10,14,0.5)',
  },
  anchor: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  handle: {
    alignSelf: 'center',
    width: 38,
    height: 5,
    marginTop: 8,
    borderRadius: 3,
    backgroundColor: '#DCDDE2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E7EB',
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 19,
    lineHeight: 24,
    letterSpacing: -0.3,
    color: ink.text,
  },
  whenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  whenText: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 13.5,
    color: ink.label,
  },
  close: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F2F3F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 6,
  },
  note: {
    marginTop: 4,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFF8E1',
  },
  noteRed: {
    backgroundColor: '#FFEDEC',
  },
  noteTitle: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: ink.text,
  },
  noteBody: {
    marginTop: 3,
    fontFamily: fonts.medium,
    fontSize: 12.5,
    lineHeight: 18,
    color: ink.label,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  action: {
    flex: 1,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DADCE2',
    backgroundColor: '#FFFFFF',
  },
  actionMain: {
    borderColor: ink.text,
    backgroundColor: ink.text,
  },
  actionText: {
    fontFamily: fonts.bold,
    fontSize: 14.5,
    color: ink.text,
  },
});
