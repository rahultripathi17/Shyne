import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DockCard, restoreDismissed, useDismissedCount } from '../components/BookingDock';
import { ink } from '../components/home/homeTheme';
import { fonts, noBounce } from '../components/theme';
import { Toast, useToast } from '../components/Toast';
import { TopBar } from '../components/TopBar';
import { DOCK_STATES } from '../data/bookingDock';
import { useAppStore } from '../store/AppStore';

type IconName = ComponentProps<typeof Ionicons>['name'];

const TRACK = { false: '#D9DBE1', true: ink.text };

/**
 * Configuration — preview-build switches (Profile → Edit profile → Configuration): the Hoora Black
 * member preview and the booking dock above the nav, with every dock card shown in order and
 * switchable one by one.
 */
export default function ConfigurationScreen() {
  const insets = useSafeAreaInsets();
  const { blackMember, setProfile, dockPreview, setDockPreview } = useAppStore();
  const toast = useToast();
  const closed = useDismissedCount();

  const dockOn = !dockPreview?.off;
  const hidden = new Set(dockPreview?.hidden ?? []);
  const onCount = DOCK_STATES.filter((s) => !hidden.has(s.key)).length;

  const toggleState = (key: string, on: boolean) => {
    void Haptics.selectionAsync();
    const next = new Set(hidden);
    if (on) next.delete(key);
    else next.add(key);
    setDockPreview({ hidden: [...next] });
  };

  return (
    <View style={styles.screen}>
      <TopBar title="Configuration" topInset={insets.top} onBack={() => router.back()} />
      <ScrollView {...noBounce} contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 32 }]}>
        <Text style={styles.intro}>Preview build — switch demo features on and off. Changes apply right away.</Text>

        <Text style={styles.section}>Hoora Black</Text>
        <View style={styles.card}>
          <SwitchRow
            icon="diamond-outline"
            title="Hoora Black member"
            sub="Show the member profile and card"
            value={!!blackMember}
            onChange={(v) => setProfile({ blackMember: v })}
          />
        </View>

        <Text style={styles.section}>Booking dock</Text>
        <View style={styles.card}>
          <SwitchRow
            icon="albums-outline"
            title="Show booking dock"
            sub="The strip above the nav on Home, Rewards and Profile"
            value={dockOn}
            onChange={(v) => setDockPreview({ off: !v })}
          />
          {closed > 0 && (
            <>
              <View style={styles.rule} />
              <Pressable
                onPress={() => {
                  restoreDismissed();
                  toast.show('Closed cards are back');
                }}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                accessibilityRole="button"
              >
                <Ionicons name="refresh" size={20} color={ink.text} />
                <Text style={styles.rowTitle}>
                  Show closed cards again <Text style={styles.count}>({closed})</Text>
                </Text>
              </Pressable>
            </>
          )}
        </View>

        <View style={styles.listHead}>
          <Text style={[styles.section, styles.sectionInline]}>Dock cards · in order</Text>
          <Text style={styles.listCount}>
            {onCount} of {DOCK_STATES.length} on
          </Text>
        </View>
        <View style={[styles.states, !dockOn && styles.dim]} pointerEvents={dockOn ? 'auto' : 'none'}>
          {DOCK_STATES.map((s, i) => {
            const on = !hidden.has(s.key);
            return (
              <View key={s.key} style={[styles.stateCard, i > 0 && styles.stateGap]}>
                <View style={styles.stateHead}>
                  <View style={styles.step}>
                    <Text style={styles.stepText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stateLabel} numberOfLines={1}>
                    {s.label}
                  </Text>
                  <Switch
                    value={on}
                    onValueChange={(v) => toggleState(s.key, v)}
                    trackColor={TRACK}
                    thumbColor="#FFFFFF"
                    accessibilityLabel={`${s.label} card`}
                  />
                </View>
                {/* Live preview of the card exactly as the dock draws it */}
                <View style={!on && styles.off} pointerEvents="none">
                  <DockCard item={s.item} />
                </View>
              </View>
            );
          })}
        </View>
        {!dockOn && <Text style={styles.note}>Turn on “Show booking dock” to choose cards.</Text>}
      </ScrollView>
      <Toast toast={toast} bottom={insets.bottom + 24} />
    </View>
  );
}

function SwitchRow({
  icon,
  title,
  sub,
  value,
  onChange,
}: {
  icon: IconName;
  title: string;
  sub: string;
  value: boolean;
  onChange: (v: boolean) => void;
}): ReactNode {
  return (
    <View style={styles.switchRow}>
      <Ionicons name={icon} size={20} color={ink.text} />
      <View style={styles.switchCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={(v) => {
          void Haptics.selectionAsync();
          onChange(v);
        }}
        trackColor={TRACK}
        thumbColor="#FFFFFF"
        accessibilityLabel={title}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },
  body: {
    paddingHorizontal: 16,
  },
  intro: {
    marginTop: 4,
    marginHorizontal: 4,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: ink.muted,
  },
  section: {
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
    fontFamily: fonts.bold,
    fontSize: 13,
    color: ink.muted,
  },
  sectionInline: {
    marginTop: 0,
    marginBottom: 0,
  },
  card: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: ink.line,
    overflow: 'hidden',
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 50,
    backgroundColor: '#E2E3E8',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  switchCopy: {
    flex: 1,
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    height: 54,
    paddingHorizontal: 16,
  },
  rowPressed: {
    backgroundColor: '#FAFAFB',
  },
  rowTitle: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: ink.text,
  },
  rowSub: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    lineHeight: 17,
    color: ink.muted,
  },
  count: {
    color: ink.muted,
  },
  listHead: {
    marginTop: 20,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listCount: {
    marginRight: 4,
    fontFamily: fonts.semiBold,
    fontSize: 12.5,
    color: ink.faint,
  },
  states: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: ink.line,
    padding: 10,
  },
  dim: {
    opacity: 0.45,
  },
  stateCard: {
    gap: 8,
  },
  stateGap: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E3E8',
  },
  stateHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
  },
  step: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F3F5',
  },
  stepText: {
    fontFamily: fonts.bold,
    fontSize: 11.5,
    color: ink.text,
  },
  stateLabel: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: ink.text,
  },
  off: {
    opacity: 0.35,
  },
  note: {
    marginTop: 10,
    marginHorizontal: 4,
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: ink.muted,
  },
});
