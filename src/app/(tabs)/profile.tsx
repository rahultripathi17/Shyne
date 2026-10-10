import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { type ComponentProps, Fragment, useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import { ink } from '../../components/home/homeTheme';
import { PressableScale } from '../../components/home/motion';
import { HOORA_LOGO_XML } from '../../components/hooraLogoXml';
import { useTabBarSpace } from '../../components/tabBarSpace';
import { fonts, noBounce } from '../../components/theme';
import { Toast, useToast } from '../../components/Toast';
import { VehicleSheet } from '../../components/VehicleSheet';
import { useAppStore } from '../../store/AppStore';

// Profile header, compact membership status, quick links, and account menu.

type IconName = ComponentProps<typeof Ionicons>['name'];

const BLACK = {
  pattern: require('../../../assets/profile/card-pattern.png'),
};
const PROFILE_AVATAR = require('../../../assets/profile/rahul-demo.jpg');

const BLACK_PRICE = 499;
const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

// The Hoora "H" logo drawn as a faint watermark in the header.
const markXml = (color: string) => HOORA_LOGO_XML.replace(/#FFE300/g, color);
const MARK_RATIO = 135.571 / 40.9373;

const MENU: { key: string; label: string; icon: IconName }[] = [
  { key: 'packs', label: 'Subscriptions & Packs', icon: 'repeat-outline' },
  { key: 'gift', label: 'Gift Cards', icon: 'gift-outline' },
  { key: 'feedback', label: 'Share Feedback', icon: 'chatbox-ellipses-outline' },
  { key: 'settings', label: 'Account Settings', icon: 'settings-outline' },
];

/** "+91 86687 15479" → "+91 - 86687 15479", as Swiggy shows it. */
const displayPhone = (phone: string) => phone.replace(/^\+91\s?/, '+91 - ');
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const bottomSpace = useTabBarSpace();
  const { name, email, phone, photoUri, blackMember, linked, signOut } = useAppStore();
  const [vehiclesOpen, setVehiclesOpen] = useState(false);
  const [failedPhotoUri, setFailedPhotoUri] = useState<string>();
  const toast = useToast();
  const soon = (what: string) => toast.show(`${what} — coming soon`);
  const member = !!blackMember;
  const isLinked = !!linked?.apple || !!linked?.google;
  const hasLinkedEmail = isLinked && !!email?.trim();

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle(member ? 'light' : 'dark');
    }, [member]),
  );

  const onMenu = (key: string, label: string) => {
    if (key === 'settings') router.push('/account-settings');
    else soon(label);
  };

  const fg = member ? '#FFFFFF' : ink.text;
  const fgSoft = member ? 'rgba(255,255,255,0.72)' : 'rgba(21,22,26,0.68)';

  return (
    <View style={styles.screen}>
      <ScrollView
        {...noBounce}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomSpace }}
      >
        {/* Header */}
        <View style={[styles.header, member ? styles.headerBlack : styles.headerYellow, { paddingTop: insets.top + 18 }]}>
          {member && <Image source={BLACK.pattern} resizeMode="cover" style={styles.headerPattern} />}
          {member && (
            <View style={styles.watermark} pointerEvents="none">
              <SvgXml xml={markXml('#FFE300')} width={210 * MARK_RATIO} height={210} opacity={0.08} />
            </View>
          )}

          <Pressable
            onPress={() => router.push('/edit-profile')}
            style={styles.identity}
            accessibilityRole="button"
            accessibilityLabel="View profile details"
          >
            <View style={[styles.avatar, member ? styles.avatarDark : styles.avatarLight]}>
              {photoUri && photoUri !== failedPhotoUri ? (
                <Image source={{ uri: photoUri }} style={styles.avatarImage} resizeMode="cover" onError={() => setFailedPhotoUri(photoUri)} />
              ) : (
                <Image source={PROFILE_AVATAR} style={styles.avatarImage} resizeMode="cover" />
              )}
            </View>
            <View style={styles.identityCopy}>
              <Text style={[styles.name, { color: fg }]}>
                {name || 'Rahul Tripathi'}
              </Text>
              {phone ? <Text style={[styles.contact, { color: fgSoft }]}>{displayPhone(phone)}</Text> : null}
              {hasLinkedEmail && <Text style={[styles.email, { color: fgSoft }]}>{email?.replace('@', '@\u200B')}</Text>}
            </View>
          </Pressable>
          <Pressable
            onPress={() => router.push('/edit-profile')}
            style={[styles.editAction, member ? styles.editActionDark : styles.editActionLight, { top: insets.top + 18 }]}
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
          >
            <Ionicons name="create-outline" size={17} color={fg} />
          </Pressable>
        </View>

        <View style={styles.body}>
          {/* Compact membership entry point for guests and active members. */}
          <PressableScale
            onPress={() => soon(member ? 'Hoora Black benefits' : 'Hoora Black')}
            scaleTo={0.98}
            style={styles.black}
            accessibilityLabel={member ? 'Hoora Black benefits' : `Join Hoora Black for ₹${BLACK_PRICE}`}
          >
            <View style={styles.blackRow}>
              <View style={styles.blackIcon}>
                <SvgXml xml={HOORA_LOGO_XML} width={30 * MARK_RATIO} height={30} />
              </View>
              <View style={styles.blackCopy}>
                <Text style={styles.blackTitle} numberOfLines={1}>Hoora Black</Text>
                <Text style={styles.blackSub} numberOfLines={1}>
                  {member ? 'Explore your benefits' : 'Save up to 40% on services'}
                </Text>
              </View>
              {member ? (
                <View style={styles.activeChip}>
                  <Text style={styles.activeText}>ACTIVE</Text>
                </View>
              ) : (
                <View style={styles.joinPill}>
                  <Text style={styles.joinText}>Join ₹{BLACK_PRICE}</Text>
                </View>
              )}
            </View>
          </PressableScale>

          {/* Quick links */}
          <View style={styles.quickRow}>
            {[
              { key: 'vehicles', label: 'My\nVehicles', icon: 'car-sport-outline' as IconName },
              { key: 'address', label: 'Saved\nAddress', icon: 'location-outline' as IconName },
              { key: 'points', label: 'Hoora\nPoints', icon: 'wallet-outline' as IconName },
              { key: 'help', label: 'Help &\nSupport', icon: 'headset-outline' as IconName },
            ].map((q) => (
              <PressableScale
                key={q.key}
                onPress={() => {
                  if (q.key === 'vehicles') setVehiclesOpen(true);
                  else if (q.key === 'points') router.navigate('/rewards');
                  else soon(q.label.replace('\n', ' '));
                }}
                scaleTo={0.96}
                containerStyle={{ flex: 1 }}
                style={styles.quick}
                accessibilityLabel={q.label.replace('\n', ' ')}
              >
                <View style={styles.quickIcon}>
                  <Ionicons name={q.icon} size={20} color={ink.text} />
                </View>
                <Text style={styles.quickLabel}>{q.label}</Text>
              </PressableScale>
            ))}
          </View>

          {!isLinked && (
            <Pressable onPress={() => router.push('/edit-profile')} style={styles.link} accessibilityRole="button" accessibilityLabel="Connect an account">
              <View style={styles.linkIcon}>
                <Ionicons name="shield-checkmark-outline" size={20} color={ink.text} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.linkTitle}>Connect your account</Text>
                <Text style={styles.linkSub}>Choose a sign-in method</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={ink.faint} />
            </Pressable>
          )}

          {/* Menu */}
          <View style={styles.menu}>
            {MENU.map((m, i) => (
              <Fragment key={m.key}>
                {i > 0 && <View style={styles.rule} />}
                <Pressable
                  onPress={() => onMenu(m.key, m.label)}
                  style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: '#FAFAFB' }]}
                  accessibilityRole="button"
                >
                  <Ionicons name={m.icon} size={21} color={ink.text} />
                  <Text style={styles.menuLabel}>{m.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={ink.faint} />
                </Pressable>
              </Fragment>
            ))}
          </View>

          {/* Rate & earn */}
          <View style={styles.rate}>
            <Image source={require('../../../assets/profile/rate-phone.png')} style={styles.rateImg} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.rateTitle}>Rate us & earn 50 Hoora Points</Text>
              <Text style={styles.rateSub}>Tell others what you think of Hoora</Text>
            </View>
            <Pressable onPress={() => soon('Rating')} style={({ pressed }) => [styles.rateBtn, pressed && { opacity: 0.85 }]} accessibilityRole="button">
              <Text style={styles.rateBtnText}>Rate now</Text>
            </Pressable>
          </View>

          <Pressable onPress={signOut} style={({ pressed }) => [styles.logout, pressed && { opacity: 0.7 }]} accessibilityRole="button">
            <Ionicons name="log-out-outline" size={18} color={ink.red} />
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>

          <Text style={styles.version}>Hoora · Version {APP_VERSION}</Text>
        </View>
      </ScrollView>

      <VehicleSheet visible={vehiclesOpen} onClose={() => setVehiclesOpen(false)} />
      <Toast toast={toast} bottom={bottomSpace} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },
  header: {
    paddingHorizontal: 18,
    paddingBottom: 50,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  headerYellow: {
    backgroundColor: '#F4F6F8',
  },
  headerBlack: {
    backgroundColor: '#0D0D0E',
  },
  headerPattern: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 220,
    opacity: 0.9,
  },
  watermark: {
    position: 'absolute',
    right: -70,
    bottom: -60,
    width: 210,
    height: 210,
    overflow: 'hidden',
  },
  identity: {
    marginTop: 10,
    minHeight: 120,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingRight: 50,
  },
  identityCopy: {
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    overflow: 'hidden',
  },
  avatarLight: {
    backgroundColor: '#E9EDF1',
    borderColor: '#FFFFFF',
  },
  avatarDark: {
    backgroundColor: '#303238',
    borderColor: 'rgba(255,255,255,0.68)',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 33,
  },
  name: {
    flexShrink: 1,
    fontFamily: fonts.extraBold,
    fontSize: 22,
    lineHeight: 27,
    letterSpacing: -0.6,
  },
  contact: {
    marginTop: 3,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  email: {
    marginTop: 3,
    fontFamily: fonts.medium,
    fontSize: 12.5,
    lineHeight: 18,
  },
  editAction: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  editActionLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DDE2E8',
  },
  editActionDark: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.18)',
  },
  body: {
    marginTop: -34,
    paddingHorizontal: 16,
  },
  black: {
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1DFA2',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  blackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  blackIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    overflow: 'hidden',
  },
  blackCopy: {
    flex: 1,
    minWidth: 0,
  },
  activeChip: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#1E8E4E',
  },
  activeText: {
    fontFamily: fonts.extraBold,
    fontSize: 10,
    letterSpacing: 0.6,
    color: '#FFFFFF',
  },
  joinPill: {
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 15,
    backgroundColor: ink.yellow,
    justifyContent: 'center',
  },
  joinText: {
    fontFamily: fonts.extraBold,
    fontSize: 11,
    color: ink.text,
  },
  blackTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: ink.text,
  },
  blackSub: {
    marginTop: 1,
    fontFamily: fonts.medium,
    fontSize: 11,
    color: ink.muted,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  quick: {
    height: 96,
    paddingHorizontal: 6,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: ink.line,
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF6C2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    textAlign: 'center',
    fontFamily: fonts.semiBold,
    fontSize: 12,
    lineHeight: 15,
    color: ink.text,
  },
  link: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: ink.line,
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFF6C2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: ink.text,
  },
  linkSub: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: ink.muted,
  },
  menu: {
    marginTop: 14,
    borderRadius: 18,
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
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    height: 56,
    paddingHorizontal: 16,
  },
  menuLabel: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: ink.text,
  },
  rate: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: ink.line,
  },
  rateImg: {
    width: 37,
    height: 46,
  },
  rateTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: ink.text,
  },
  rateSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: ink.muted,
  },
  rateBtn: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 9,
    backgroundColor: ink.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: ink.text,
  },
  logout: {
    marginTop: 18,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3D0D0',
  },
  logoutText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: ink.red,
  },
  version: {
    marginTop: 14,
    textAlign: 'center',
    fontFamily: fonts.medium,
    fontSize: 11,
    color: ink.faint,
  },
});
