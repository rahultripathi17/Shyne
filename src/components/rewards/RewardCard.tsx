import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import type { CatalogItem } from '../../data/referEarn';
import { fonts } from '../theme';
import { Coin, fmt, R } from './RewardsKit';

const RING = 34;
const RING_W = 3;
const RING_R = (RING - RING_W) / 2;
const RING_C = 2 * Math.PI * RING_R;

/** Product / voucher: picture, price, and one action — Redeem, or a ring showing how close you are. */
export function RewardCard({
  item,
  width,
  balance,
  onPress,
}: {
  item: CatalogItem;
  width: number;
  balance: number;
  onPress: () => void;
}) {
  const ready = balance >= item.cost;
  const short = item.cost - balance;
  const progress = Math.min(1, balance / item.cost);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={ready ? `Redeem ${item.name}` : `${item.name}, ${short} more points needed`}
      style={({ pressed }) => [styles.card, { width }, pressed && styles.pressed]}
    >
      <View style={styles.art}>
        <Image
          source={item.image}
          resizeMode="contain"
          style={{ width: width * Math.min(0.9, (item.scale ?? 0.6) * 1.15), height: 104 }}
        />
        {item.tag && (
          <View style={styles.tag}>
            <Text style={styles.tagText}>{item.tag}</Text>
          </View>
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.detail} numberOfLines={1}>
          {item.detail}
        </Text>
        <View style={styles.foot}>
          <View style={styles.flex}>
            <View style={styles.price}>
              <Coin size={15} />
              <Text style={styles.priceText}>{fmt(item.cost)}</Text>
            </View>
            {!ready && <Text style={styles.need}>Need {fmt(short)} more</Text>}
          </View>
          {ready ? (
            <View style={styles.redeem}>
              <Text style={styles.redeemText}>Redeem</Text>
            </View>
          ) : (
            <View style={styles.ring}>
              <Svg width={RING} height={RING} style={StyleSheet.absoluteFill}>
                <Circle cx={RING / 2} cy={RING / 2} r={RING_R} stroke="#ECEBE6" strokeWidth={RING_W} fill="none" />
                <Circle
                  cx={RING / 2}
                  cy={RING / 2}
                  r={RING_R}
                  stroke={R.gold}
                  strokeWidth={RING_W}
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={`${RING_C} ${RING_C}`}
                  strokeDashoffset={RING_C * (1 - progress)}
                  transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
                />
              </Svg>
              <Ionicons name="lock-closed" size={12} color={R.muted} />
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  pressed: {
    opacity: 0.8,
  },
  card: {
    borderRadius: 20,
    backgroundColor: R.card,
    overflow: 'hidden',
  },
  art: {
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F0EB',
  },
  tag: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: R.card,
  },
  tagText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: R.text,
  },
  body: {
    padding: 12,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: R.text,
  },
  detail: {
    marginTop: 1,
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: R.muted,
  },
  foot: {
    marginTop: 12,
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceText: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
    color: R.text,
  },
  need: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 10.5,
    color: R.muted,
  },
  redeem: {
    height: 34,
    paddingHorizontal: 13,
    borderRadius: 17,
    backgroundColor: R.yellow,
    justifyContent: 'center',
  },
  redeemText: {
    fontFamily: fonts.extraBold,
    fontSize: 12,
    color: R.text,
  },
  ring: {
    width: RING,
    height: RING,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
