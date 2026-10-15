import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { BLACK, PLANS, type PlanFreq, type PlanPeriod, type WashService } from '../../data/bookingFlow';
import { Sheet } from '../rewards/ClaimForm';
import { fonts } from '../theme';
import { YellowButton } from '../tracking/TrackingSheets';
import { T } from '../tracking/trackTheme';

// Bottom sheets of the booking flow (Figma "New flow 02/08/2026").

const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;

/** "Choose your wash plan": monthly or quarterly, once a week or alternate days. */
export function PlanSheet({
  visible,
  onClose,
  onContinue,
}: {
  visible: boolean;
  onClose: () => void;
  onContinue: (period: PlanPeriod, freq: PlanFreq) => void;
}) {
  const [period, setPeriod] = useState<PlanPeriod>('monthly');
  const [freq, setFreq] = useState<PlanFreq>('alternate');
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text style={styles.kicker}>Package Are Flexible - you can pause/cancel anytime</Text>
      <Text style={styles.title}>Choose your wash plan</Text>
      <View style={styles.periods}>
        {(['monthly', 'quarterly'] as const).map((p) => {
          const on = period === p;
          return (
            <Pressable
              key={p}
              onPress={() => setPeriod(p)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              style={[styles.period, on && styles.periodOn]}
            >
              <Text style={[styles.periodName, on && styles.onDark]}>{p === 'monthly' ? 'Monthly' : 'Quarterly'}</Text>
              <Text style={[styles.periodSub, on && styles.onDarkMuted]}>
                {p === 'monthly' ? 'Billed every month' : 'Billed every 3 months'}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.planHead}>
        <Text style={[styles.planHeadText, styles.flex]}>{period === 'monthly' ? 'Monthly' : 'Quarterly'} Washes</Text>
        <Text style={[styles.planHeadText, styles.colMid]}>Per wash</Text>
        <Text style={[styles.planHeadText, styles.colEnd]}>Total</Text>
      </View>
      {PLANS[period].map((p) => {
        const on = freq === p.id;
        return (
          <Pressable
            key={p.id}
            onPress={() => setFreq(p.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            style={[styles.plan, on && styles.planOn]}
          >
            {p.badge && (
              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText}>{p.badge}</Text>
              </View>
            )}
            <View style={[styles.radio, on && styles.radioOn]}>{on && <View style={styles.radioInner} />}</View>
            <View style={styles.flex}>
              <Text style={styles.planName}>{p.name}</Text>
              <Text style={styles.planSub}>{p.washes} washes</Text>
            </View>
            <View style={styles.colMid}>
              <Text style={styles.planPer}>{rupees(p.perWash)}/wash</Text>
              <Text style={styles.planMrp}>{rupees(p.mrp)}/wash</Text>
            </View>
            <View style={styles.colEnd}>
              <Text style={styles.planTotal}>{rupees(p.perWash * p.washes)}</Text>
              <Text style={styles.planSave}>Save {rupees(p.save)}</Text>
            </View>
          </Pressable>
        );
      })}
      <View style={styles.footer}>
        <YellowButton label="Continue" onPress={() => onContinue(period, freq)} />
      </View>
    </Sheet>
  );
}

/** "Get more from your wash" — offered when booking the basic wash once. */
export function UpgradeSheet({
  visible,
  basic,
  premium,
  basicPrice,
  premiumPrice,
  onClose,
  onUpgrade,
  onKeep,
}: {
  visible: boolean;
  basic: WashService;
  premium: WashService;
  basicPrice: number;
  premiumPrice: number;
  onClose: () => void;
  onUpgrade: () => void;
  onKeep: () => void;
}) {
  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={styles.upHero}>
        <Text style={styles.upTitle}>Get more from your wash</Text>
        <Text style={styles.upSub}>Refresh your car inside and out with vacuuming, dashboard polish & more.</Text>
      </View>
      <View style={styles.compare}>
        <View style={styles.cmpLeft}>
          <Text style={styles.selected}>Selected</Text>
          <Text style={styles.cmpName}>{basic.name}</Text>
          <Text style={styles.cmpPrice}>{rupees(basicPrice)}</Text>
          {[basic.base.name.replace(/^\(.*?\)\s*/, ''), ...basic.addOns.filter((a) => a.on).map((a) => a.name)].map(
            (n) => (
              <Text key={n} style={styles.cmpItem} numberOfLines={2}>
                {n}
              </Text>
            ),
          )}
        </View>
        <View style={styles.cmpRight}>
          <Text style={styles.recommended}>Recommended</Text>
          <Text style={[styles.cmpName, styles.cmpNameBig]}>{premium.name}</Text>
          <Text style={styles.cmpPriceBig}>
            {rupees(premiumPrice)} <Text style={styles.only}>only</Text>
          </Text>
          {[
            premium.base.name.replace(/^\(.*?\)\s*/, ''),
            'Interior Vacuum & dashboard polish',
            '30 Days Air Freshener',
            'Tissue Box',
          ].map((n, i) => (
            <Text key={n} style={[styles.cmpItemBig, i < 2 && styles.cmpItemHi]} numberOfLines={2}>
              {n}
            </Text>
          ))}
        </View>
      </View>
      <View style={styles.footer}>
        <YellowButton label="Upgrade to Premium" onPress={onUpgrade} />
      </View>
      <Pressable onPress={onKeep} accessibilityRole="button" style={styles.link}>
        <Text style={styles.linkText}>Continue with {basic.name.includes('Basic') ? 'Basic' : basic.name} wash</Text>
      </Pressable>
    </Sheet>
  );
}

const SOC = {
  bike: {
    image: require('../../../assets/booking/flow/soc-bike.png'),
    title: 'Society Packages are not available for Bikes',
    body: 'Society Packages are currently available only for car wash services. You can still explore our regular bike wash services.',
    cta: 'View Car Society Packages',
    alt: 'Continue with Bike Services',
  },
  car: {
    image: require('../../../assets/booking/flow/soc-car.png'),
    title: 'Society Packages are available for Cars only',
    body: 'Society offers are currently available for car wash services. Add your car to check available society packages and pricing.',
    cta: 'Add a Car',
    alt: 'Continue with Bike Services',
  },
  soon: {
    image: require('../../../assets/booking/flow/soc-soon.png'),
    title: 'Society Packages are coming soon to your area',
    body: 'We’re expanding Society Packages to more locations. They’re not available at your current location yet.',
    cta: 'Explore Regular Services',
    alt: 'Change Location',
  },
};

/** Why Society Packages aren't available here, and what to do instead. */
export function SocietySheet({
  visible,
  variant,
  onClose,
  onCta,
  onAlt,
}: {
  visible: boolean;
  variant: keyof typeof SOC;
  onClose: () => void;
  onCta: () => void;
  onAlt: () => void;
}) {
  const c = SOC[variant];
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Image source={c.image} style={styles.socArt} resizeMode="contain" />
      <Text style={styles.socTitle}>{c.title}</Text>
      <Text style={styles.socBody}>{c.body}</Text>
      {variant === 'soon' && (
        <View style={styles.socNote}>
          <Ionicons name="information-circle" size={16} color="#B98A2A" />
          <Text style={styles.socNoteText}>We’ll let you know once Society Packages are available near you.</Text>
        </View>
      )}
      <View style={styles.footer}>
        <YellowButton label={c.cta} onPress={onCta} />
      </View>
      <Pressable onPress={onAlt} accessibilityRole="button" style={styles.link}>
        <Text style={styles.altText}>{c.alt}</Text>
      </Pressable>
    </Sheet>
  );
}

/** What a service includes ("View Details"). */
export function ServiceDetailsSheet({
  visible,
  service,
  onClose,
}: {
  visible: boolean;
  service?: WashService;
  onClose: () => void;
}) {
  if (!service) return null;
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Image source={service.image} style={styles.detailImg} resizeMode="cover" />
      <Text style={styles.title}>{service.name}</Text>
      <View style={styles.detailMeta}>
        <Ionicons name="star" size={14} color={T.star} />
        <Text style={styles.detailMetaText}>
          {service.rating} ({service.ratings} ratings) · Starts at {rupees(service.from)}
        </Text>
      </View>
      <Text style={styles.detailHead}>What’s included</Text>
      {[service.base, ...service.addOns].map((i) => (
        <View key={i.id} style={styles.detailRow}>
          <Ionicons name="checkmark-circle" size={18} color={T.green} />
          <Text style={styles.detailItem}>{i.name}</Text>
          <Text style={styles.detailPrice}>{rupees(i.price)}</Text>
        </View>
      ))}
      <Text style={styles.detailNote}>Our partner brings water-saving tools, products and microfibre cloths.</Text>
      <View style={styles.footer}>
        <YellowButton label="Got it" onPress={onClose} />
      </View>
    </Sheet>
  );
}

/** Reschedule & Cancellation Policy, Hoora Black vs standard. */
export function PolicySheet({
  visible,
  onClose,
  onBlack,
}: {
  visible: boolean;
  onClose: () => void;
  onBlack: () => void;
}) {
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>Reschedule & Cancellation Policy</Text>
      <Text style={styles.polHead}>Cancellation Policy</Text>
      <PolicyTable
        rows={[
          ['Before 4 hours', 'FREE', '₹99'],
          ['Within 4 hours', 'No refund', 'No refund'],
        ]}
      />
      <Text style={styles.polHead}>Reschedule Policy</Text>
      <PolicyTable
        rows={[
          ['1st reschedule · Before 4 hours', 'FREE', 'FREE'],
          ['2nd reschedule · Before 4 hours', 'FREE', '₹99'],
          ['3rd onwards · Before 4 hours', '₹99', '₹99'],
        ]}
      />
      <View style={styles.polNote}>
        <Text style={styles.polNoteText}>• Rescheduling within 4 hours of your slot is never allowed.</Text>
        <Text style={styles.polNoteText}>• Cancellation charge applies per service slot.</Text>
      </View>
      <View style={styles.polBlack}>
        <Text style={styles.polBlackText}>
          Upgrade to <Text style={styles.bold}>HOORA BLACK</Text> for 1st free cancellation & 2 free reschedules, if
          done before 4 hours of service time.
        </Text>
        <Pressable onPress={onBlack} accessibilityRole="button" style={styles.polBlackBar}>
          <Text style={styles.polBlackBarText}>
            Buy <Text style={styles.blackWord}>HOORA BLACK</Text> at just {rupees(BLACK.price)}
          </Text>
          <Text style={styles.buyNow}>Buy now</Text>
        </Pressable>
      </View>
      <View style={styles.polRefund}>
        <Text style={styles.polRefundTitle}>Refund Policy (Hoora Points)</Text>
        <Text style={styles.polRefundText}>
          All eligible refunds will be processed as Hoora Points (1 Hoora Coin = ₹1).
        </Text>
      </View>
    </Sheet>
  );
}

