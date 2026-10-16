import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, useState } from 'react';
import { Animated, Easing, Image, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts, useAnimatedValue } from '../theme';
import { T } from '../tracking/trackTheme';
import { YellowButton } from '../tracking/TrackingSheets';
import { fs, sz } from '../responsive';

// Building blocks shared by the Help & Support screens (Dev File → "Help & Support").

export const HELP = {
  page: '#F8F8F8',
  card: '#FFFFFF',
  line: '#ECEDF0',
  blue: '#1C57B6',
  sub: '#6A7282',
  time: '#99A1AF',
};

/** Ionicons by default; `mci:` names come from MaterialCommunityIcons. */
export function HelpIcon({ name, size = 20, color = T.text }: { name: string; size?: number; color?: string }) {
  if (name.startsWith('mci:')) {
    return (
      <MaterialCommunityIcons
        name={name.slice(4) as keyof typeof MaterialCommunityIcons.glyphMap}
        size={size}
        color={color}
      />
    );
  }
  return <Ionicons name={name as keyof typeof Ionicons.glyphMap} size={size} color={color} />;
}

export type Option = { key: string; label: string; icon?: string };

/** A field that opens its options in place, under it (as in the design), one open at a time. */
export function Select({
  label,
  placeholder,
  value,
  options,
  open,
  onToggle,
  onSelect,
  disabled,
  error,
}: {
  label: string;
  placeholder: string;
  value?: string;
  options: Option[];
  open: boolean;
  onToggle: () => void;
  onSelect: (o: Option) => void;
  disabled?: boolean;
  error?: string;
}) {
  const picked = options.find((o) => o.key === value);
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={onToggle}
        disabled={disabled}
        style={[styles.field, open && styles.fieldOpen, error && styles.fieldError, disabled && { opacity: 0.5 }]}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${picked?.label ?? placeholder}`}
        accessibilityState={{ expanded: open, disabled }}
      >
        {picked?.icon ? <HelpIcon name={picked.icon} size={18} /> : null}
        <Text style={[styles.fieldText, !picked && styles.placeholder]} numberOfLines={1}>
          {picked?.label ?? placeholder}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={T.text} />
      </Pressable>
      {open && (
        <View style={styles.menu}>
          {options.map((o, i) => (
            <Pressable
              key={o.key}
              onPress={() => onSelect(o)}
              style={({ pressed }) => [
                styles.option,
                i > 0 && styles.optionLine,
                pressed && { backgroundColor: '#F6F7F9' },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: o.key === value }}
            >
              {o.icon ? <HelpIcon name={o.icon} size={20} /> : null}
              <Text style={styles.optionText}>{o.label}</Text>
              {o.key === value ? <Ionicons name="checkmark" size={18} color={T.text} /> : null}
            </Pressable>
          ))}
        </View>
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const TICKET_ART = require('../../../assets/help/ticket.png');

/** Bottom sheet asking to close / reopen a ticket, with the ticket illustration from the design. */
export function ConfirmSheet({
  visible,
  title,
  confirm,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  title: string;
  confirm: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const p = useAnimatedValue(0);
  const [shown, setShown] = useState(visible);
  if (visible && !shown) setShown(true);
  useEffect(() => {
    Animated.timing(p, {
      toValue: visible ? 1 : 0,
      duration: visible ? 260 : 180,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !visible) setShown(false);
    });
  }, [visible, p]);
  if (!shown) return null;
  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[styles.scrim, { opacity: p }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
      </Animated.View>
      <View style={styles.anchor} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16) },
            { transform: [{ translateY: p.interpolate({ inputRange: [0, 1], outputRange: [height * 0.5, 0] }) }] },
          ]}
        >
          <Image source={TICKET_ART} style={styles.art} resizeMode="contain" accessibilityIgnoresInvertColors />
          <Text style={styles.sheetTitle}>{title}</Text>
          <View style={styles.sheetRow}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.back, pressed && { backgroundColor: '#F4F5F7' }]}
              accessibilityRole="button"
            >
              <Text style={styles.backText}>Back</Text>
            </Pressable>
            <View style={{ flex: 1 }}>
              <YellowButton label={confirm} onPress={onConfirm} />
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: sz(8),
    fontFamily: fonts.medium,
    fontSize: fs(13),
    color: T.text,
  },
  field: {
    minHeight: sz(44),
    paddingHorizontal: sz(14),
    borderRadius: sz(10),
    borderWidth: 1,
    borderColor: '#E3E5E9',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: sz(10),
  },
  fieldOpen: {
    borderColor: T.text,
  },
  fieldError: {
    borderColor: '#C22F2F',
  },
  fieldText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fs(13.5),
    color: T.text,
  },
  placeholder: {
    fontFamily: fonts.regular,
    color: T.muted,
  },
  menu: {
    marginTop: sz(6),
    borderRadius: sz(10),
    borderWidth: 1,
    borderColor: '#E3E5E9',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  option: {
    minHeight: sz(42),
    paddingHorizontal: sz(14),
    flexDirection: 'row',
    alignItems: 'center',
    gap: sz(12),
  },
  optionLine: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ECEDF0',
  },
  optionText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fs(13.5),
    color: T.text,
  },
  error: {
    marginTop: sz(5),
    fontFamily: fonts.medium,
    fontSize: fs(11.5),
    color: '#C22F2F',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10,10,14,0.45)',
  },
  anchor: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    paddingHorizontal: sz(20),
    paddingTop: sz(24),
    borderTopLeftRadius: sz(20),
    borderTopRightRadius: sz(20),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  art: {
    width: sz(108),
    height: sz(108),
  },
  sheetTitle: {
    marginTop: sz(14),
    maxWidth: sz(240),
    textAlign: 'center',
    fontFamily: fonts.semiBold,
    fontSize: fs(17),
    lineHeight: fs(23),
    color: T.text,
  },
  sheetRow: {
    marginTop: sz(22),
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: sz(10),
    paddingTop: sz(14),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ECEDF0',
  },
  back: {
    flex: 1,
    height: sz(50),
    borderRadius: sz(8),
    borderWidth: 1,
    borderColor: '#D5D7DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontFamily: fonts.semiBold,
    fontSize: fs(15),
    color: T.text,
  },
});
