import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { Image, Pressable, type StyleProp, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import type { Tier } from '../../data/referEarn';
import { fonts } from '../theme';

// Rewards design language: Hoora black + yellow (as on Home), gold Hoora Points coin, warm cream
// surfaces for anything you can win. One yellow action per block, so the next step is obvious.

export const R = {
  night: '#101010', // matches the black of the gold-coin artwork
  nightRaised: '#1A1B1D',
  nightLine: 'rgba(255,255,255,0.10)',
  onNight: '#FFFFFF',
  onNightMuted: 'rgba(255,255,255,0.66)',
  canvas: '#F6F6F3',
  card: '#FFFFFF',
  text: '#15161A',
  muted: '#6B6E76',
  faint: '#A2A5AC',
  line: '#ECECE8',
  yellow: '#FFE300',
  gold: '#F5B800',
  goldDeep: '#8A6400',
  cream: '#FFF8DE',
  creamLine: '#F4E6AE',
  green: '#12A150',
  greenSoft: '#E8F7EE',
  whatsapp: '#1FAF54',
  amber: '#B76E00',
  amberSoft: '#FFF4DF',
} as const;

const COIN = require('../../../assets/rewards/hub/coin.png');

export const fmt = (n: number) => n.toLocaleString('en-IN');

/** The Hoora Points coin. */
export function Coin({ size = 16 }: { size?: number }) {
  return <Image source={COIN} style={{ width: size, height: size * 0.97 }} />;
}

/** Coin + amount, e.g. in prices and balances. */
export function Points({
  value,
  size = 15,
  color = R.text,
  font = fonts.extraBold,
  sign,
}: {
  value: number;
  size?: number;
  color?: string;
  font?: string;
  sign?: '+' | '−';
}) {
  return (
    <View style={styles.points}>
      <Coin size={Math.round(size * 1.05)} />
      <Text style={{ fontFamily: font, fontSize: size, color, letterSpacing: -0.2 }}>
        {sign}
        {fmt(value)}
      </Text>
    </View>
  );
}

type IconName = ComponentProps<typeof Ionicons>['name'];

/** The single yellow action of a block. */
export function YellowButton({
  label,
  onPress,
  icon,
  trailing,
  compact,
  style,
  disabled,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  trailing?: IconName;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.yellow,
        compact && styles.compact,
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {icon && <Ionicons name={icon} size={compact ? 15 : 18} color={R.text} />}
      <Text style={[styles.yellowText, compact && styles.compactText]}>{label}</Text>
      {trailing && <Ionicons name={trailing} size={compact ? 14 : 17} color={R.text} />}
    </Pressable>
  );
}

/** Secondary action: outlined, never competes with the yellow one. */
export function GhostButton({
  label,
  onPress,
  icon,
  compact,
  dark,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  compact?: boolean;
  /** On the black surfaces. */
  dark?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const color = dark ? R.onNight : R.text;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.ghost,
        dark && styles.ghostDark,
        compact && styles.compact,
        pressed && styles.pressed,
        style,
      ]}
    >
      {icon && <Ionicons name={icon} size={compact ? 15 : 17} color={color} />}
      <Text style={[styles.ghostText, compact && styles.compactText, { color }]}>{label}</Text>
    </Pressable>
  );
}

/** Section title with an optional text link on the right. */
export function SectionHead({
  title,
  sub,
  action,
  onAction,
}: {
  title: string;
  sub?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.head}>
      <View style={styles.headText}>
        <Text style={styles.headTitle}>{title}</Text>
        {sub ? <Text style={styles.headSub}>{sub}</Text> : null}
      </View>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={10} accessibilityRole="link" style={styles.headAction}>
          <Text style={styles.headActionText}>{action}</Text>
          <Ionicons name="chevron-forward" size={14} color={R.text} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** Compact segmented control (small pills, not full-width tabs). */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  dark,
  stretch,
}: {
  value: T;
  options: { key: T; label: string }[];
  onChange: (v: T) => void;
  dark?: boolean;
  /** Fill the row width (each option equal). */
  stretch?: boolean;
}) {
  return (
    <View style={[styles.seg, dark && styles.segDark, stretch && styles.segStretch]} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={[styles.segItem, stretch && styles.segItemStretch, on && (dark ? styles.segOnDark : styles.segOn)]}
          >
            <Text style={[styles.segText, dark && styles.segTextDark, on && styles.segTextOn]} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Two (or three) equal tabs with icons; the active one is Hoora yellow (Figma "Products | Vouchers"). */
export function TabSwitch<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { key: T; label: string; icon: IconName }[];
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.tabs} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={[styles.tab, on && styles.tabOn]}
          >
            <Ionicons name={o.icon} size={16} color={on ? R.text : R.muted} />
            <Text style={[styles.tabText, on && styles.tabTextOn]} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Filter chips (single choice). */
export function Chips<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { key: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.chips}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={[styles.chip, on && styles.chipOn]}
          >
            <Text style={[styles.chipText, on && styles.chipTextOn]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ProgressBar({
  value,
  height = 6,
  track = '#ECEBE4',
  fill = R.gold,
}: {
  value: number;
  height?: number;
  track?: string;
  fill?: string;
}) {
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: track, overflow: 'hidden' }}>
      <View
        style={{
          height,
          borderRadius: height / 2,
          backgroundColor: fill,
          width: `${Math.max(0, Math.min(1, value)) * 100}%`,
        }}
      />
    </View>
  );
}

