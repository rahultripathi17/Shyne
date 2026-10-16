import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { type ComponentProps, type ReactNode, useState } from 'react';
import { Image, type ImageSourcePropType, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ink } from '../../components/home/homeTheme';
import { fs, sz } from '../../components/responsive';
import { fonts, noBounce } from '../../components/theme';
import type { BookingItem } from '../../data/bookingsDemo';
import { FAQS, SUPPORT } from '../../data/support';
import { useAllBookings } from '../../lib/bookings';

// Help & Support: the My Bookings header (lemon wash fading to white), then one pattern for every
// section — a white card of rows: soft-yellow icon square, title + one line, chevron.
//   Banner — “Please get in touch” (the Figma hero)
//   1. Need help with a booking?
//   2. Support tickets — Raise a ticket, My tickets
//   3. Still need help? — Call support, then Email us
//   4. FAQs

type IconName = ComponentProps<typeof Ionicons>['name'];

// The My Bookings header shade.
const HEADER_SHADE = ['#FFF593', '#FFF9AD', '#FEFAD4', '#FFFDEE'] as const;
const HERO = require('../../../assets/help/help-hero.png');
const SERVICE_ART: Partial<Record<BookingItem['vertical'], ImageSourcePropType>> = {
  washes: require('../../../assets/home/v2/wash-icon.png'),
  garage: require('../../../assets/home/v2/garage-icon.png'),
};

