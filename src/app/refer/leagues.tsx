import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ClaimForm } from '../../components/rewards/ClaimForm';
import { ProgressBar, R, TierBadge } from '../../components/rewards/RewardsKit';
import { fonts, noBounce } from '../../components/theme';
import { Toast, useToast } from '../../components/Toast';
import { ME, MY_TIER, type Tier, tierRange, TIERS } from '../../data/referEarn';
import { claimTier, useRewardsState } from '../../data/referEarnStore';

// All leagues: each one's referral range, points per referral and free reward, and where you are
// (Figma "Journey").

type Step = 'claimed' | 'claimable' | 'current' | 'locked';

function stepOf(t: Tier, claimed: string[]): Step {
  if (claimed.includes(t.id)) return 'claimed';
  const complete = t.to === null ? ME.successful >= t.from : ME.successful >= t.to;
  if (complete) return 'claimable';
  if (ME.successful >= t.from) return 'current';
  return 'locked';
}

export default function LeaguesScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { claimedTiers } = useRewardsState();
  const [claiming, setClaiming] = useState<Tier | null>(null);

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('dark');
    }, []),
  );

  const back = () => (router.canGoBack() ? router.back() : router.replace('/rewards'));

  return (
    <View style={styles.screen}>
      <View style={[styles.bar, { paddingTop: insets.top + 4 }]}>
        <Pressable onPress={back} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back" style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={R.text} />
        </Pressable>
        <Text style={styles.title}>All leagues</Text>
      </View>

      <ScrollView
        {...noBounce}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}
      >
        {TIERS.map((t) => {
          const step = stepOf(t, claimedTiers);
          const current = step === 'current';
          return (
            <View key={t.id} style={[styles.league, current && styles.leagueCurrent]}>
              <View style={styles.top}>
                <View style={step === 'locked' ? styles.dim : null}>
                  <TierBadge tier={t} height={44} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.name}>{t.name}</Text>
                  <Text style={styles.meta}>
                    {tierRange(t)} referrals, {t.pointsPerReferral} pts each
                  </Text>
                </View>
                {step === 'claimed' && (
                  <View style={styles.claimed}>
                    <Ionicons name="checkmark-circle" size={14} color={R.green} />
                    <Text style={styles.claimedText}>Claimed</Text>
                  </View>
                )}
                {step === 'claimable' && (
                  <Pressable
                    onPress={() => setClaiming(t)}
                    accessibilityRole="button"
                    accessibilityLabel={`Claim ${t.reward}`}
                    style={({ pressed }) => [styles.claimBtn, pressed && { opacity: 0.8 }]}
                  >
                    <Text style={styles.claimBtnText}>Claim</Text>
                  </Pressable>
                )}
                {current && (
                  <View style={styles.here}>
                    <Text style={styles.hereText}>You’re here</Text>
                  </View>
                )}
                {step === 'locked' && <Ionicons name="lock-closed" size={16} color={R.faint} />}
              </View>
              <View style={styles.reward}>
                <Ionicons name="gift-outline" size={15} color={step === 'locked' ? R.faint : R.text} />
                <Text style={[styles.rewardText, step === 'locked' && { color: R.muted }]}>{t.reward}</Text>
              </View>
              {current && (
                <View style={styles.progress}>
                  <View style={styles.flex}>
                    <ProgressBar value={ME.successful / MY_TIER.goal} height={6} track="#EEEDE8" />
                  </View>
                  <Text style={styles.progressText}>
                    {ME.successful}/{MY_TIER.goal}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <ClaimForm
        visible={claiming !== null}
        prize={claiming?.reward.replace('FREE ', '') ?? ''}
        onClose={() => setClaiming(null)}
        onSubmit={() => {
          if (claiming) claimTier(claiming.id);
          setClaiming(null);
          toast.show('Reward claimed. We’ll be in touch to schedule it');
        }}
      />
      <Toast toast={toast} bottom={insets.bottom + 24} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: R.canvas,
  },
  flex: {
    flex: 1,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingBottom: 6,
  },
  back: {
    width: 40,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
    letterSpacing: -0.3,
    color: R.text,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  league: {
    padding: 14,
    gap: 12,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: R.card,
  },
  leagueCurrent: {
    borderColor: R.gold,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dim: {
    opacity: 0.4,
  },
  name: {
    fontFamily: fonts.extraBold,
    fontSize: 15.5,
    color: R.text,
  },
  meta: {
    marginTop: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: R.muted,
  },
  claimed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: R.greenSoft,
  },
  claimedText: {
    fontFamily: fonts.bold,
    fontSize: 11.5,
    color: R.green,
  },
  claimBtn: {
    height: 32,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: R.yellow,
    justifyContent: 'center',
  },
  claimBtnText: {
    fontFamily: fonts.extraBold,
    fontSize: 12.5,
    color: R.text,
  },
  here: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: R.night,
  },
  hereText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: R.yellow,
  },
  reward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F6F5F1',
  },
  rewardText: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: R.text,
  },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressText: {
    fontFamily: fonts.bold,
    fontSize: 12.5,
    color: R.text,
  },
});
