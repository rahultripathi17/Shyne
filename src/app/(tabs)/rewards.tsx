import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { type ComponentProps, useState } from 'react';
import { Image, Linking, Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { ink } from '../../components/home/homeTheme';
import { PressableScale } from '../../components/home/motion';
import { useTabBarSpace } from '../../components/tabBarSpace';
import { TabScroll } from '../../components/TabScroll';
import { fonts } from '../../components/theme';
import { Toast, useToast } from '../../components/Toast';
import {
  FRIEND_DISCOUNT,
  MONTHLY_PRIZES,
  MY_REWARDS,
  REDEEM,
  REFERRAL_CODE,
  SAMPLE_LEADERBOARD,
  tierProgress,
  TIERS,
  WAYS_TO_EARN,
} from '../../data/rewards';
import { useAppStore } from '../../store/AppStore';

type IconName = ComponentProps<typeof Ionicons>['name'];
type Section = 'redeem' | 'milestones' | 'leaderboard';

const SECTIONS: { key: Section; label: string }[] = [
  { key: 'redeem', label: 'Redeem' },
  { key: 'milestones', label: 'Milestones' },
  { key: 'leaderboard', label: 'Leaderboard' },
];

const fmt = (n: number) => n.toLocaleString('en-IN');
const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
const inviteText = `Get your car or bike washed at your doorstep with Hoora! Use my code ${REFERRAL_CODE} for ₹${FRIEND_DISCOUNT} off your first service.`;

export default function RewardsScreen() {
  const { name, email, gender, dob, photoUri } = useAppStore();
  const [section, setSection] = useState<Section>('redeem');
  const [kind, setKind] = useState<'product' | 'voucher'>('product');
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  const bottomSpace = useTabBarSpace();
  const { points, referrals, monthPoints } = MY_REWARDS;
  const tier = tierProgress(referrals);
  const perReferral = (tier.current ?? TIERS[0]).pointsPerReferral;
  const profileDone = !!(name && email && gender && dob && photoUri);

  const copy = async () => {
    await Clipboard.setStringAsync(REFERRAL_CODE);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const whatsapp = async () => {
    const url = `whatsapp://send?text=${encodeURIComponent(inviteText)}`;
    if (await Linking.canOpenURL(url).catch(() => false)) await Linking.openURL(url);
    else await Share.share({ message: inviteText });
  };

  return (
    <View style={{ flex: 1 }}>
      <TabScroll title="Rewards" subtitle="Earn Hoora Points, unlock free services">
        {/* Points wallet */}
        <View style={styles.wallet}>
          <View style={{ flex: 1 }}>
            <Text style={styles.walletLabel}>Your Hoora Points</Text>
            <View style={styles.walletRow}>
              <Image source={require('../../../assets/profile/coins.png')} style={styles.walletCoin} />
              <Text style={styles.walletValue}>{fmt(points)}</Text>
            </View>
            <Text style={styles.walletSub}>Use them on products, vouchers and free washes</Text>
          </View>
          <Image source={require('../../../assets/refer/gift.png')} style={styles.walletGift} />
          <View style={styles.walletActions}>
            <Pressable onPress={() => setSection('redeem')} style={styles.walletPrimary} accessibilityRole="button">
              <Text style={styles.walletPrimaryText}>Redeem</Text>
            </Pressable>
            <Pressable
              onPress={() => toast.show(points ? 'Points history — coming soon' : 'No points activity yet')}
              style={styles.walletGhost}
              accessibilityRole="button"
            >
              <Ionicons name="time-outline" size={15} color={ink.text} />
              <Text style={styles.walletGhostText}>History</Text>
            </Pressable>
          </View>
        </View>

        {/* Refer & earn — the main way to earn */}
        <View style={styles.refer}>
          <View style={styles.referTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.referTitle}>Refer & earn</Text>
              <Text style={styles.referBody}>
                Friends get <Text style={styles.bold}>₹{FRIEND_DISCOUNT} off</Text>. You get{' '}
                <Text style={styles.bold}>{perReferral} points</Text> after their first service.
              </Text>
            </View>
          </View>
          <View style={styles.codeRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.codeLabel}>Your code</Text>
              <Text style={styles.code}>{REFERRAL_CODE}</Text>
            </View>
            <Pressable onPress={copy} style={styles.copy} accessibilityRole="button" accessibilityLabel="Copy code">
              <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color={ink.text} />
              <Text style={styles.copyText}>{copied ? 'Copied' : 'Copy'}</Text>
            </Pressable>
          </View>
          <View style={styles.shareRow}>
            <Pressable
              onPress={whatsapp}
              style={({ pressed }) => [styles.whatsapp, pressed && { opacity: 0.88 }]}
              accessibilityRole="button"
            >
              <Ionicons name="logo-whatsapp" size={19} color="#FFFFFF" />
              <Text style={styles.whatsappText}>Invite on WhatsApp</Text>
            </Pressable>
            <Pressable
              onPress={() => Share.share({ message: inviteText })}
              style={({ pressed }) => [styles.more, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel="More ways to share"
            >
              <Ionicons name="share-social-outline" size={20} color={ink.text} />
            </Pressable>
          </View>
        </View>

        {/* Tier */}
        <PressableScale
          onPress={() => setSection('milestones')}
          scaleTo={0.98}
          style={styles.tier}
          accessibilityLabel="See milestones"
        >
          <Image
            source={(tier.current ?? TIERS[0]).badge}
            resizeMode="contain"
            style={[styles.tierBadge, !tier.current && { opacity: 0.45 }]}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.tierName}>{tier.current ? `${tier.current.name} member` : 'Start your journey'}</Text>
            <View style={styles.bar}>
              <View style={[styles.barFill, { width: `${Math.max(4, tier.progress * 100)}%` }]} />
            </View>
            <Text style={styles.tierNext}>
              {tier.next
                ? `${tier.toNext} more referral${tier.toNext === 1 ? '' : 's'} to ${tier.next.name}`
                : 'You’re at the top tier'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={ink.muted} />
        </PressableScale>

        {/* Ways to earn */}
        <Text style={styles.section}>Ways to earn</Text>
        <View style={styles.earnGrid}>
          {WAYS_TO_EARN.map((w) => {
            const done = w.key === 'profile' && profileDone;
            return (
              <View key={w.key} style={styles.earn}>
                <View style={styles.earnIcon}>
                  <Ionicons name={w.icon as IconName} size={18} color={ink.text} />
                </View>
                <Text style={styles.earnTitle} numberOfLines={2}>
                  {w.title}
                </Text>
                <Text style={[styles.earnPoints, done && { color: '#1E8E4E' }]}>
                  {done ? 'Done' : `+${w.points} pts`}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Sections */}
        <View style={styles.segment}>
          {SECTIONS.map((s) => {
            const on = section === s.key;
            return (
              <Pressable
                key={s.key}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setSection(s.key);
                }}
                style={[styles.segmentItem, on && styles.segmentOn]}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
              >
                <Text style={[styles.segmentText, on && styles.segmentTextOn]}>{s.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {section === 'redeem' && (
          <>
            <View style={styles.chips}>
              {(['product', 'voucher'] as const).map((k) => (
                <Pressable
                  key={k}
                  onPress={() => setKind(k)}
                  style={[styles.chip, kind === k && styles.chipOn]}
                  accessibilityRole="tab"
                >
                  <Text style={[styles.chipText, kind === k && styles.chipTextOn]}>
                    {k === 'product' ? 'Products' : 'Vouchers'}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.grid}>
              {REDEEM.filter((r) => r.kind === kind).map((r) => {
                const short = r.points - points;
                return (
                  <View key={r.id} style={styles.item}>
                    <View style={styles.itemArt}>
                      {r.image ? (
                        <Image source={r.image} resizeMode="contain" style={styles.itemImg} />
                      ) : (
                        <View style={styles.voucherIcon}>
                          <Ionicons name={r.icon as IconName} size={26} color={ink.text} />
                        </View>
                      )}
                    </View>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {r.name}
                    </Text>
                    <Text style={styles.itemDetail}>{r.detail}</Text>
                    <View style={styles.itemPoints}>
                      <Image source={require('../../../assets/profile/coins.png')} style={styles.itemCoin} />
                      <Text style={styles.itemPointsText}>{fmt(r.points)}</Text>
                    </View>
                    <View style={[styles.itemBtn, short > 0 && styles.itemBtnOff]}>
                      <Text style={[styles.itemBtnText, short > 0 && styles.itemBtnTextOff]}>
                        {short > 0 ? `${fmt(short)} more needed` : 'Redeem'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {section === 'milestones' && (
          <View style={styles.journey}>
            {TIERS.map((t, i) => {
              const reached = referrals >= t.from;
              const current = tier.current?.key === t.key;
              const last = i === TIERS.length - 1;
              return (
                <View key={t.key} style={styles.step}>
                  <View style={styles.rail}>
                    <View style={[styles.dot, reached && styles.dotOn]}>
                      <Ionicons
                        name={reached ? 'checkmark' : 'lock-closed'}
                        size={12}
                        color={reached ? ink.text : ink.faint}
                      />
                    </View>
                    {!last && <View style={[styles.line, reached && styles.lineOn]} />}
                  </View>
                  <View style={[styles.stepCard, current && styles.stepCardOn, !reached && styles.stepCardLocked]}>
                    <Image
                      source={t.badge}
                      resizeMode="contain"
                      style={[styles.stepBadge, !reached && { opacity: 0.4 }]}
                    />
                    <View style={{ flex: 1 }}>
                      <View style={styles.stepTitleRow}>
                        <Text style={[styles.stepName, { color: reached ? t.color : ink.muted }]}>{t.name}</Text>
                        <Text style={styles.stepRange}>{t.to ? `${t.from}–${t.to}` : `${t.from}+`} referrals</Text>
                      </View>
                      <Text style={[styles.stepReward, !reached && { color: ink.muted }]}>{t.reward}</Text>
                      <Text style={styles.stepRate}>{t.pointsPerReferral} points per referral</Text>
                    </View>
                    {current && (
                      <View style={styles.claim}>
                        <Text style={styles.claimText}>Claim</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {section === 'leaderboard' && (
          <>
            <View style={styles.board}>
              <Text style={styles.boardTitle}>This month’s top referrers win</Text>
              <View style={styles.podium}>
                {[1, 0, 2].map((idx) => {
                  const p = SAMPLE_LEADERBOARD[idx];
                  const prize = MONTHLY_PRIZES[idx];
                  const first = idx === 0;
                  return (
                    <View key={p.name} style={[styles.podiumCol, first && styles.podiumFirst]}>
                      <Image
                        source={prize.image}
                        resizeMode="contain"
                        style={[styles.prizeImg, first && styles.prizeImgFirst]}
                      />
                      <Text style={styles.prizeName} numberOfLines={1}>
                        {prize.name}
                      </Text>
                      <View style={[styles.avatar, first && styles.avatarFirst]}>
                        {first && <Ionicons name="trophy" size={14} color={ink.yellowDeep} style={styles.crown} />}
                        <Text style={styles.avatarText}>{initials(p.name)}</Text>
                      </View>
                      <Text style={styles.podiumName}>{p.name}</Text>
                      <Text style={styles.podiumPoints}>{fmt(p.points)} pts</Text>
                      <View style={[styles.rankBlock, { height: first ? 34 : 22 }]}>
                        <Text style={styles.rankText}>{idx + 1}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
              <Text style={styles.boardNote}>Resets on the last day of every month</Text>
            </View>

            <View style={styles.list}>
              {SAMPLE_LEADERBOARD.slice(3).map((p, i) => (
                <View key={p.name} style={styles.listRow}>
                  <Text style={styles.listRank}>{i + 4}</Text>
                  <View style={styles.listAvatar}>
                    <Text style={styles.listAvatarText}>{initials(p.name)}</Text>
                  </View>
                  <Text style={styles.listName}>{p.name}</Text>
                  <Text style={styles.listPoints}>{fmt(p.points)} pts</Text>
                </View>
              ))}
              <View style={[styles.listRow, styles.listYou]}>
                <Text style={styles.listRank}>–</Text>
                <View style={[styles.listAvatar, { backgroundColor: ink.text }]}>
                  <Text style={[styles.listAvatarText, { color: ink.yellow }]}>{name ? initials(name) : 'Y'}</Text>
                </View>
                <Text style={styles.listName}>You</Text>
                <Text style={styles.listPoints}>{fmt(monthPoints)} pts</Text>
              </View>
            </View>
          </>
        )}
      </TabScroll>
      <Toast toast={toast} bottom={bottomSpace} />
    </View>
  );
}

const styles = StyleSheet.create({
  bold: {
    fontFamily: fonts.extraBold,
    color: ink.text,
  },
  wallet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 18,
    paddingBottom: 16,
    borderRadius: 22,
    backgroundColor: ink.yellow,
    overflow: 'hidden',
  },
  walletLabel: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: 'rgba(21,22,26,0.65)',
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  walletCoin: {
    width: 30,
    height: 30,
  },
  walletValue: {
    fontFamily: fonts.extraBold,
    fontSize: 36,
    letterSpacing: -1,
    color: ink.text,
  },
  walletSub: {
    marginTop: 4,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: 'rgba(21,22,26,0.7)',
  },
  walletGift: {
    width: 92,
    height: 92,
    marginTop: -6,
    marginRight: -6,
  },
  walletActions: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  walletPrimary: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: ink.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletPrimaryText: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  walletGhost: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    gap: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletGhostText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: ink.text,
  },
  refer: {
    marginTop: 14,
    padding: 16,
    gap: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ink.line,
    backgroundColor: '#FFFFFF',
  },
  referTop: {
    flexDirection: 'row',
  },
  referTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
    color: ink.text,
  },
  referBody: {
    marginTop: 4,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 19,
    color: ink.muted,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 6,
    paddingLeft: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#C9CBD2',
    backgroundColor: '#FAFAFB',
  },
  codeLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: ink.muted,
  },
  code: {
    fontFamily: fonts.extraBold,
    fontSize: 19,
    letterSpacing: 2,
    color: ink.text,
  },
  copy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 11,
    backgroundColor: ink.yellow,
  },
  copyText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: ink.text,
  },
  shareRow: {
    flexDirection: 'row',
    gap: 10,
  },
  whatsapp: {
    flex: 1,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    backgroundColor: '#1FAF55',
  },
  whatsappText: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  more: {
    width: 50,
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: ink.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tier: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 20,
    backgroundColor: '#FFFAEF',
    borderWidth: 1,
    borderColor: '#FEEEC7',
  },
  tierBadge: {
    width: 56,
    height: 56,
  },
  tierName: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
    color: ink.text,
  },
  bar: {
    height: 8,
    marginTop: 8,
    borderRadius: 4,
    backgroundColor: '#F1E6C4',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: ink.yellowDeep,
  },
  tierNext: {
    marginTop: 6,
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: ink.label,
  },
  section: {
    marginTop: 24,
    marginBottom: 12,
    fontFamily: fonts.extraBold,
    fontSize: 17,
    color: ink.text,
  },
  earnGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  earn: {
    flex: 1,
    padding: 10,
    gap: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ink.line,
  },
  earnIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF6C2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  earnTitle: {
    minHeight: 30,
    fontFamily: fonts.semiBold,
    fontSize: 11,
    lineHeight: 15,
    color: ink.text,
  },
  earnPoints: {
    fontFamily: fonts.extraBold,
    fontSize: 12,
    color: ink.gold,
  },
  segment: {
    flexDirection: 'row',
    marginTop: 26,
    marginBottom: 14,
    padding: 4,
    borderRadius: 14,
    backgroundColor: '#F2F3F5',
  },
  segmentItem: {
    flex: 1,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentOn: {
    backgroundColor: ink.yellow,
  },
  segmentText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: ink.muted,
  },
  segmentTextOn: {
    color: ink.text,
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: ink.line,
    justifyContent: 'center',
  },
  chipOn: {
    borderColor: ink.text,
    backgroundColor: ink.text,
  },
  chipText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: ink.muted,
  },
  chipTextOn: {
    color: '#FFFFFF',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  item: {
    width: '48.5%',
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ink.line,
    backgroundColor: '#FFFFFF',
  },
  itemArt: {
    height: 104,
    borderRadius: 12,
    backgroundColor: '#F6F7F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  itemImg: {
    width: '80%',
    height: 86,
  },
  voucherIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ink.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: ink.text,
  },
  itemDetail: {
    marginTop: 1,
    fontFamily: fonts.medium,
    fontSize: 11,
    color: ink.muted,
  },
  itemPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  itemCoin: {
    width: 16,
    height: 16,
  },
  itemPointsText: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
    color: ink.text,
  },
  itemBtn: {
    height: 34,
    marginTop: 10,
    borderRadius: 10,
    backgroundColor: ink.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBtnOff: {
    backgroundColor: '#F2F3F5',
  },
  itemBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: ink.text,
  },
  itemBtnTextOff: {
    color: ink.muted,
  },
  journey: {
    paddingTop: 4,
  },
  step: {
    flexDirection: 'row',
    gap: 12,
  },
  rail: {
    alignItems: 'center',
    width: 24,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F2F3F5',
    borderWidth: 1.5,
    borderColor: '#E2E3E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  dotOn: {
    backgroundColor: ink.yellow,
    borderColor: ink.yellowDeep,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E3E8',
  },
  lineOn: {
    backgroundColor: ink.yellowDeep,
  },
  stepCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ink.line,
    backgroundColor: '#FFFFFF',
  },
  stepCardOn: {
    borderColor: ink.yellowDeep,
    backgroundColor: '#FFFBE6',
  },
  stepCardLocked: {
    backgroundColor: '#FAFAFB',
  },
  stepBadge: {
    width: 44,
    height: 44,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  stepName: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
  },
  stepRange: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: ink.muted,
  },
  stepReward: {
    marginTop: 2,
    fontFamily: fonts.bold,
    fontSize: 13,
    color: ink.text,
  },
  stepRate: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 11,
    color: ink.muted,
  },
  claim: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 9,
    backgroundColor: ink.text,
    justifyContent: 'center',
  },
  claimText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: ink.yellow,
  },
  board: {
    paddingTop: 16,
    paddingHorizontal: 12,
    borderRadius: 22,
    backgroundColor: ink.text,
    overflow: 'hidden',
  },
  boardTitle: {
    textAlign: 'center',
    fontFamily: fonts.extraBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 14,
  },
  podiumCol: {
    flex: 1,
    alignItems: 'center',
  },
  podiumFirst: {
    marginBottom: 0,
  },
  prizeImg: {
    width: 54,
    height: 54,
  },
  prizeImgFirst: {
    width: 70,
    height: 70,
  },
  prizeName: {
    marginTop: 4,
    maxWidth: '92%',
    fontFamily: fonts.semiBold,
    fontSize: 10,
    color: 'rgba(255,255,255,0.65)',
  },
  avatar: {
    width: 44,
    height: 44,
    marginTop: 10,
    borderRadius: 22,
    backgroundColor: '#2A2B31',
    borderWidth: 2,
    borderColor: '#4A4C55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFirst: {
    marginTop: 22,
    width: 54,
    height: 54,
    borderRadius: 27,
    borderColor: ink.yellow,
  },
  crown: {
    position: 'absolute',
    top: -16,
  },
  avatarText: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  podiumName: {
    marginTop: 6,
    fontFamily: fonts.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  podiumPoints: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: ink.yellow,
  },
  rankBlock: {
    alignSelf: 'stretch',
    marginTop: 8,
    marginHorizontal: 6,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: 'rgba(255,227,0,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontFamily: fonts.extraBold,
    fontSize: 13,
    color: ink.yellow,
  },
  boardNote: {
    paddingVertical: 10,
    textAlign: 'center',
    fontFamily: fonts.medium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
  },
  list: {
    marginTop: 12,
    gap: 8,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 56,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ink.line,
  },
  listYou: {
    borderColor: ink.yellowDeep,
    backgroundColor: '#FFFBE6',
  },
  listRank: {
    width: 18,
    fontFamily: fonts.extraBold,
    fontSize: 14,
    color: ink.text,
  },
  listAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F2F3F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listAvatarText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: ink.text,
  },
  listName: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: ink.text,
  },
  listPoints: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: ink.label,
  },
});