// Neutral initials avatars (bg, text).
const TONES: [string, string][] = [
  ['#FFF1C2', '#7A5A00'],
  ['#E7F0FF', '#2453A6'],
  ['#E9F7EF', '#1D7A46'],
  ['#FDEBEC', '#B4232B'],
  ['#F1ECFF', '#5B3DB5'],
  ['#EAF6F8', '#17707F'],
  ['#FFEEDF', '#A04B07'],
];

export const initials = (name: string) =>
  name
    .replace(/[^A-Za-z ]/g, '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export function Avatar({
  name,
  size = 36,
  index = 0,
  ring,
}: {
  name: string;
  size?: number;
  index?: number;
  ring?: string;
}) {
  const [bg, fg] = TONES[index % TONES.length];
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
        ring ? { borderWidth: Math.max(2, size / 22), borderColor: ring } : null,
      ]}
    >
      <Text style={{ fontFamily: fonts.bold, fontSize: size * 0.36, color: fg }}>{initials(name)}</Text>
    </View>
  );
}

export function TierBadge({ tier, height = 40 }: { tier: Tier; height?: number }) {
  return (
    <Image
      source={tier.badge}
      style={{ height, width: height * tier.badgeRatio }}
      resizeMode="contain"
      accessibilityLabel={`${tier.name} league`}
    />
  );
}

/** Rounded white card used for every block on the light canvas. */
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.45,
  },
  points: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  yellow: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: R.yellow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  yellowText: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
    letterSpacing: -0.2,
    color: R.text,
  },
  compact: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 5,
  },
  compactText: {
    fontSize: 12.5,
  },
  ghost: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCDCD6',
    backgroundColor: R.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  ghostDark: {
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: '#1A1B1D',
  },
  ghostText: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  headText: {
    flex: 1,
    gap: 2,
  },
  headTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
    lineHeight: 23,
    letterSpacing: -0.4,
    color: R.text,
  },
  headSub: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: R.muted,
  },
  headAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    paddingBottom: 2,
  },
  headActionText: {
    fontFamily: fonts.bold,
    fontSize: 12.5,
    color: R.text,
  },
  seg: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    padding: 3,
    borderRadius: 12,
    backgroundColor: '#ECECE7',
  },
  segDark: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  segStretch: {
    alignSelf: 'stretch',
  },
  segItem: {
    minHeight: 32,
    paddingHorizontal: 14,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segItemStretch: {
    flex: 1,
    paddingHorizontal: 6,
  },
  segOn: {
    backgroundColor: R.card,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segOnDark: {
    backgroundColor: R.yellow,
  },
  segText: {
    fontFamily: fonts.semiBold,
    fontSize: 12.5,
    color: R.muted,
  },
  segTextDark: {
    color: R.onNightMuted,
  },
  segTextOn: {
    fontFamily: fonts.bold,
    color: R.text,
  },
  tabs: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
    borderRadius: 14,
    backgroundColor: '#ECECE7',
  },
  tab: {
    flex: 1,
    height: 42,
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  tabOn: {
    backgroundColor: R.yellow,
  },
  tabText: {
    fontFamily: fonts.semiBold,
    fontSize: 13.5,
    color: R.muted,
  },
  tabTextOn: {
    fontFamily: fonts.extraBold,
    color: R.text,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minHeight: 32,
    paddingHorizontal: 13,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E2DC',
    backgroundColor: R.card,
    justifyContent: 'center',
  },
  chipOn: {
    borderColor: R.text,
    backgroundColor: R.text,
  },
  chipText: {
    fontFamily: fonts.semiBold,
    fontSize: 12.5,
    color: '#45474D',
  },
  chipTextOn: {
    color: '#FFFFFF',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 18,
    backgroundColor: R.card,
    borderWidth: 1,
    borderColor: R.line,
    padding: 16,
  },
});
