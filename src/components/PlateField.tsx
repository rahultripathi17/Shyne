import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Stop } from 'react-native-svg';

import { ink } from './home/homeTheme';
import { fonts } from './theme';

/**
 * Spaces a registration number the way it is printed: "KA 01 MX 2024", or "22 BH 1234 AA" for
 * Bharat-series plates. Anything else is kept as typed (letters and digits only).
 */
export const formatPlate = (v: string) => {
  const raw = v
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 11);
  const parts =
    raw.match(/^([A-Z]{1,2})(\d{0,2})([A-Z]{0,3})(\d{0,4})$/) ?? raw.match(/^(\d{1,2})(BH|B)?(\d{0,4})([A-Z]{0,2})$/);
  return parts ? parts.slice(1).filter(Boolean).join(' ') : raw;
};

/** Indian registration numbers have at least 6 letters/digits (e.g. MH20AB1234 has 10). */
export const isPlateComplete = (v: string) => v.replace(/\s/g, '').length >= 6;

const HSRP_BLUE = '#1A4DB3';
const SPOKES = Array.from({ length: 24 }, (_, i) => (i * Math.PI) / 12);

/** The chromium Ashoka Chakra hologram hot-stamped top-left on every Indian HSRP. */
function ChakraHologram({ size = 20 }: { size?: number }) {
  const c = size / 2;
  const r = c - 1.6;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <LinearGradient id="chrome" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#EEF3FC" />
          <Stop offset="0.45" stopColor="#B8C8EA" />
          <Stop offset="0.6" stopColor="#E4ECFA" />
          <Stop offset="1" stopColor="#9DB3E2" />
        </LinearGradient>
      </Defs>
      <Circle cx={c} cy={c} r={c - 0.3} fill="url(#chrome)" stroke="#8FA6D6" strokeWidth={0.6} />
      <Circle cx={c} cy={c} r={r} fill="none" stroke={HSRP_BLUE} strokeWidth={1.1} />
      {SPOKES.map((a) => (
        <Line
          key={a}
          x1={c}
          y1={c}
          x2={c + Math.cos(a) * r}
          y2={c + Math.sin(a) * r}
          stroke={HSRP_BLUE}
          strokeWidth={0.5}
        />
      ))}
      <Circle cx={c} cy={c} r={1.6} fill={HSRP_BLUE} />
    </Svg>
  );
}

type Props = {
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
  onSubmit?: () => void;
};

/**
 * Looks like India's High Security Registration Plate: white plate with an embossed black rim,
 * the chromium Ashoka Chakra hologram top-left with "IND" in blue right below it.
 */
export function PlateField({ value, onChange, autoFocus, onSubmit }: Props) {
  return (
    <View style={styles.plate}>
      <View style={styles.inner}>
        <View style={styles.side}>
          <ChakraHologram />
          <Text style={styles.ind}>IND</Text>
        </View>
        <TextInput
          value={value}
          onChangeText={(v) => onChange(formatPlate(v))}
          placeholder="MH 20 AB 1234"
          placeholderTextColor="#C3C5CC"
          autoCapitalize="characters"
          autoCorrect={false}
          autoFocus={autoFocus}
          returnKeyType="done"
          onSubmitEditing={onSubmit}
          style={styles.input}
          accessibilityLabel="Vehicle number"
        />
      </View>
    </View>
  );
}

/** A saved number shown large and read-only, with the same HSRP look as the input. */
export function PlateDisplay({ plate }: { plate: string }) {
  return (
    <View style={[styles.plate, styles.displayPlate]}>
      <View style={styles.inner}>
        <View style={styles.side}>
          <ChakraHologram size={16} />
          <Text style={styles.ind}>IND</Text>
        </View>
        <Text style={styles.displayText} numberOfLines={1} adjustsFontSizeToFit>
          {formatPlate(plate)}
        </Text>
      </View>
    </View>
  );
}

/** A saved number shown small, as a clean stamped plate (no emblem at this size). */
export function PlateBadge({ plate }: { plate: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{formatPlate(plate)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Outer pressed-metal rim and a thin embossed inner border.
  plate: {
    height: 66,
    padding: 4,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#15161A',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1.2,
    borderColor: '#2B2D33',
    overflow: 'hidden',
  },
  // The emblem strip is its own panel, cut off from the number by a pressed line.
  side: {
    width: 38,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderRightWidth: 1.2,
    borderRightColor: '#2B2D33',
    backgroundColor: '#F4F7FD',
  },
  ind: {
    fontFamily: fonts.extraBold,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.6,
    color: HSRP_BLUE,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 8,
    fontFamily: fonts.extraBold,
    fontSize: 20,
    letterSpacing: 2.2,
    color: ink.text,
    textAlign: 'center',
    // Browsers draw a focus ring on inputs; the plate's own rim is the focus cue.
    ...Platform.select({ web: { outlineStyle: 'none' } as object }),
  },
  displayPlate: {
    height: 52,
    padding: 3,
    borderRadius: 9,
  },
  displayText: {
    flex: 1,
    paddingHorizontal: 8,
    fontFamily: fonts.extraBold,
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: 1.6,
    color: ink.text,
    textAlign: 'center',
    includeFontPadding: false,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: ink.text,
    backgroundColor: '#FFFFFF',
  },
  badgeText: {
    fontFamily: fonts.extraBold,
    fontSize: 11,
    letterSpacing: 1,
    color: ink.text,
  },
});
