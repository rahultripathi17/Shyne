import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { type ReactNode, useEffect, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { type CatalogItem, MY_TIER } from '../../data/referEarn';
import { type Redemption, redeem } from '../../data/referEarnStore';
import { fonts, useAnimatedValue } from '../theme';
import { DeliveryForm, Sheet } from './ClaimForm';
import { Coin, fmt, GhostButton, Points, R, YellowButton } from './RewardsKit';

const GIFT = require('../../../assets/rewards/hub/gift-3d.png');

type Step = 'confirm' | 'address' | 'done';

/** Spend Hoora Points: confirm → (delivery address for products) → success. */
export function RedeemSheet({
  item,
  balance,
  onClose,
  onEarnMore,
}: {
  item: CatalogItem | null;
  balance: number;
  onClose: () => void;
  onEarnMore: () => void;
}) {
  const [step, setStep] = useState<Step>('confirm');
  const [result, setResult] = useState<Redemption | null>(null);
  const [shown, setShown] = useState<CatalogItem | null>(item);

  // Reset to the first step whenever a new item opens.
  if (item && item !== shown) {
    setShown(item);
    setStep('confirm');
    setResult(null);
  }

  const it = item ?? shown;
  if (!it) return null;
  const short = it.cost - balance;
  const referralsNeeded = Math.ceil(short / MY_TIER.tier.pointsPerReferral);

  const complete = () => {
    const r = redeem(it.id);
    if (!r) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setResult(r);
    setStep('done');
  };

  return (
    <Sheet visible={item !== null} onClose={onClose}>
      {step === 'confirm' && (
        <View>
          <View style={styles.art}>
            <Image
              source={it.image}
              resizeMode="contain"
              style={[styles.artImage, { width: `${Math.min(80, (it.scale ?? 0.6) * 100)}%` }]}
            />
          </View>
          <Text style={styles.kind}>{it.kind === 'voucher' ? 'FUEL VOUCHER' : 'HOORA PRODUCT'}</Text>
          <Text style={styles.name}>{it.name}</Text>
          <Text style={styles.detail}>
            {it.detail}
            {it.kind === 'product' ? ' · Free delivery' : ' · Code sent instantly'}
          </Text>

          <View style={styles.summary}>
            <Row label="Price" right={<Points value={it.cost} size={14} />} />
            <Row label="Your balance" right={<Points value={balance} size={14} font={fonts.semiBold} />} />
            <View style={styles.summaryLine} />
            {short > 0 ? (
              <Row label="You need" right={<Points value={short} size={14} color={R.amber} />} />
            ) : (
              <Row label="Left after redeeming" right={<Points value={balance - it.cost} size={14} />} />
            )}
          </View>

          {short > 0 ? (
            <>
              <Text style={styles.hint}>
                That’s {referralsNeeded} more successful referral{referralsNeeded === 1 ? '' : 's'}.
              </Text>
              <YellowButton label="Invite friends to earn" icon="logo-whatsapp" onPress={onEarnMore} />
            </>
          ) : (
            <YellowButton
              label={`Redeem for ${fmt(it.cost)} points`}
              onPress={() => (it.kind === 'product' ? setStep('address') : complete())}
            />
          )}
          <Pressable onPress={onClose} accessibilityRole="button" style={styles.cancel}>
            <Text style={styles.cancelText}>Not now</Text>
          </Pressable>
        </View>
      )}

      {step === 'address' && (
        <DeliveryForm
          item={it.name}
          submitLabel={`Confirm · ${fmt(it.cost)} points`}
          onSubmit={complete}
          onCancel={() => setStep('confirm')}
        />
      )}

      {step === 'done' && result && <Success item={it} result={result} onDone={onClose} />}
    </Sheet>
  );
}

function Row({ label, right }: { label: string; right: ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {right}
    </View>
  );
}

/** The peak of the flow: a little celebration, then exactly what happens next. */
function Success({ item, result, onDone }: { item: CatalogItem; result: Redemption; onDone: () => void }) {
  const pop = useAnimatedValue(0);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
  }, [pop]);

  const copy = async () => {
    if (!result.code) return;
    await Clipboard.setStringAsync(result.code);
    void Haptics.selectionAsync();
    setCopied(true);
  };

  return (
    <View style={styles.success}>
      <Animated.Image
        source={GIFT}
        style={[
          styles.successGift,
          { transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] },
        ]}
      />
      <Text style={styles.successTitle}>Redeemed!</Text>
      <Text style={styles.successText}>
        {item.kind === 'voucher'
          ? `Your ${item.name} (${item.detail.replace('Worth ', '')}) is ready. Show this code at any outlet.`
          : `Your ${item.name} ships in 5–7 days. We'll send tracking on WhatsApp.`}
      </Text>
      {result.code ? (
        <Pressable onPress={copy} accessibilityRole="button" style={styles.code}>
          <Text style={styles.codeText} selectable>
            {result.code}
          </Text>
          <View style={styles.codeCopy}>
            <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={15} color={R.text} />
            <Text style={styles.codeCopyText}>{copied ? 'Copied' : 'Copy'}</Text>
          </View>
        </Pressable>
      ) : null}
      <View style={styles.spent}>
        <Coin size={14} />
        <Text style={styles.spentText}>{fmt(result.points)} points used · saved in your history</Text>
      </View>
      <GhostButton label="Done" onPress={onDone} style={styles.successBtn} />
    </View>
  );
}

const styles = StyleSheet.create({
  art: {
    height: 150,
    borderRadius: 18,
    backgroundColor: R.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artImage: {
    width: '62%',
    height: 120,
  },
  kind: {
    marginTop: 16,
    fontFamily: fonts.extraBold,
    fontSize: 10.5,
    letterSpacing: 1.1,
    color: R.goldDeep,
  },
  name: {
    marginTop: 4,
    fontFamily: fonts.extraBold,
    fontSize: 20,
    letterSpacing: -0.4,
    color: R.text,
  },
  detail: {
    marginTop: 3,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: R.muted,
  },
  summary: {
    marginTop: 16,
    marginBottom: 16,
    padding: 14,
    gap: 10,
    borderRadius: 14,
    backgroundColor: '#F7F7F4',
  },
  summaryLine: {
    height: 1,
    backgroundColor: R.line,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    color: R.muted,
  },
  hint: {
    marginTop: -6,
    marginBottom: 12,
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: R.muted,
  },
  cancel: {
    alignSelf: 'center',
    paddingVertical: 12,
  },
  cancelText: {
    fontFamily: fonts.semiBold,
    fontSize: 13.5,
    color: R.muted,
  },
  success: {
    alignItems: 'center',
    paddingTop: 4,
  },
  successGift: {
    width: 104,
    height: 116,
  },
  successTitle: {
    marginTop: 10,
    fontFamily: fonts.extraBold,
    fontSize: 24,
    letterSpacing: -0.6,
    color: R.text,
  },
  successText: {
    marginTop: 6,
    paddingHorizontal: 8,
    textAlign: 'center',
    fontFamily: fonts.medium,
    fontSize: 13.5,
    lineHeight: 20,
    color: R.muted,
  },
  code: {
    marginTop: 16,
    alignSelf: 'stretch',
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: R.gold,
    backgroundColor: R.cream,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeText: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
    letterSpacing: 1.2,
    color: R.text,
  },
  codeCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  codeCopyText: {
    fontFamily: fonts.bold,
    fontSize: 12.5,
    color: R.text,
  },
  spent: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  spentText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: R.muted,
  },
  successBtn: {
    marginTop: 18,
    alignSelf: 'stretch',
  },
});