/** One row: a soft-yellow icon square (or a picture), title, one line, chevron. */
function Row({
  icon,
  art,
  title,
  sub,
  onPress,
  first,
  label,
}: {
  icon?: IconName;
  art?: ReactNode;
  title: string;
  sub?: string;
  onPress: () => void;
  first?: boolean;
  label?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, !first && styles.line, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={label ?? title}
    >
      {art ?? (
        <View style={styles.icon}>
          <Ionicons name={icon} size={sz(17)} color={ink.text} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {title}
        </Text>
        {sub ? (
          <Text style={styles.rowSub} numberOfLines={1}>
            {sub}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={sz(16)} color={ink.muted} />
    </Pressable>
  );
}

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const [faq, setFaq] = useState<number>();
  const recent = useAllBookings()
    .filter((b) => b.vertical === 'washes' || b.vertical === 'garage')
    .slice(0, 2);

  return (
    <View style={styles.screen}>
      {/* Header — as on My Bookings */}
      <LinearGradient
        colors={HEADER_SHADE}
        locations={[0, 0.35, 0.7, 1]}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={({ pressed }) => pressed && { opacity: 0.6 }}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="arrow-back" size={sz(21)} color={ink.text} />
        </Pressable>
        <Text style={styles.screenTitle}>Help & Support</Text>
      </LinearGradient>

      <ScrollView {...noBounce} contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 32 }]}>
        {/* Banner (as in the Figma) */}
        <View style={styles.banner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Please get in touch</Text>
            <Text style={styles.bannerSub}>We will be happy to help you</Text>
          </View>
          <Image source={HERO} style={styles.bannerArt} resizeMode="contain" accessibilityIgnoresInvertColors />
        </View>

        {/* 1 · A recent booking */}
        {recent.length > 0 && (
          <>
            <Text style={styles.section}>Need help with a booking?</Text>
            <View style={styles.card}>
              {recent.map((b, i) => (
                <Row
                  key={b.id}
                  first={i === 0}
                  art={
                    <View style={styles.bookingArt}>
                      <Image
                        source={b.photo ?? SERVICE_ART[b.vertical]}
                        resizeMode={b.photo ? 'cover' : 'contain'}
                        style={b.photo ? styles.photo : styles.artImg}
                      />
                    </View>
                  }
                  title={b.title}
                  sub={`${b.meta.split(' · ')[0]} · ${b.when.title.split(' · ')[0]}`}
                  label={`Get help with ${b.title}`}
                  onPress={() => router.push({ pathname: '/help/raise', params: { booking: b.id } })}
                />
              ))}
            </View>
          </>
        )}

        {/* 2 · Tickets */}
        <Text style={styles.section}>Support tickets</Text>
        <View style={styles.card}>
          <Row
            first
            icon="ticket-outline"
            title="Raise a ticket"
            sub="Tell us what went wrong"
            onPress={() => router.push('/help/raise')}
          />
          <Row
            icon="chatbox-ellipses-outline"
            title="My tickets"
            sub="See replies and status"
            onPress={() => router.push('/help/tickets')}
          />
        </View>

        {/* 3 · Call, then email */}
        <Text style={styles.section}>Still need help?</Text>
        <View style={styles.card}>
          <Row
            first
            icon="call-outline"
            title="Call support"
            sub="Talk to our team"
            onPress={() => void Linking.openURL(`tel:${SUPPORT.phone}`)}
          />
          <Row
            icon="mail-outline"
            title="Email us"
            sub={SUPPORT.email}
            onPress={() => void Linking.openURL(`mailto:${SUPPORT.email}`)}
          />
        </View>

        {/* 4 · FAQs */}
        <Text style={styles.section}>FAQs</Text>
        <View style={styles.card}>
          {FAQS.map((f, i) => {
            const on = faq === i;
            return (
              <Pressable
                key={f.q}
                onPress={() => setFaq(on ? undefined : i)}
                style={[styles.faq, i > 0 && styles.line]}
                accessibilityRole="button"
                accessibilityState={{ expanded: on }}
              >
                <View style={styles.faqRow}>
                  <Text style={styles.faqQ}>{f.q}</Text>
                  <Ionicons name={on ? 'chevron-up' : 'chevron-down'} size={sz(16)} color={ink.muted} />
                </View>
                {on && <Text style={styles.faqA}>{f.a}</Text>}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // My Bookings header: one line, back arrow + title
  header: {
    paddingHorizontal: sz(16),
    paddingBottom: sz(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: sz(12),
  },
  screenTitle: {
    fontFamily: fonts.bold,
    fontSize: fs(18),
    letterSpacing: -0.5,
    color: ink.text,
  },
  body: {
    paddingHorizontal: sz(16),
    paddingTop: sz(4),
  },
  banner: {
    marginTop: sz(12),
    paddingLeft: sz(16),
    paddingRight: sz(8),
    paddingVertical: sz(4),
    borderRadius: sz(16),
    borderWidth: 1,
    borderColor: ink.line,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fs(14.5),
    color: ink.text,
  },
  bannerSub: {
    marginTop: sz(4),
    fontFamily: fonts.regular,
    fontSize: fs(12),
    lineHeight: fs(16),
    color: ink.muted,
  },
  bannerArt: {
    width: sz(112),
    height: sz(74),
  },
  section: {
    marginTop: sz(18),
    marginBottom: sz(8),
    marginLeft: sz(2),
    fontFamily: fonts.semiBold,
    fontSize: fs(13.5),
    color: ink.text,
  },
  card: {
    borderRadius: sz(14),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: ink.line,
    overflow: 'hidden',
  },
  row: {
    minHeight: sz(54),
    paddingHorizontal: sz(14),
    paddingVertical: sz(9),
    flexDirection: 'row',
    alignItems: 'center',
    gap: sz(12),
  },
  pressed: {
    backgroundColor: '#F7F8FA',
  },
  line: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ink.line,
  },
  icon: {
    width: sz(32),
    height: sz(32),
    borderRadius: sz(9),
    backgroundColor: '#FFF6C2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fs(13.5),
    color: ink.text,
  },
  rowSub: {
    marginTop: sz(2),
    fontFamily: fonts.regular,
    fontSize: fs(11.5),
    color: ink.muted,
  },
  bookingArt: {
    width: sz(32),
    height: sz(32),
    borderRadius: sz(9),
    backgroundColor: '#F4F5F7',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  artImg: {
    width: sz(26),
    height: sz(26),
  },
  faq: {
    paddingHorizontal: sz(16),
    paddingVertical: sz(12),
  },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sz(10),
  },
  faqQ: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fs(13),
    lineHeight: fs(18),
    color: ink.text,
  },
  faqA: {
    marginTop: sz(8),
    fontFamily: fonts.regular,
    fontSize: fs(12.5),
    lineHeight: fs(18),
    color: ink.muted,
  },
});
