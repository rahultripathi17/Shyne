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
import { SsoButton } from '../../components/SsoButton';
import { useTabBarSpace } from '../../components/tabBarSpace';
import { fonts, noBounce } from '../../components/theme';
import { Toast, useToast } from '../../components/Toast';
import { VehicleSheet } from '../../components/VehicleSheet';
import { signInWith, SSO_LABEL, SSO_PROVIDER, ssoErrorMessage } from '../../lib/sso';
import { useAppStore } from '../../store/AppStore';

// Profile — Swiggy-style account header (yellow for everyone, black for Hoora Black members),
// the Hoora Black card right under it, then quick links and one clean list. Bookings and Rewards
// live in the tab bar, so they are not repeated here.

type IconName = ComponentProps<typeof Ionicons>['name'];

const BLACK = {
  icon: require('../../../assets/profile/black-icon.png'),
  wordmark: require('../../../assets/profile/black-wordmark.png'),
  pattern: require('../../../assets/profile/card-pattern.png'),
};

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

/** "+91 84088 54626" → "+91 - 84088 54626", as Swiggy shows it. */
const displayPhone = (phone: string) => phone.replace(/^\+91\s?/, '+91 - ');

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const bottomSpace = useTabBarSpace();
  const { name, email, phone, blackMember, linked, setProfile, signOut } = useAppStore();
  const [vehiclesOpen, setVehiclesOpen] = useState(false);
  const toast = useToast();
  const soon = (what: string) => toast.show(`${what} — coming soon`);
  const member = !!blackMember;
  const isLinked = !!linked?.[SSO_PROVIDER];

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle(member ? 'light' : 'dark');
    }, [member]),
  );

  const onMenu = (key: string, label: string) => {
    if (key === 'settings') router.push('/account-settings');
    else soon(label);
  };

  const connect = async () => {
    const result = await signInWith(SSO_PROVIDER);
    if (!result.ok) {
      const msg = ssoErrorMessage(result.reason);
      if (msg) toast.show(msg);
      return;
    }
    setProfile({
      linked: { ...linked, [SSO_PROVIDER]: true },
      ...(!name && result.name ? { name: result.name } : {}),
      ...(!email && result.email ? { email: result.email } : {}),
    });
    toast.show(`${SSO_LABEL[SSO_PROVIDER]} account connected`);
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
        <View style={[styles.header, member ? styles.headerBlack : styles.headerYellow, { paddingTop: insets.top + 10 }]}>
          {member && <Image source={BLACK.pattern} resizeMode="cover" style={styles.headerPattern} />}
          <View style={styles.watermark} pointerEvents="none">
            <SvgXml
              xml={markXml(member ? '#FFE300' : '#000000')}
              width={210 * MARK_RATIO}
              height={210}
              opacity={member ? 0.08 : 0.06}
            />
          </View>

          <View style={styles.topRow}>
            <Pressable
              onPress={() => router.push('/edit-profile')}
              style={[styles.iconBtn, member ? styles.pillDark : styles.pillLight]}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
            >
              <Ionicons name="create-outline" size={18} color={fg} />
            </Pressable>
          </View>

          <Pressable onPress={() => router.push('/edit-profile')} style={styles.identity} accessibilityRole="button" accessibilityLabel="Edit profile">
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, { color: fg }]} numberOfLines={1}>
                  {name || 'Add your name'}
                </Text>
                {member && (
                  <View style={styles.memberChip}>
                    <Text style={styles.memberChipText}>BLACK</Text>
                  </View>
                )}
              </View>
              {phone ? <Text style={[styles.contact, { color: fgSoft }]}>{displayPhone(phone)}</Text> : null}
              {email ? (
                <Text style={[styles.contact, { color: fgSoft }]} numberOfLines={1}>
                  {email}
                </Text>
              ) : (
                <Text style={[styles.addLink, { color: fg }]}>Add email & details ›</Text>
              )}
            </View>
          </Pressable>
        </View>

        <View style={styles.body}>
          {/* Hoora Black — like Swiggy One: white card, logo, one line of value, one action */}
          <PressableScale
            onPress={() => soon(member ? 'Hoora Black benefits' : 'Hoora Black')}
            scaleTo={0.98}
            style={styles.black}
            accessibilityLabel={member ? 'Hoora Black benefits' : `Join Hoora Black for ₹${BLACK_PRICE}`}
          >
            <View style={styles.blackTop}>
              <View style={styles.blackLogo}>
                <Image source={BLACK.icon} style={styles.blackIcon} />
                <Image source={BLACK.wordmark} style={styles.blackWordmark} />
              </View>
              {member && (
                <View style={styles.activeChip}>
                  <Text style={styles.activeText}>ACTIVE</Text>
                </View>
              )}
              <View style={{ flex: 1 }} />
              {member ? (
                <Ionicons name="chevron-forward" size={18} color={ink.muted} />
              ) : (
                <View style={styles.joinPill}>
                  <Text style={styles.joinText}>Join ₹{BLACK_PRICE}</Text>
                </View>
              )}
            </View>
            <Text style={styles.blackTitle}>{member ? '₹0 saved so far' : 'Save up to 40% on every service'}</Text>
            <Text style={styles.blackSub}>
              {member ? 'Explore all Hoora Black benefits' : 'One membership for all your car & bike care'}
            </Text>
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

          {/* One-tap sign-in, so a missing OTP never locks anyone out */}
          {!isLinked && (
            <View style={styles.link}>
              <View style={{ flex: 1 }}>
                <Text style={styles.linkTitle}>Sign in without OTP</Text>
                <Text style={styles.linkSub}>Connect {SSO_LABEL[SSO_PROVIDER]} for faster, safer login</Text>
              </View>
              <SsoButton provider={SSO_PROVIDER} verb="Connect" onPress={connect} compact />
            </View>
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
    paddingBottom: 54,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  headerYellow: {
    backgroundColor: ink.yellow,
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  pillLight: {
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  pillDark: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 18,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    flexShrink: 1,
    fontFamily: fonts.extraBold,
    fontSize: 26,
    letterSpacing: -0.6,
  },
  memberChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: ink.yellow,
  },
  memberChipText: {
    fontFamily: fonts.extraBold,
    fontSize: 10,
    letterSpacing: 1,
    color: ink.text,
  },
  contact: {
    marginTop: 3,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  addLink: {
    marginTop: 6,
    fontFamily: fonts.bold,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  body: {
    marginTop: -34,
    paddingHorizontal: 16,
  },
  black: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1DFA2',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  blackTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  blackLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#0D0D0E',
  },
  blackIcon: {
    width: 16,
    height: 16,
  },
  blackWordmark: {
    width: 105,
    height: 10,
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
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: ink.yellow,
    justifyContent: 'center',
  },
  joinText: {
    fontFamily: fonts.extraBold,
    fontSize: 13,
    color: ink.text,
  },
  blackTitle: {
    marginTop: 12,
    fontFamily: fonts.extraBold,
    fontSize: 17,
    color: ink.text,
  },
  blackSub: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 13,
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
