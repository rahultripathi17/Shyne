import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { type ComponentProps, Fragment, useCallback, useEffect, useState } from 'react';
import { Animated, Easing, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, G, Line, LinearGradient as SvgGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

import { ink } from '../../components/home/homeTheme';
import { PressableScale } from '../../components/home/motion';
import { HooraMark } from '../../components/HooraLogo';
import { useTabBarSpace } from '../../components/tabBarSpace';
import { fonts, noBounce, useAnimatedValue } from '../../components/theme';
import { Toast, useToast } from '../../components/Toast';
import { useAppStore } from '../../store/AppStore';

// Profile header, compact membership status, quick links, and account menu.

type IconName = ComponentProps<typeof Ionicons>['name'];

// The "HOORA BLACK" lettering from the Hoora Black design in Figma (the round H is drawn separately).
const BLACK = {
  word: require('../../../assets/profile/hoora-black-word.png'),
  wordDark: require('../../../assets/profile/hoora-black-word-dark.png'),
};
const WORD_RATIO = 497 / 48;

/** Demo membership: a year from today. */
const validTill = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};
const PROFILE_AVATAR = require('../../../assets/profile/rahul-demo.jpg');

const BLACK_PRICE = 499;
const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

// Diamond-quilted stitching, like the seats of a luxury car: thin dashed gold seams in a diamond
// grid, drawn in code so it always fills the header exactly. The seams fade in from the right.
const STEP = 46;
const SEAMS = Array.from({ length: 22 }, (_, i) => -7 * STEP + i * STEP);

