import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HELP } from '../../components/help/HelpKit';
import { fonts, noBounce } from '../../components/theme';
import { TopBar } from '../../components/TopBar';
import { T } from '../../components/tracking/trackTheme';
import { type Ticket, ticketDate, type TicketStatus, ticketTitle, useTickets } from '../../data/support';
import { fs, sz } from '../../components/responsive';

// My Tickets (Dev File → "My Ticket _Open / _Closed"): Open and Closed tabs, one card per ticket,
// and a yellow + to raise a new one.

const STATUS: Record<TicketStatus, { fg: string; bg: string }> = {
  Open: { fg: '#2F6FD8', bg: '#EAF1FD' },
  Resolved: { fg: '#17784A', bg: '#E5F5EC' },
  Closed: { fg: '#5F636B', bg: '#F1F2F4' },
};

function TicketCard({ t }: { t: Ticket }) {
  const s = STATUS[t.status];
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/help/ticket/[id]', params: { id: t.id } })}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
      accessibilityRole="button"
      accessibilityLabel={`${ticketTitle(t)}, ${t.status}`}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.title} numberOfLines={2}>
          {ticketTitle(t)}
        </Text>
        <Text style={styles.meta}>ID: {t.id}</Text>
        <Text style={styles.meta}>{ticketDate(t.createdAt)}</Text>
      </View>
      <View style={[styles.pill, { backgroundColor: s.bg }]}>
        <Text style={[styles.pillText, { color: s.fg }]}>{t.status}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={T.faint} />
    </Pressable>
  );
}

export default function TicketsScreen() {
  const insets = useSafeAreaInsets();
  const [closed, setClosed] = useState(false);
  const all = useTickets();
  const list = all.filter((t) => (closed ? t.status !== 'Open' : t.status === 'Open'));

  return (
    <View style={styles.screen}>
      <TopBar title="My Tickets" topInset={insets.top} arrow onBack={() => router.back()} />
      <View style={styles.tabs}>
        {[false, true].map((c) => {
          const on = closed === c;
          return (
            <Pressable
              key={String(c)}
              onPress={() => setClosed(c)}
              style={styles.tab}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
            >
              <Text style={[styles.tabText, on && styles.tabTextOn]}>{c ? 'Closed' : 'Open'}</Text>
              <View style={[styles.tabLine, on && styles.tabLineOn]} />
            </Pressable>
          );
        })}
      </View>
      <ScrollView {...noBounce} contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 96 }]}>
        {list.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="chatbox-ellipses-outline" size={30} color={T.faint} />
            <Text style={styles.emptyText}>{closed ? 'No closed tickets' : 'No open tickets'}</Text>
          </View>
        ) : (
          list.map((t) => <TicketCard key={t.id} t={t} />)
        )}
      </ScrollView>
      <Pressable
        onPress={() => router.push('/help/raise')}
        style={({ pressed }) => [
          styles.fab,
          { bottom: insets.bottom + 24 },
          pressed && { transform: [{ scale: 0.96 }] },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Raise a new ticket"
      >
        <LinearGradient colors={T.yellow} style={styles.fabInner}>
          <Ionicons name="add" size={28} color={T.ink} />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: HELP.page,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: sz(16),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: HELP.line,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingTop: sz(10),
  },
  tabText: {
    fontFamily: fonts.medium,
    fontSize: fs(14.5),
    color: HELP.sub,
  },
  tabTextOn: {
    fontFamily: fonts.semiBold,
    color: T.text,
  },
  tabLine: {
    marginTop: sz(10),
    alignSelf: 'stretch',
    height: sz(3),
    borderTopLeftRadius: sz(3),
    borderTopRightRadius: sz(3),
  },
  tabLineOn: {
    backgroundColor: T.yellowSolid,
  },
  body: {
    padding: sz(16),
    gap: sz(12),
  },
  card: {
    padding: sz(16),
    borderRadius: sz(12),
    borderWidth: 1,
    borderColor: HELP.line,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: sz(10),
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: fs(15),
    lineHeight: fs(20),
    color: T.text,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: fs(12.5),
    color: HELP.sub,
  },
  pill: {
    paddingHorizontal: sz(10),
    paddingVertical: sz(3),
    borderRadius: sz(12),
  },
  pillText: {
    fontFamily: fonts.medium,
    fontSize: fs(12),
  },
  empty: {
    paddingTop: sz(60),
    alignItems: 'center',
    gap: sz(10),
  },
  emptyText: {
    fontFamily: fonts.medium,
    fontSize: fs(13.5),
    color: T.muted,
  },
  fab: {
    position: 'absolute',
    right: sz(20),
    borderRadius: sz(30),
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabInner: {
    width: sz(58),
    height: sz(58),
    borderRadius: sz(29),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
