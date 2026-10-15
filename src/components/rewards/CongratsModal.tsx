import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { Animated, Easing, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Prize } from '../../data/referEarn';
import { fonts, useAnimatedValue } from '../theme';
import { R, YellowButton } from './RewardsKit';

const COINS = require('../../../assets/rewards/hub/coins-right.jpg');
const CROWN = require('../../../assets/rewards/hub/crown.png');

const ORD = ['1st', '2nd', '3rd'];

/** Last month's league win (Figma 11534:16781 / 11534:17676), in Hoora black and gold. */
export function CongratsModal({
  visible,
  month,
  rank,
  prize,
  claimed,
  onClaim,
  onClose,
}: {
  visible: boolean;
  month: string;
  rank: number;
  prize: Prize;
  claimed: boolean;
  onClaim: () => void;
  onClose: () => void;
}) {
  const pop = useAnimatedValue(0);
  const float = useAnimatedValue(0);

  useEffect(() => {
    if (!visible) return;
    pop.setValue(0);
    Animated.spring(pop, { toValue: 1, friction: 7, tension: 70, useNativeDriver: true }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [visible, pop, float]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.scrim}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity: pop,
              transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
            },
          ]}
        >
          <Image source={COINS} style={styles.coins} />
          <Pressable
            onPress={onClose}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={styles.close}
          >
            <Ionicons name="close" size={18} color={R.onNight} />
          </Pressable>

          <Image source={CROWN} style={styles.crown} />
          <Text style={styles.rank}>
            {ORD[rank - 1] ?? `#${rank}`} <Text style={styles.rankSmall}>in {month}</Text>
          </Text>
          <Text style={styles.title}>{claimed ? 'Prize on its way!' : 'Congratulations!'}</Text>
          <Text style={styles.text}>
            {claimed
              ? 'We’ll deliver it in 5–7 days and send tracking on WhatsApp.'
              : `You finished in the top 3 of the ${month} league.`}
          </Text>

          <View style={styles.prize}>
            <Animated.Image
              source={prize.image}
              resizeMode="contain"
              style={[
                styles.prizeImage,
                { transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }] },
              ]}
            />
            <View style={styles.prizeText}>
              <Text style={styles.prizeLabel}>YOUR PRIZE</Text>
              <Text style={styles.prizeName}>{prize.name}</Text>
              <Text style={styles.prizeNote}>Free delivery</Text>
            </View>
          </View>

          {claimed ? (
            <View style={styles.claimed}>
              <Ionicons name="checkmark-circle" size={18} color={R.yellow} />
              <Text style={styles.claimedText}>Reward claimed</Text>
            </View>
          ) : (
            <YellowButton label="Claim my reward" icon="gift" onPress={onClaim} style={styles.cta} />
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 20,
    borderRadius: 26,
    backgroundColor: R.night,
    borderWidth: 1,
    borderColor: 'rgba(245,184,0,0.35)',
    overflow: 'hidden',
  },
  coins: {
    position: 'absolute',
    right: -40,
    top: -30,
    width: 180,
    height: 295,
    opacity: 0.55,
  },
  close: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  crown: {
    width: 54,
    height: 42,
  },
  rank: {
    marginTop: 6,
    fontFamily: fonts.extraBoldItalic,
    fontSize: 34,
    color: R.yellow,
  },
  rankSmall: {
    fontFamily: fonts.semiBold,
    fontStyle: 'normal',
    fontSize: 15,
    color: R.onNightMuted,
  },
  title: {
    marginTop: 4,
    fontFamily: fonts.extraBold,
    fontSize: 24,
    letterSpacing: -0.6,
    color: R.onNight,
  },
  text: {
    marginTop: 6,
    textAlign: 'center',
    fontFamily: fonts.medium,
    fontSize: 13.5,
    lineHeight: 20,
    color: R.onNightMuted,
  },
  prize: {
    marginTop: 18,
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    borderRadius: 18,
    backgroundColor: R.cream,
  },
  prizeImage: {
    width: 92,
    height: 84,
  },
  prizeText: {
    flex: 1,
    gap: 2,
  },
  prizeLabel: {
    fontFamily: fonts.extraBold,
    fontSize: 10.5,
    letterSpacing: 1.1,
    color: R.goldDeep,
  },
  prizeName: {
    fontFamily: fonts.extraBold,
    fontSize: 17,
    letterSpacing: -0.3,
    color: R.text,
  },
  prizeNote: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: R.muted,
  },
  cta: {
    marginTop: 18,
    alignSelf: 'stretch',
  },
  claimed: {
    marginTop: 18,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  claimedText: {
    fontFamily: fonts.bold,
    fontSize: 14.5,
    color: R.onNight,
  },
});
