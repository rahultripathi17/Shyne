import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '../../components/Buttons';
import { ink } from '../../components/home/homeTheme';
import { PlateBadge } from '../../components/PlateField';
import { TabScroll } from '../../components/TabScroll';
import { fonts, formatPrice } from '../../components/theme';
import { VehiclePhoto } from '../../components/VehiclePhoto';
import { getService } from '../../data/services';
import { type Booking, useAppStore } from '../../store/AppStore';

type Tab = 'ongoing' | 'upcoming' | 'past';

const TABS: { key: Tab; label: string }[] = [
  { key: 'ongoing', label: 'Ongoing' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
];

const EMPTY: Record<Tab, { title: string; body: string }> = {
  ongoing: { title: 'Nothing in progress', body: 'When our expert is at your vehicle, you’ll track it here.' },
  upcoming: { title: 'No upcoming bookings', body: 'Book a doorstep wash in a few taps.' },
  past: { title: 'No past bookings yet', body: 'Your completed and cancelled services will show up here.' },
};

const todayIso = () => new Date().toISOString().slice(0, 10);

/** Ongoing = confirmed for today, Upcoming = confirmed for a later day, Past = done or cancelled. */
const tabOf = (b: Booking): Tab => {
  if (b.status !== 'Confirmed') return 'past';
  const today = todayIso();
  if (b.date === today) return 'ongoing';
  return b.date > today ? 'upcoming' : 'past';
};

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

const STATUS_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  ongoing: { bg: '#FFF6C2', fg: ink.gold, label: 'Today' },
  upcoming: { bg: '#FFF6C2', fg: ink.gold, label: 'Confirmed' },
  Completed: { bg: '#E7F6EC', fg: '#1E8E4E', label: 'Completed' },
  Cancelled: { bg: '#FDECEC', fg: ink.red, label: 'Cancelled' },
};

function BookingCard({ booking }: { booking: Booking }) {
  const service = getService(booking.serviceId);
  const tab = tabOf(booking);
  const status = STATUS_STYLE[tab === 'past' ? booking.status : tab] ?? STATUS_STYLE.Completed;
  const vehicleName =
    booking.car.type === 'bike' ? 'My Bike' : [booking.car.brandName, booking.car.model].filter(Boolean).join(' ');

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.service}>{service?.name ?? 'Car wash'}</Text>
          <Text style={styles.vehicle} numberOfLines={1}>
            {vehicleName}
          </Text>
          {booking.car.plate ? <PlateBadge plate={booking.car.plate} /> : null}
        </View>
        <View style={styles.cardArt}>
          <VehiclePhoto vehicle={booking.car} width={78} height={48} />
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.metaRow}>
        <Ionicons name="calendar-clear-outline" size={15} color={ink.muted} />
        <Text style={styles.meta}>
          {formatDate(booking.date)} · {booking.slot}
        </Text>
      </View>
      <View style={styles.metaRow}>
        <Ionicons name="location-outline" size={15} color={ink.muted} />
        <Text style={styles.meta} numberOfLines={1}>
          {booking.address}
        </Text>
      </View>

      <View style={styles.cardBottom}>
        <View style={[styles.status, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.fg }]}>{status.label}</Text>
        </View>
        <Text style={styles.price}>{formatPrice(booking.total)}</Text>
      </View>
    </View>
  );
}

export default function BookingsScreen() {
  const { bookings } = useAppStore();
  const [tab, setTab] = useState<Tab>('upcoming');
  const list = bookings.filter((b) => tabOf(b) === tab);
  const count = (t: Tab) => bookings.filter((b) => tabOf(b) === t).length;

  return (
    <TabScroll title="Bookings" subtitle="Track and manage your services">
      <View style={styles.tabs}>
        {TABS.map((t) => {
          const on = tab === t.key;
          const n = count(t.key);
          return (
            <Pressable
              key={t.key}
              onPress={() => {
                void Haptics.selectionAsync();
                setTab(t.key);
              }}
              style={[styles.tab, on && styles.tabOn]}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
            >
              <Text style={[styles.tabText, on && styles.tabTextOn]}>{t.label}</Text>
              {n > 0 && (
                <View style={[styles.count, on && styles.countOn]}>
                  <Text style={[styles.countText, on && styles.countTextOn]}>{n}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {list.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyArt}>
            <Image source={require('../../../assets/home/wash-man.png')} resizeMode="contain" style={styles.emptyMan} />
            <Image source={require('../../../assets/home/wash-car2.png')} resizeMode="contain" style={styles.emptyCar} />
          </View>
          <Text style={styles.emptyTitle}>{EMPTY[tab].title}</Text>
          <Text style={styles.emptyText}>{EMPTY[tab].body}</Text>
          {tab !== 'past' && (
            <PrimaryButton label="Book a car wash" onPress={() => router.push('/wash')} style={styles.emptyButton} />
          )}
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {list.map((b) => (
            <BookingCard key={b.id} booking={b} />
          ))}
        </View>
      )}
    </TabScroll>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: ink.line,
    backgroundColor: '#FFFFFF',
  },
  tabOn: {
    backgroundColor: ink.yellow,
    borderColor: ink.yellow,
  },
  tabText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: ink.muted,
  },
  tabTextOn: {
    color: ink.text,
  },
  count: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: '#F1F2F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countOn: {
    backgroundColor: ink.text,
  },
  countText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: ink.muted,
  },
  countTextOn: {
    color: ink.yellow,
  },
  card: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: ink.line,
    backgroundColor: '#FFFFFF',
  },
  cardTop: {
    flexDirection: 'row',
    gap: 12,
  },
  cardArt: {
    width: 86,
    height: 58,
    borderRadius: 12,
    backgroundColor: '#F4F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  service: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
    color: ink.text,
  },
  vehicle: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: ink.muted,
  },
  divider: {
    height: 1,
    marginVertical: 12,
    backgroundColor: ink.line,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  meta: {
    flexShrink: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: ink.label,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  status: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  price: {
    fontFamily: fonts.extraBold,
    fontSize: 17,
    color: ink.text,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 24,
  },
  emptyArt: {
    width: 230,
    height: 150,
    borderRadius: 28,
    backgroundColor: '#FFF8D1',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingBottom: 14,
  },
  emptyMan: {
    width: 70,
    height: 110,
  },
  emptyCar: {
    width: 130,
    height: 90,
  },
  emptyTitle: {
    marginTop: 20,
    fontFamily: fonts.extraBold,
    fontSize: 19,
    color: ink.text,
  },
  emptyText: {
    marginTop: 6,
    maxWidth: 280,
    textAlign: 'center',
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: ink.muted,
  },
  emptyButton: {
    marginTop: 22,
    alignSelf: 'stretch',
  },
});
