import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Animated, Easing, Image, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type BookingItem, VERTICALS } from '../data/bookingsDemo';
import { WHEN_CAPTION } from '../lib/bookings';
import { JourneyTimeline, StatusTag } from './BookingJourney';
import { ink } from './home/homeTheme';
import { fonts, noBounce, useAnimatedValue } from './theme';

type Props = {
  item?: BookingItem;
  onClose: () => void;
  onDetails: (item: BookingItem) => void;
  onHelp: (what: string) => void;
};

// One plain line naming what this booking is, shown next to the close button.
const SHEET_TITLE: Record<BookingItem['vertical'], string> = {
  washes: 'Doorstep wash',
  society: 'Society pack',
  products: 'Product order',
  bundles: 'Wash pack',
  challans: 'Challan payment',
  garage: 'Garage service',
  qr: 'Connect QR order',
};

/**
 * Opened from a card's schedule: when and where the service is, and where it is in its journey.
 * Everything else (add-ons, payment, rating) lives on the full booking page.
 */
export function BookingSheet({ item, onClose, onDetails, onHelp }: Props) {
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

  const vertical = VERTICALS.find((v) => v.key === shown.vertical) ?? VERTICALS[0];
  const isPlan = shown.vertical === 'society' || shown.vertical === 'bundles';
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [height * 0.7, 0] });

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity: progress }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
      </Animated.View>

      <View style={styles.anchor} pointerEvents="box-none">
        <Animated.View style={[styles.sheet, { maxHeight: height * 0.88, transform: [{ translateY }] }]}>
          <View style={styles.handle} />
          <View style={styles.top}>
            <Text style={styles.topTitle} numberOfLines={1}>
              {SHEET_TITLE[shown.vertical]}
            </Text>
            <Pressable onPress={onClose} hitSlop={8} style={styles.close} accessibilityRole="button" accessibilityLabel="Close">
              <Ionicons name="close" size={18} color={ink.text} />
            </Pressable>
          </View>

          <ScrollView {...noBounce} contentContainerStyle={[styles.body, { paddingBottom: Math.max(insets.bottom, 16) + 6 }]}>
            {/* What */}
            <View style={styles.summary}>
              <View style={styles.summaryArt}>
                <Image source={shown.image ?? vertical.image} resizeMode="contain" style={styles.summaryImg} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryTitle}>{shown.title}</Text>
                <Text style={styles.summaryMeta} numberOfLines={1}>
                  {shown.meta}
                </Text>
              </View>
              <StatusTag label={shown.status} tone={shown.tone} />
            </View>

            {/* When & where */}
            <View style={styles.when}>
              <Text style={styles.whenCaption}>{WHEN_CAPTION[shown.when.icon]}</Text>
              <Text style={styles.whenTitle}>{shown.when.title}</Text>
              <View style={styles.whenRow}>
                <Ionicons name="location-outline" size={14} color={ink.muted} />
                <Text style={styles.whenSub}>{shown.when.sub}</Text>
              </View>
            </View>

            {/* Journey */}
            <View style={{ marginTop: 18 }}>
              <JourneyTimeline item={shown} />
            </View>

            {isPlan && shown.usage && (
              <View style={styles.note}>
                <Text style={styles.noteTitle}>
                  {shown.usage.left} of {shown.usage.total} {shown.usage.label}
                </Text>
                <Text style={styles.noteBody}>Manage your next visit from the plan details.</Text>
              </View>
            )}

            {shown.alert ? (
              <View style={[styles.note, styles.noteRed]}>
                <Text style={[styles.noteTitle, { color: '#C22F2F' }]}>{shown.alert}</Text>
                <Text style={styles.noteBody}>We’re on it. You can reach the professional or our team any time.</Text>
              </View>
            ) : null}

            <View style={styles.links}>
              <Pressable onPress={() => onHelp('Help & Support')} style={styles.link} accessibilityRole="button">
                <Ionicons name="headset-outline" size={17} color={ink.text} />
                <Text style={styles.linkText}>Get help</Text>
              </Pressable>
              <Pressable onPress={() => onDetails(shown)} style={[styles.link, styles.linkMain]} accessibilityRole="button">
                <Text style={[styles.linkText, { color: '#FFFFFF' }]}>Full details</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </Pressable>
            </View>
          </ScrollView>
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
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 18,
    paddingRight: 14,
    paddingTop: 10,
    paddingBottom: 12,
  },
  topTitle: {
    flex: 1,
    fontFamily: fonts.extraBold,
    fontSize: 17,
    color: ink.text,
  },
  close: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F3F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: 18,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryArt: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F6F7F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryImg: {
    width: 40,
    height: 38,
  },
  summaryTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: ink.text,
  },
  summaryMeta: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: ink.label,
  },
  when: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#F7F8FA',
  },
  whenCaption: {
    fontFamily: fonts.semiBold,
    fontSize: 11.5,
    color: ink.muted,
  },
  whenTitle: {
    marginTop: 2,
    fontFamily: fonts.extraBold,
    fontSize: 17,
    color: ink.text,
  },
  whenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  whenSub: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: ink.label,
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
  links: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  link: {
    flex: 1,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DADCE2',
  },
  linkMain: {
    borderColor: ink.text,
    backgroundColor: ink.text,
  },
  linkText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: ink.text,
  },
});
