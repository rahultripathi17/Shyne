import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { BookingItem } from '../../data/bookingsDemo';
import {
  ADD_ONS,
  CHECKLIST,
  FAQS,
  RECOMMENDED,
  showsFor,
  STAGE_HEAD,
  TIPS,
  TRACK,
  type TrackStage,
} from '../../data/serviceTracking';
import { sendNotification } from '../../lib/notifications';
import { useAppStore } from '../../store/AppStore';
import { HooraLogo } from '../HooraLogo';
import { fonts, noBounce } from '../theme';
import { Toast, useToast } from '../Toast';
import { AddOnsSheet, BillSheet, InstructionsSheet, ManageSheet, RateSheet, YellowButton } from './TrackingSheets';
import { T } from './trackTheme';

// Service booking tracking (Figma 14519:1590). The top follows the stage (map while the
// partner is coming, a result header once it's done or cancelled); the blocks underneath are
// the same page in every stage, shown or hidden by `showsFor`.

const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const ART = {
  tip: require('../../../assets/booking/track/tip-art.png'),
  shield: require('../../../assets/booking/track/challan-shield.png'),
  banner: require('../../../assets/booking/track/care-banner.jpg'),
  starStruck: require('../../../assets/booking/track/star-struck.png'),
};

type Sheet = 'addOns' | 'bill' | 'instructions' | 'rate' | 'manage' | null;