function PolicyTable({ rows }: { rows: [string, string, string][] }) {
  return (
    <View style={styles.table}>
      <View style={styles.blackCol} />
      <View style={styles.tRow}>
        <Text style={[styles.tCell, styles.tHead]}>Time</Text>
        <Text style={[styles.tMid, styles.blackWordHead]}>BLACK</Text>
        <Text style={[styles.tEnd, styles.tHead]}>Standard</Text>
      </View>
      {rows.map(([time, black, std]) => (
        <View key={time} style={styles.tRow}>
          <Text style={styles.tCell}>{time}</Text>
          <Text style={[styles.tMid, styles.tOnBlack]}>{black}</Text>
          <Text style={styles.tEnd}>{std}</Text>
        </View>
      ))}
    </View>
  );
}

/** Driver / vehicle caretaker: who the partner should call. */
export function CaretakerSheet({
  visible,
  name,
  phone,
  onClose,
  onSave,
}: {
  visible: boolean;
  name: string;
  phone: string;
  onClose: () => void;
  onSave: (name: string, phone: string) => void;
}) {
  const [n, setN] = useState(name);
  const [p, setP] = useState(phone);
  const ok = n.trim().length > 1 && p.length === 10;
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>Driver/Vehicle Caretaker Details</Text>
      <View style={styles.dash} />
      <Text style={styles.fieldLabel}>Receiver’s Name</Text>
      <TextInput
        value={n}
        onChangeText={setN}
        placeholder="Full name"
        placeholderTextColor={T.faint}
        style={styles.input}
      />
      <Text style={styles.fieldLabel}>Receiver’s Number</Text>
      <View style={styles.inputRow}>
        <TextInput
          value={p}
          onChangeText={(t) => setP(t.replace(/[^0-9]/g, '').slice(0, 10))}
          placeholder="10-digit mobile number"
          placeholderTextColor={T.faint}
          keyboardType="phone-pad"
          style={[styles.input, styles.flex]}
        />
        <Ionicons name="person-circle-outline" size={22} color={T.muted} style={styles.contactIcon} />
      </View>
      <View style={styles.footer}>
        <YellowButton label="Continue" onPress={() => onSave(n.trim(), p)} disabled={!ok} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  bold: {
    fontFamily: fonts.bold,
  },
  kicker: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: T.muted,
  },
  title: {
    marginTop: 2,
    fontFamily: fonts.semiBold,
    fontSize: 17,
    color: T.text,
  },
  periods: {
    marginTop: 14,
    padding: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
  },
  period: {
    flex: 1,
    height: 56,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodOn: {
    backgroundColor: '#1F1F1F',
  },
  periodName: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: T.text,
  },
  periodSub: {
    marginTop: 1,
    fontFamily: fonts.regular,
    fontSize: 10,
    color: T.muted,
  },
  onDark: {
    color: '#FFFFFF',
  },
  onDarkMuted: {
    color: '#C9CBD2',
  },
  planHead: {
    marginTop: 16,
    marginBottom: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
  },
  planHeadText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: T.muted,
  },
  colMid: {
    width: 92,
    alignItems: 'center',
    textAlign: 'center',
  },
  colEnd: {
    width: 70,
    alignItems: 'flex-end',
    textAlign: 'right',
  },
  plan: {
    marginTop: 10,
    minHeight: 60,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  planOn: {
    borderColor: T.text,
    backgroundColor: '#FFFDF2',
  },
  planBadge: {
    position: 'absolute',
    left: 10,
    top: -8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: '#1F1F1F',
  },
  planBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 8,
    letterSpacing: 0.3,
    color: '#FFE300',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#B5B8BF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: {
    borderColor: T.text,
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: T.text,
  },
  planName: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: T.text,
  },
  planSub: {
    marginTop: 1,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: T.muted,
  },
  planPer: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: T.text,
  },
  planMrp: {
    fontFamily: fonts.regular,
    fontSize: 9,
    color: T.muted,
    textDecorationLine: 'line-through',
  },
  planTotal: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: T.text,
  },
  planSave: {
    fontFamily: fonts.medium,
    fontSize: 9,
    color: T.green,
  },
  footer: {
    marginTop: 20,
  },
  link: {
    alignSelf: 'center',
    paddingVertical: 14,
  },
  linkText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: '#1A5FD0',
  },
  altText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: T.muted,
  },
  upHero: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 64,
    backgroundColor: '#FFE300',
  },
  upTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: T.text,
  },
  upSub: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 12.5,
    lineHeight: 17,
    color: T.text,
  },
  compare: {
    marginTop: -48,
    marginHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  cmpLeft: {
    flex: 1,
    marginRight: -8,
    marginBottom: 12,
    padding: 14,
    paddingRight: 20,
    borderRadius: 12,
    backgroundColor: '#F4F4F4',
  },
  cmpRight: {
    flex: 1.25,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F2CF4A',
    backgroundColor: '#FFFBEA',
  },
  selected: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#E6E6E6',
    fontFamily: fonts.medium,
    fontSize: 10,
    color: T.ink,
  },
  recommended: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#1B891F',
    fontFamily: fonts.medium,
    fontSize: 10,
    color: '#FFFFFF',
  },
  cmpName: {
    marginTop: 8,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: T.ink,
  },
  cmpNameBig: {
    fontSize: 15,
    color: T.text,
  },
  cmpPrice: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: T.ink,
    marginBottom: 6,
  },
  cmpPriceBig: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: T.text,
    marginBottom: 6,
  },
  only: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  cmpItem: {
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: '#E3E3E3',
    borderStyle: 'dashed',
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: T.muted,
  },
  cmpItemBig: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0E2A6',
    fontFamily: fonts.medium,
    fontSize: 13,
    color: T.text,
  },
  cmpItemHi: {
    marginHorizontal: -14,
    paddingHorizontal: 14,
    backgroundColor: '#FFF2B3',
  },
  socArt: {
    alignSelf: 'center',
    width: 200,
    height: 120,
    marginTop: 8,
  },
  socTitle: {
    marginTop: 14,
    textAlign: 'center',
    fontFamily: fonts.semiBold,
    fontSize: 17,
    lineHeight: 25,
    color: T.text,
  },
  socBody: {
    marginTop: 8,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 13.5,
    lineHeight: 19,
    color: T.muted,
  },
  socNote: {
    marginTop: 14,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FFF9E8',
    flexDirection: 'row',
    gap: 8,
  },
  socNoteText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: T.ink,
  },
  detailImg: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 12,
  },
  detailMeta: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailMetaText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: T.muted,
  },
  detailHead: {
    marginTop: 16,
    marginBottom: 6,
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: T.text,
  },
  detailRow: {
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailItem: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: T.ink,
  },
  detailPrice: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: T.ink,
  },
  detailNote: {
    marginTop: 10,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: T.muted,
  },
  polHead: {
    marginTop: 18,
    marginBottom: 8,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: T.text,
  },
  table: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EDEDED',
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  blackCol: {
    position: 'absolute',
    top: -6,
    bottom: -6,
    left: '48%',
    width: 82,
    borderRadius: 8,
    backgroundColor: '#141414',
  },
  tRow: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tCell: {
    flex: 1,
    paddingRight: 8,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: T.muted,
  },
  tHead: {
    fontFamily: fonts.medium,
    color: T.text,
  },
  tMid: {
    width: 82,
    marginLeft: -12,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  tOnBlack: {
    color: '#FFFFFF',
  },
  tEnd: {
    width: 76,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 12,
    color: T.text,
  },
  blackWordHead: {
    fontFamily: fonts.extraBoldItalic,
    fontSize: 12,
    color: '#FFE300',
  },
  polNote: {
    marginTop: 14,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FFF7DC',
    gap: 4,
  },
  polNoteText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: T.ink,
  },
  polBlack: {
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EDEDED',
    overflow: 'hidden',
  },
  polBlackText: {
    padding: 12,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: T.ink,
  },
  polBlackBar: {
    paddingHorizontal: 14,
    height: 40,
    backgroundColor: '#141414',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  polBlackBarText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#FFFFFF',
  },
  blackWord: {
    fontFamily: fonts.extraBoldItalic,
    color: '#FFE300',
  },
  buyNow: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: '#FFE300',
    textDecorationLine: 'underline',
  },
  polRefund: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EDEDED',
  },
  polRefundTitle: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: T.ink,
  },
  polRefundText: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 11.5,
    lineHeight: 16,
    color: T.muted,
  },
  dash: {
    marginVertical: 12,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#DCDCDC',
  },
  fieldLabel: {
    marginTop: 8,
    marginBottom: 8,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: T.ink,
  },
  input: {
    height: 50,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E3E5E9',
    fontFamily: fonts.regular,
    fontSize: 15,
    color: T.text,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactIcon: {
    position: 'absolute',
    right: 14,
  },
});