function BlackBackdrop() {
  const glow = useAnimatedValue(0);

  // The warm light behind the arcs slowly breathes: a quiet sign the membership is live.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [glow]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 400 280" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <SvgGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#040405" />
            <Stop offset="0.6" stopColor="#0B0A08" />
            <Stop offset="1" stopColor="#16120A" />
          </SvgGradient>
          <SvgGradient id="seam" x1="120" y1="0" x2="400" y2="0" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#E9B949" stopOpacity="0" />
            <Stop offset="0.5" stopColor="#E9B949" stopOpacity="0.35" />
            <Stop offset="1" stopColor="#FFE9A3" stopOpacity="0.75" />
          </SvgGradient>
          <SvgGradient id="puff" x1="120" y1="0" x2="400" y2="0" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#000000" stopOpacity="0" />
            <Stop offset="1" stopColor="#000000" stopOpacity="0.55" />
          </SvgGradient>
        </Defs>
        <Rect x="0" y="0" width="400" height="280" fill="url(#bg)" />
        {/* Each seam: a dark crease with the gold stitch line just beside it, for a padded look. */}
        {SEAMS.map((x) => (
          <G key={x}>
            <Line x1={x} y1={0} x2={x + 280} y2={280} stroke="url(#puff)" strokeWidth={3.2} />
            <Line x1={x + 280} y1={0} x2={x} y2={280} stroke="url(#puff)" strokeWidth={3.2} />
            <Line
              x1={x + 1.6}
              y1={0}
              x2={x + 281.6}
              y2={280}
              stroke="url(#seam)"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
            <Line
              x1={x + 281.6}
              y1={0}
              x2={x + 1.6}
              y2={280}
              stroke="url(#seam)"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
          </G>
        ))}
      </Svg>
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }) }]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 400 280" preserveAspectRatio="xMidYMid slice">
          <Defs>
            <RadialGradient id="warm" cx="320" cy="70" r="200" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#FFC93C" stopOpacity="0.28" />
              <Stop offset="1" stopColor="#FFC93C" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="400" height="280" fill="url(#warm)" />
        </Svg>
      </Animated.View>
      {/* Keeps the name readable on the left. */}
      <LinearGradient
        colors={['rgba(4,4,5,0.8)', 'rgba(4,4,5,0.25)', 'rgba(4,4,5,0)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 0.75, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

/** The green ACTIVE tag: it waves gently like a flag while a light shimmers across it. */
function ActiveFlag() {
  const wave = useAnimatedValue(0);
  const shine = useAnimatedValue(0);

  useEffect(() => {
    const waving = Animated.loop(
      Animated.sequence([
        Animated.timing(wave, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(wave, { toValue: -1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(wave, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shine, {
          toValue: 1,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(900),
        Animated.timing(shine, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    waving.start();
    shimmer.start();
    return () => {
      waving.stop();
      shimmer.stop();
    };
  }, [wave, shine]);

  return (
    <Animated.View
      style={[
        styles.activeChip,
        {
          transform: [
            { perspective: 300 },
            { rotateY: wave.interpolate({ inputRange: [-1, 1], outputRange: ['-14deg', '14deg'] }) },
            { skewY: wave.interpolate({ inputRange: [-1, 1], outputRange: ['-3deg', '3deg'] }) },
          ],
        },
      ]}
    >
      <Text style={styles.activeText}>ACTIVE</Text>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.activeShine,
          {
            transform: [
              { translateX: shine.interpolate({ inputRange: [0, 1], outputRange: [-40, 80] }) },
              { rotate: '20deg' },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.55)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </Animated.View>
  );
}

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
        <View
          style={[styles.header, member ? styles.headerBlack : styles.headerYellow, { paddingTop: insets.top + 18 }]}
        >
          {member ? (
            <>
              <BlackBackdrop />
            </>
          ) : (
            <>
              <LinearGradient
                pointerEvents="none"
                colors={['#FFF4C7', '#FFFAE6', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.glow} pointerEvents="none" />
              <View style={styles.glowSmall} pointerEvents="none" />
            </>
          )}

          <Pressable
            onPress={() => router.push('/edit-profile')}
            style={styles.identity}
            accessibilityRole="button"
            accessibilityLabel="View profile details"
          >
            <View style={[styles.avatar, member ? styles.avatarDark : styles.avatarLight]}>
              {photoUri && photoUri !== failedPhotoUri ? (
                <Image
                  source={{ uri: photoUri }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                  onError={() => setFailedPhotoUri(photoUri)}
                />
              ) : (
                <Image source={PROFILE_AVATAR} style={styles.avatarImage} resizeMode="cover" />
              )}
            </View>
            <View style={styles.identityCopy}>
              <Text style={[styles.name, { color: fg }]}>{name || 'Rahul Tripathi'}</Text>
              {phone ? <Text style={[styles.contact, { color: fgSoft }]}>{displayPhone(phone)}</Text> : null}
              {hasLinkedEmail && (
                <Text style={[styles.email, { color: fgSoft }]}>{email?.replace('@', '@\u200B')}</Text>
              )}
            </View>
          </Pressable>
          <Pressable
            onPress={() => router.push('/edit-profile')}
            style={[
              styles.editAction,
              member ? styles.editActionDark : styles.editActionLight,
              { top: insets.top + 18 },
            ]}
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
            style={[styles.black, member && styles.blackOn]}
            accessibilityLabel={member ? 'Hoora Black benefits' : `Join Hoora Black for ₹${BLACK_PRICE}`}
          >
            <View style={styles.blackRow}>
              <HooraMark size={40} />
              <View style={styles.blackCopy}>
                <Image
                  source={member ? BLACK.word : BLACK.wordDark}
                  resizeMode="contain"
                  style={{ width: 15 * WORD_RATIO, height: 15 }}
                  accessibilityLabel="Hoora Black"
                />
                <Text style={[styles.blackSub, member && styles.blackSubOn]} numberOfLines={1}>
                  {member ? `Valid till ${validTill()}` : 'Save up to 40% on services'}
                </Text>
              </View>
              {member ? (
                <View style={styles.blackEnd}>
                  <ActiveFlag />
                  <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
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
                  if (q.key === 'vehicles') router.push('/vehicles');
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
            <Pressable
              onPress={() => router.push('/edit-profile')}
              style={styles.link}
              accessibilityRole="button"
              accessibilityLabel="Connect an account"
            >
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
            <Pressable
              onPress={() => soon('Rating')}
              style={({ pressed }) => [styles.rateBtn, pressed && { opacity: 0.85 }]}
              accessibilityRole="button"
            >
              <Text style={styles.rateBtnText}>Rate now</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={signOut}
            style={({ pressed }) => [styles.logout, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
          >
            <Ionicons name="log-out-outline" size={18} color={ink.red} />
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>

          <Text style={styles.version}>Hoora · Version {APP_VERSION}</Text>
        </View>
      </ScrollView>

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
    backgroundColor: '#FFF8DC',
  },
  headerBlack: {
    backgroundColor: '#0D0D0E',
  },
  // Soft yellow light behind a guest's header.
  glow: {
    position: 'absolute',
    right: -90,
    top: -70,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255,214,10,0.22)',
  },
  glowSmall: {
    position: 'absolute',
    right: 40,
    bottom: -60,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,227,0,0.14)',
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
    paddingHorizontal: 14,
    paddingVertical: 14,
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
  // A member's card is black with a thin gold edge, like the old app.
  blackOn: {
    backgroundColor: '#141416',
    borderColor: 'rgba(255,214,10,0.45)',
  },
  blackEnd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  blackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  blackCopy: {
    flex: 1,
    minWidth: 0,
  },
  activeChip: {
    height: 26,
    paddingHorizontal: 11,
    borderRadius: 7,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  activeShine: {
    position: 'absolute',
    top: -10,
    bottom: -10,
    width: 18,
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
    backgroundColor: ink.text,
    justifyContent: 'center',
  },
  joinText: {
    fontFamily: fonts.extraBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  blackSub: {
    marginTop: 6,
    fontFamily: fonts.semiBold,
    fontSize: 12.5,
    lineHeight: 16,
    color: ink.muted,
  },
  blackSubOn: {
    color: 'rgba(255,255,255,0.72)',
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