export function ServiceTracking({ item, stage: initialStage }: { item: BookingItem; stage: TrackStage }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const toast = useToast();
  const { notifPrefs } = useAppStore();
  const scroll = useRef<ScrollView>(null);
  const [stage, setStage] = useState(initialStage);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [added, setAdded] = useState<string[]>([]);
  const [stars, setStars] = useState(0);
  const [tip, setTip] = useState<number | null>(null);
  const [instructions, setInstructions] = useState(false);
  const [onCalendar, setOnCalendar] = useState(false);

  const show = showsFor(stage);
  const head = STAGE_HEAD[stage];
  const ended = stage === 'completed' || stage === 'cancelled';

  const addOns = ADD_ONS.filter((a) => added.includes(a.id));
  const extras = [...(item.addOns ?? TRACK.extras), ...addOns.map((a) => ({ name: a.name, qty: 1 }))];
  const price = item.amount + addOns.reduce((s, a) => s + a.price, 0);
  const mrp = item.amount + TRACK.saved;

  const cancel = () => {
    setSheet(null);
    setStage('cancelled');
    scroll.current?.scrollTo({ y: 0, animated: true });
    toast.show('Booking cancelled. Refund started.');
    void sendNotification(
      'cancelled',
      { bookingId: item.id, service: item.title, amount: price },
      { prefs: notifPrefs },
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView ref={scroll} {...noBounce} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        {/* Top: stage, then the map or the result */}
        <View style={[styles.head, { paddingTop: insets.top + 8 }]}>
          <View style={styles.headBar}>
            <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
              <Ionicons name="arrow-back" size={24} color={T.ink} />
            </Pressable>
            {!ended && (
              <View style={styles.headText}>
                <Text style={styles.headTitle} numberOfLines={1}>
                  {head.title}
                </Text>
                <HeadSub sub={head.sub} strong={head.strong} late={head.late} />
              </View>
            )}
            {!ended && <View style={styles.headSpacer} />}
          </View>
          {ended && (
            <View style={styles.result}>
              <View style={[styles.resultIcon, stage === 'cancelled' && { backgroundColor: T.red }]}>
                <Ionicons name={stage === 'cancelled' ? 'close' : 'checkmark'} size={26} color="#FFFFFF" />
              </View>
              <Text style={styles.resultTitle}>{head.title}</Text>
              <Text style={styles.headSub}>{head.sub}</Text>
              {stage === 'cancelled' && (
                <Pressable
                  onPress={() => toast.show(`Refund of ${rupees(price)} reaches you in 3–5 days`)}
                  accessibilityRole="button"
                  style={styles.refundBtn}
                >
                  <Text style={styles.refundText}>Check Refund Status</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
        {stage === 'completed' && <SavedBand amount={TRACK.saved} />}
        {head.map && (
          <Image source={head.map} style={styles.map} resizeMode="cover" accessibilityLabel="Map with your partner" />
        )}

        {/* Rating, once it's over */}
        {ended && (
          <Block>
            <View style={styles.rateRow}>
              <Text style={styles.blockTitle}>Rate your experience</Text>
              <Stars
                value={stars}
                onPick={(n) => {
                  setStars(n);
                  setSheet('rate');
                }}
              />
            </View>
          </Block>
        )}

        {show.checklist && (
          <Block>
            <View style={styles.titleRow}>
              <Text style={styles.blockTitle}>Before our partner arrives</Text>
              <Ionicons name="information-circle" size={16} color={T.ink} />
            </View>
            <Checklist />
          </Block>
        )}

        {show.addOns && (
          <Block>
            <Text style={styles.blockTitle}>Forgot to add something?</Text>
            <Text style={styles.blockSub}>Include more add-ons before your service begins</Text>
            <View style={styles.gap12}>
              <YellowButton
                label={added.length ? `Add ons (${added.length} added)` : 'Add ons'}
                onPress={() => setSheet('addOns')}
              />
            </View>
          </Block>
        )}

        {show.endOtp && (
          <Block>
            <Text style={styles.blockTitle}>Service End OTP</Text>
            <Text style={styles.blockSub}>Share OTP with Service Partner after service</Text>
            <View style={styles.otp}>
              {TRACK.endOtp.split('').map((d, i) => (
                <View key={i} style={styles.otpDigit}>
                  <Text style={styles.otpText}>{d}</Text>
                </View>
              ))}
            </View>
          </Block>
        )}

        {show.instructions && (
          <Block>
            <Pressable onPress={() => setSheet('instructions')} accessibilityRole="button" style={styles.rowBetween}>
              <View style={styles.flex}>
                <Text style={styles.blockTitle}>Service Instructions</Text>
                <Text style={styles.blockSub}>
                  {instructions ? 'Added. Your partner can see them.' : 'Add entry, gate pass, or pet instructions'}
                </Text>
              </View>
              <View style={styles.plus}>
                <Ionicons name={instructions ? 'create-outline' : 'add'} size={18} color={T.ink} />
              </View>
            </Pressable>
          </Block>
        )}

        {show.partner && (
          <Block>
            <View style={styles.partner}>
              <Image source={TRACK.partnerPhoto} style={styles.avatar} />
              <View style={styles.flex}>
                <Text style={styles.partnerName}>I’m {TRACK.partner}, your service partner</Text>
                {show.call && (
                  <Text style={styles.pin}>
                    Enter PIN <Text style={styles.pinStrong}>{TRACK.pin}</Text> to connect with our{' '}
                    <Text style={styles.pinStrong}>Service Partner</Text>.
                  </Text>
                )}
              </View>
              {show.call && (
                <Pressable
                  onPress={() => void Linking.openURL(`tel:${TRACK.supportPhone}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`Call ${TRACK.partner}`}
                >
                  <LinearGradient colors={T.yellow} style={styles.call}>
                    <Ionicons name="call" size={16} color={T.ink} />
                  </LinearGradient>
                </Pressable>
              )}
            </View>
            <TipCard
              tip={tip}
              onTip={(n) => {
                setTip(n);
                toast.show(`${rupees(n)} tip added. ${TRACK.partner} says thank you!`);
              }}
            />
            {stage === 'completed' && <ApplyTip />}
          </Block>
        )}

        <Block>
          <View style={styles.titleRow}>
            <Ionicons name="location-outline" size={18} color={T.ink} />
            <Text style={styles.blockTitle}>Your Address Details</Text>
          </View>
          <Text style={styles.address}>{TRACK.address}</Text>
        </Block>

        {show.calendar && (
          <Block>
            <Pressable
              onPress={() => {
                setOnCalendar(true);
                toast.show(onCalendar ? 'Already on your calendar' : `Added: ${item.when.title}`);
              }}
              accessibilityRole="button"
              style={styles.rowBetween}
            >
              <View style={styles.titleRow}>
                <Ionicons name="calendar-clear-outline" size={20} color={T.ink} />
                <Text style={[styles.blockTitle, styles.calText]}>
                  {onCalendar ? 'Added to calendar' : 'Add booking to calendar'}
                </Text>
              </View>
              <View style={styles.plus}>
                <Ionicons name={onCalendar ? 'checkmark' : 'add'} size={18} color={T.ink} />
              </View>
            </Pressable>
          </Block>
        )}

        <Block>
          <Text style={styles.blockTitle}>Order Summary</Text>
          <View style={styles.dash} />
          <Text style={styles.service}>{item.title}</Text>
          <Text style={styles.blockSub}>{item.eyebrow.replace('-', ' ')}</Text>
          {extras.length > 0 && <View style={styles.dash} />}
          {extras.map((e) => (
            <Text key={e.name} style={styles.extra}>
              • {e.name} X {e.qty}
            </Text>
          ))}
        </Block>

        <Block>
          <Pressable onPress={() => setSheet('bill')} accessibilityRole="button" style={styles.billCard}>
            <View style={styles.flex}>
              <Text style={styles.billTitle}>Total Bill</Text>
              <Text style={styles.billNote}>Incl. taxes & charges</Text>
            </View>
            <View style={styles.billRight}>
              <Text style={styles.billPrice}>
                <Text style={styles.mrp}>{rupees(mrp + addOns.reduce((s, a) => s + a.price, 0))}</Text> {rupees(price)}
              </Text>
              <Text style={styles.saved}>You Saved {rupees(TRACK.saved)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={T.ink} />
          </Pressable>
        </Block>

        {show.recommended && (
          <Block>
            <Text style={styles.blockTitle}>Recommended for you</Text>
            <Text style={styles.blockSub}>These add-ons make your experience even better!</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.recoScroll}
              contentContainerStyle={styles.reco}
            >
              {RECOMMENDED.map((r) => (
                <View key={r.name} style={styles.recoCard}>
                  <Image source={r.image} style={styles.recoImg} />
                  <Text style={styles.recoName} numberOfLines={2}>
                    {r.name}
                  </Text>
                  <View style={styles.recoTime}>
                    <Ionicons name="time-outline" size={13} color={T.muted} />
                    <Text style={styles.recoMins}>{r.mins} mins</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <View style={styles.askNote}>
              <Ionicons name="information-circle" size={15} color={T.amberText} />
              <Text style={styles.askText}>Please ask your partner to add these services</Text>
            </View>
          </Block>
        )}

        <Policy manage={show.manage} onManage={() => setSheet('manage')} />

        <Block>
          <Pressable
            onPress={() => void Linking.openURL(`tel:${TRACK.supportPhone}`)}
            accessibilityRole="button"
            style={styles.rowBetween}
          >
            <View style={styles.flex}>
              <Text style={styles.blockTitle}>Need Help?</Text>
              <Text style={styles.small}>Have some doubts? Get help/support regarding your order(s).</Text>
            </View>
            <View style={styles.plus}>
              <Ionicons name="headset" size={17} color={T.ink} />
            </View>
          </Pressable>
        </Block>

        <Block>
          <Challans
            onCheck={(plate) => toast.show(plate ? `No pending challans for ${plate}` : 'Enter your vehicle number')}
          />
        </Block>

        <Block>
          <Pressable
            onPress={() => router.push('/wash')}
            accessibilityRole="link"
            accessibilityLabel="Explore Hoora car care services"
          >
            <Image
              source={ART.banner}
              style={[styles.banner, { height: ((width - 32) * 402) / 1074 }]}
              resizeMode="cover"
            />
          </Pressable>
        </Block>

        <Faqs />
      </ScrollView>

      <AddOnsSheet
        visible={sheet === 'addOns'}
        added={added}
        onClose={() => setSheet(null)}
        onPay={(ids) => {
          setAdded((a) => [...a, ...ids]);
          setSheet(null);
          toast.show(`${ids.length} add-on${ids.length === 1 ? '' : 's'} added to your booking`);
        }}
      />
      <BillSheet
        visible={sheet === 'bill'}
        service={item.title}
        serviceMrp={mrp}
        servicePrice={item.amount}
        addOns={addOns}
        onClose={() => setSheet(null)}
      />
      <InstructionsSheet
        visible={sheet === 'instructions'}
        onClose={() => setSheet(null)}
        onSubmit={() => {
          setInstructions(true);
          setSheet(null);
          toast.show('Instructions shared with your partner');
        }}
      />
      <RateSheet
        visible={sheet === 'rate'}
        initial={stars}
        title={stage === 'cancelled' ? 'How was your booking experience?' : `How was ${TRACK.partner}’s service?`}
        onClose={() => setSheet(null)}
        onSubmit={(n) => {
          setStars(n);
          setSheet(null);
          toast.show('Thanks for your feedback!');
        }}
      />
      <ManageSheet
        visible={sheet === 'manage'}
        onClose={() => setSheet(null)}
        onReschedule={() => {
          setSheet(null);
          toast.show('Reschedule: pick a new slot — coming soon');
        }}
        onCancel={cancel}
      />
      <Toast toast={toast} bottom={insets.bottom + 24} />
    </View>
  );
}

function HeadSub({ sub, strong, late }: { sub: string; strong?: string; late?: boolean }) {
  return (
    <Text style={styles.headSub} numberOfLines={1}>
      {sub}
      {strong ? <Text style={[styles.headStrong, late && { color: T.gold }]}>{strong}</Text> : null}
    </Text>
  );
}

/** Green "you saved" band under a finished booking's header. */
export function SavedBand({ amount }: { amount: number }) {
  return (
    <LinearGradient colors={T.greenBand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.band}>
      <Image source={ART.starStruck} style={styles.bandEmoji} />
      <Text style={styles.bandText}>
        Congrats! You saved <Text style={styles.bandStrong}>{rupees(amount)}</Text> on this service
      </Text>
    </LinearGradient>
  );
}

/** "Before our partner arrives": what to have ready. */
export function Checklist() {
  return (
    <View style={styles.checklist}>
      {CHECKLIST.map((c, i) => (
        <View key={c.text} style={[styles.checkRow, i > 0 && styles.checkLine]}>
          <Ionicons name={c.icon} size={17} color={T.ink} />
          <Text style={styles.checkText}>{c.text}</Text>
        </View>
      ))}
    </View>
  );
}

function Block({ children }: { children: React.ReactNode }) {
  return <View style={styles.block}>{children}</View>;
}

function Stars({ value, onPick }: { value: number; onPick: (n: number) => void }) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable
          key={n}
          onPress={() => {
            void Haptics.selectionAsync();
            onPick(n);
          }}
          hitSlop={4}
          accessibilityRole="radio"
          accessibilityLabel={`${n} out of 5 stars`}
          accessibilityState={{ selected: n <= value }}
        >
          <Ionicons name={n <= value ? 'star' : 'star-outline'} size={22} color={n <= value ? T.star : '#B9BBC1'} />
        </Pressable>
      ))}
    </View>
  );
}

export function TipCard({ tip, onTip }: { tip: number | null; onTip: (n: number) => void }) {
  const [custom, setCustom] = useState(false);
  const [amount, setAmount] = useState('');
  return (
    <View style={styles.tipCard}>
      <Image source={ART.tip} style={styles.tipArt} resizeMode="contain" />
      <Text style={styles.tipTitle}>A little kindness can{'\n'}make their day</Text>
      <Text style={styles.tipSub}>{tip ? `You tipped ${rupees(tip)}. Thank you!` : 'Say thanks with a tip'}</Text>
      {custom ? (
        <View style={styles.tipCustom}>
          <Text style={styles.tipRupee}>₹</Text>
          <TextInput
            value={amount}
            onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, '').slice(0, 4))}
            placeholder="Enter amount"
            placeholderTextColor={T.faint}
            keyboardType="number-pad"
            autoFocus
            style={styles.tipInput}
          />
          <Pressable
            onPress={() => {
              const n = Number(amount);
              if (n > 0) onTip(n);
              setCustom(false);
            }}
            accessibilityRole="button"
            style={styles.tipGo}
          >
            <Text style={styles.tipGoText}>Tip</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.tipChips}>
          {TIPS.map((n) => (
            <Pressable
              key={n}
              onPress={() => onTip(n)}
              accessibilityRole="button"
              style={[styles.tipChip, tip === n && styles.tipChipOn]}
            >
              <Text style={styles.tipChipText}>{rupees(n)}</Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => setCustom(true)}
            accessibilityRole="button"
            style={[styles.tipChip, styles.tipChipWide]}
          >
            <Text style={styles.tipChipText}>Custom</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function ApplyTip() {
  const [on, setOn] = useState(false);
  return (
    <Pressable
      onPress={() => setOn((v) => !v)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      style={styles.apply}
    >
      <Ionicons name={on ? 'checkbox' : 'square-outline'} size={20} color={T.ink} />
      <Text style={styles.applyText}>Apply this tip to future orders</Text>
    </Pressable>
  );
}

function Policy({ manage, onManage }: { manage: boolean; onManage: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Block>
      <Text style={styles.blockTitle}>Cancellation / Reschedule Policy</Text>
      <Text style={styles.small}>Fee will be charged for last-minute cancellation. No fee before 6 hours.</Text>
      <Pressable onPress={() => setOpen((v) => !v)} accessibilityRole="button">
        <Text style={styles.link}>{open ? 'Hide' : 'Read'} Cancellation / Reschedule Policy</Text>
      </Pressable>
      {open && (
        <Text style={styles.policy}>
          Free to cancel or reschedule up to 6 hours before your slot. Within 6 hours, a ₹49 fee applies. Once the
          partner has arrived, the booking can’t be cancelled. Refunds reach your payment method in 3–5 working days.
        </Text>
      )}
      {manage && (
        <Pressable onPress={onManage} accessibilityRole="button" style={[styles.rowBetween, styles.manage]}>
          <Text style={styles.manageText}>Reschedule Booking / Cancel Booking</Text>
          <Ionicons name="chevron-forward" size={18} color={T.ink} />
        </Pressable>
      )}
    </Block>
  );
}

function Challans({ onCheck }: { onCheck: (plate: string) => void }) {
  const [plate, setPlate] = useState('');
  return (
    <LinearGradient colors={['#EEF4FF', '#FDF9F4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.challan}>
      <Image source={ART.shield} style={styles.shield} resizeMode="contain" />
      <Text style={styles.challanTitle}>Is your vehicle challan-free?</Text>
      <Text style={styles.challanSub}>Check pending challans from official sources before your service starts.</Text>
      <View style={styles.plate}>
        <View style={styles.ind}>
          <Text style={styles.indText}>IND</Text>
        </View>
        <TextInput
          value={plate}
          onChangeText={(t) => setPlate(t.toUpperCase())}
          placeholder="MH 20 AB 1234"
          placeholderTextColor="#B5B8BF"
          autoCapitalize="characters"
          maxLength={13}
          style={styles.plateInput}
        />
      </View>
      <View style={styles.gap12}>
        <YellowButton label="Check Challans" onPress={() => onCheck(plate.trim())} />
      </View>
      <View style={styles.powered}>
        <Text style={styles.poweredText}>Powered by</Text>
        <HooraLogo width={48} />
      </View>
    </LinearGradient>
  );
}

function Faqs() {
  const [all, setAll] = useState(true);
  const [open, setOpen] = useState(0);
  return (
    <View style={[styles.block, styles.blockLast]}>
      <Pressable onPress={() => setAll((v) => !v)} accessibilityRole="button" style={styles.rowBetween}>
        <Text style={styles.blockTitle}>Frequently Asked Questions</Text>
        <Ionicons name={all ? 'chevron-up' : 'chevron-down'} size={20} color={T.ink} />
      </Pressable>
      {all && (
        <View style={styles.faqs}>
          {FAQS.map((f, i) => (
            <Pressable
              key={f.q}
              onPress={() => setOpen(open === i ? -1 : i)}
              accessibilityRole="button"
              accessibilityState={{ expanded: open === i }}
              style={[styles.faq, i > 0 && styles.faqLine]}
            >
              <View style={styles.rowBetween}>
                <Text style={styles.faqQ}>{f.q}</Text>
                <Ionicons name={open === i ? 'chevron-up' : 'chevron-down'} size={18} color={T.ink} />
              </View>
              {open === i && <Text style={styles.faqA}>{f.a}</Text>}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: T.divider,
  },
  flex: {
    flex: 1,
  },
  head: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: T.headBg,
  },
  headBar: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headText: {
    flex: 1,
    alignItems: 'center',
  },
  headSpacer: {
    width: 24,
  },
  headTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: T.ink,
  },
  headSub: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: T.muted,
    textAlign: 'center',
  },
  headStrong: {
    fontFamily: fonts.bold,
    color: T.ink,
  },
  result: {
    alignItems: 'center',
    paddingBottom: 14,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1BA81B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTitle: {
    marginTop: 10,
    fontFamily: fonts.bold,
    fontSize: 21,
    color: T.ink,
  },
  refundBtn: {
    marginTop: 14,
    paddingHorizontal: 16,
    height: 32,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: T.border,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  refundText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: T.ink,
  },
  band: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bandEmoji: {
    width: 20,
    height: 20,
  },
  bandText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#FFFFFF',
  },
  bandStrong: {
    fontFamily: fonts.bold,
  },
  map: {
    width: '100%',
    height: 325,
  },
  block: {
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 18,
    backgroundColor: '#FFFFFF',
  },
  blockLast: {
    marginBottom: 0,
  },
  blockTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: T.ink,
  },
  blockSub: {
    marginTop: 3,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: T.muted,
  },
  small: {
    marginTop: 3,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: T.muted,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stars: {
    flexDirection: 'row',
    gap: 6,
  },
  gap12: {
    marginTop: 12,
  },
  checklist: {
    marginTop: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: T.border,
  },
  checkRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkLine: {
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    borderStyle: 'dashed',
  },
  checkText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: T.ink,
  },
  otp: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 6,
  },
  otpDigit: {
    minWidth: 30,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: T.ink,
    alignItems: 'center',
  },
  otpText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  plus: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  partnerName: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: T.ink,
  },
  pin: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 10,
    color: T.muted,
  },
  pinStrong: {
    fontFamily: fonts.semiBold,
    color: T.ink,
  },
  call: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipCard: {
    marginTop: 16,
    padding: 12,
    minHeight: 132,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: T.border,
    overflow: 'hidden',
  },
  tipArt: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 158,
    height: 132,
  },
  tipTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 19,
    color: T.text,
  },
  tipSub: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: T.muted,
  },
  tipChips: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 8,
  },
  tipChip: {
    flex: 1,
    height: 34,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipChipWide: {
    flex: 1.4,
  },
  tipChipOn: {
    borderColor: T.ink,
    backgroundColor: '#FFF7C2',
  },
  tipChipText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: T.ink,
  },
  tipCustom: {
    marginTop: 14,
    height: 38,
    paddingLeft: 12,
    paddingRight: 4,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipRupee: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: T.ink,
  },
  tipInput: {
    flex: 1,
    marginLeft: 4,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: T.ink,
  },
  tipGo: {
    height: 30,
    paddingHorizontal: 16,
    borderRadius: 15,
    backgroundColor: T.ink,
    justifyContent: 'center',
  },
  tipGoText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  apply: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  applyText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: T.muted,
  },
  address: {
    marginTop: 6,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: T.muted,
  },
  calText: {
    marginLeft: 4,
  },
  dash: {
    marginVertical: 12,
    height: 1,
    borderTopWidth: 1,
    borderColor: '#E6E6E6',
    borderStyle: 'dashed',
  },
  service: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: T.ink,
  },
  extra: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: T.muted,
  },
  billCard: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 0.3,
    borderColor: '#BBBEBF',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  billTitle: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: T.ink,
  },
  billNote: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 10,
    color: T.muted,
  },
  billRight: {
    alignItems: 'flex-end',
  },
  billPrice: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: T.ink,
  },
  mrp: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: T.muted,
    textDecorationLine: 'line-through',
  },
  saved: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: T.green,
  },
  recoScroll: {
    marginHorizontal: -16,
    marginTop: 12,
  },
  reco: {
    paddingHorizontal: 16,
    gap: 8,
  },
  recoCard: {
    width: 100,
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F7F7F7',
  },
  recoImg: {
    width: 88,
    height: 62,
    borderRadius: 6,
  },
  recoName: {
    marginTop: 6,
    minHeight: 30,
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 15,
    color: T.ink,
  },
  recoTime: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  recoMins: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: T.muted,
  },
  askNote: {
    marginTop: 12,
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 6,
    backgroundColor: T.amberBg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  askText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: T.amberText,
  },
  link: {
    marginTop: 6,
    fontFamily: fonts.medium,
    fontSize: 11,
    color: T.ink,
    textDecorationLine: 'underline',
  },
  policy: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: T.muted,
  },
  manage: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: T.border,
  },
  manageText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: T.ink,
  },
  challan: {
    padding: 14,
    borderRadius: 12,
    overflow: 'hidden',
  },
  shield: {
    position: 'absolute',
    right: 12,
    top: 10,
    width: 48,
    height: 53,
  },
  challanTitle: {
    fontFamily: fonts.extraBoldItalic,
    fontSize: 14,
    color: '#0F2A55',
  },
  challanSub: {
    marginTop: 6,
    marginRight: 60,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: '#3D5274',
  },
  plate: {
    marginTop: 14,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0F2A55',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  ind: {
    height: '100%',
    paddingHorizontal: 8,
    backgroundColor: '#E9EEF8',
    justifyContent: 'center',
  },
  indText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: '#1A4FB3',
  },
  plateInput: {
    flex: 1,
    paddingHorizontal: 10,
    fontFamily: fonts.medium,
    fontSize: 13,
    letterSpacing: 0.5,
    color: T.ink,
  },
  powered: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  poweredText: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: T.muted,
  },
  banner: {
    width: '100%',
    borderRadius: 10,
  },
  faqs: {
    marginTop: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  faq: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  faqLine: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  faqQ: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: T.ink,
  },
  faqA: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: T.muted,
  },
});
