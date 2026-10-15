import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddressRow } from '../../components/booking/AddressBar';
import { FormSheet } from '../../components/booking/FormSheet';
import { ContactCard, ContactSheet, useContactOptions } from '../../components/booking/ServiceContact';
import { PolicySheet } from '../../components/booking/BookingSheets';
import { formatPlate } from '../../components/PlateField';
import { Sheet } from '../../components/rewards/ClaimForm';
import { fonts, noBounce } from '../../components/theme';
import { Toast, useToast } from '../../components/Toast';
import { TopBar } from '../../components/TopBar';
import { SavedBand, TipCard } from '../../components/tracking/ServiceTracking';
import { YellowButton } from '../../components/tracking/TrackingSheets';
import { T } from '../../components/tracking/trackTheme';
import { VehiclePhoto } from '../../components/VehiclePhoto';
import {
  BLACK,
  draftPrice,
  serviceStart,
  HOORA_POINTS,
  isValidPlate,
  MULTI_VEHICLE,
  nextDays,
  slotRange,
  SPECIAL_DEAL,
  useDraft,
  washService,
} from '../../data/bookingFlow';
import { setPendingBooking, getPendingBooking, type PendingBooking } from '../../data/pendingBooking';
import { usePlaceBooking } from '../../lib/placeBooking';
import { addressLine, useAppStore } from '../../store/AppStore';

// Checkout (Figma "OD booking - checkout" 11978:4509): review, carcare deal, coupons and points,
// who the partner should contact, more vehicles, tip, bill with Hoora Black, policy, and pay.

const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const OFFER_SECONDS = 10 * 60;

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const draft = useDraft();
  const { selectedCar, location, addresses = [], blackMember, updateCar } = useAppStore();
  const place = usePlaceBooking();
  const svc = washService(draft.serviceId);
  const price = draftPrice(draft);

  const [deal, setDeal] = useState(true);
  const [points, setPoints] = useState(false);
  const [tip, setTip] = useState<number | null>(null);
  const [black, setBlack] = useState(false);
  const [plate, setPlate] = useState(selectedCar?.plate ?? '');
  const [tried, setTried] = useState(false);
  // An address saved "for someone else" carries the receiver; they're the default contact.
  const savedAddress = addresses.find(
    (a) => location && addressLine(a) === location.address && a.tag === location.label,
  );
  const receiver = savedAddress?.contact;
  const contactOptions = useContactOptions(receiver);
  const [contactId, setContactId] = useState(receiver ? 'receiver' : 'me');
  const contact = contactOptions.find((c) => c.id === contactId) ?? contactOptions[0];
  const [sheet, setSheet] = useState<'policy' | 'bill' | 'contact' | 'later' | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [left, setLeft] = useState(OFFER_SECONDS);
  const [today] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  if (!svc) {
    return (
      <View style={styles.screen}>
        <TopBar title="Checkout" topInset={insets.top} onBack={() => router.back()} />
        <Text style={styles.missing}>Pick a service first.</Text>
      </View>
    );
  }

  const [main, ...extras] = price.items;
  const dealAmt = deal ? SPECIAL_DEAL.price : 0;
  const blackAmt = black && !blackMember ? BLACK.price : 0;
  const blackSave = black || blackMember ? BLACK.saves : 0;
  const beforePoints = price.total + dealAmt + (tip ?? 0) + blackAmt - blackSave;
  const pointsAmt = points ? Math.min(HOORA_POINTS, beforePoints) : 0;
  const payable = beforePoints - pointsAmt;
  const saved = price.mrp - price.total + (deal ? SPECIAL_DEAL.mrp - SPECIAL_DEAL.price : 0) + blackSave + pointsAmt;
  const plateOk = isValidPlate(plate);
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');

  const days = nextDays(today);
  const day = days.find((d) => d.iso === draft.date);
  const when = draft.instant ? 'Instant · partner in 30 mins' : `${day?.short ?? ''}, ${slotRange(draft.hour ?? 9)}`;

  const pay = (mode: 'now' | 'later') => {
    setTried(true);
    if (!selectedCar) {
      toast.show('Add your vehicle first');
      router.push('/add-car');
      return;
    }
    if (!plateOk) {
      toast.show('Enter a valid vehicle number');
      return;
    }
    if (!location) {
      router.push('/address');
      return;
    }
    if (formatPlate(plate) !== selectedCar.plate) updateCar(selectedCar.id, { plate: formatPlate(plate) });
    const start = serviceStart(draft);
    const iso = draft.instant ? days[0].iso : (draft.date ?? days[0].iso);
    const slot = draft.instant ? 'In 30 mins' : slotRange(draft.hour ?? 9);
    const title = draft.plan === 'package' ? main.name : svc.name;
    const pending: PendingBooking = {
      booking: {
        serviceId: svc.id,
        title,
        car: { ...selectedCar, plate: formatPlate(plate) },
        date: iso,
        slot,
        address: `${location.label} - ${location.address}`,
        addOnIds: draft.addOns,
        total: payable,
        bookedFor: receiver,
        contact: {
          name: contact.name,
          phone: contact.phone,
          role: contact.id === 'me' ? 'You' : contact.id === 'receiver' ? 'Booked for' : (contact.tag ?? 'Contact'),
        },
      },
      notif: {
        service: title,
        vehicle: [selectedCar.brandName, selectedCar.model].filter(Boolean).join(' '),
        expert: 'Your expert',
        when: draft.instant ? 'in 30 minutes' : `${day?.short ?? 'today'} at ${slot}`,
        slot,
        amount: payable,
      },
      start,
      payable,
      saved,
      kind: draft.plan === 'package' ? 'Package Booking' : 'Wash Booking',
    };
    setPendingBooking(pending);
    if (mode === 'now') router.push('/booking/pay');
    else setSheet('later');
  };

  return (
    <View style={styles.screen}>
      <TopBar title="Checkout" topInset={insets.top} onBack={() => router.back()} />
      <ScrollView {...noBounce} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }}>
        <SavedBand amount={saved} />

        {/* Review items */}
        <Block title="Review Items">
          {selectedCar && (
            <View style={styles.vehicleRow}>
              <Ionicons name={selectedCar.type === 'bike' ? 'bicycle' : 'car-sport'} size={20} color="#E2A400" />
              <Text style={styles.vehicleName}>
                {[selectedCar.brandName, selectedCar.model].filter(Boolean).join(' ') || 'My Bike'}
              </Text>
            </View>
          )}
          <View style={styles.reviewRow}>
            <Text style={styles.reviewName}>{main.name}</Text>
            <Text style={styles.reviewPrice}>{rupees(price.total)}</Text>
          </View>
          {(showAll ? extras : extras.slice(0, 2)).map((e) => (
            <Text key={e.id} style={styles.bullet}>
              • {e.name}
            </Text>
          ))}
          {extras.length > 2 && (
            <Pressable onPress={() => setShowAll((v) => !v)} hitSlop={6} accessibilityRole="button">
              <Text style={styles.more}>{showAll ? 'Show less' : `+${extras.length - 2}more`}</Text>
            </Pressable>
          )}
        </Block>

        {/* Special deal */}
        <Block title="Need Some Carcare Add-on">
          <View style={styles.deal}>
            <View style={styles.dealHead}>
              <Text style={styles.dealTitle}>
                <Text style={styles.special}>SPECIAL</Text> Deal
              </Text>
              <View style={styles.timer}>
                <Text style={styles.timerText}>
                  Offer Valid for <Text style={styles.bold}>{`${mm}:${ss}`} min</Text>
                </Text>
              </View>
            </View>
            <View style={styles.dealItems}>
              {SPECIAL_DEAL.items.map((it) => (
                <View key={it.name} style={styles.dealItem}>
                  <View style={styles.dealImgWrap}>
                    <Image source={it.image} style={styles.dealImg} resizeMode="contain" />
                  </View>
                  <Text style={styles.dealName} numberOfLines={2}>
                    {it.name}
                  </Text>
                </View>
              ))}
            </View>
            <View style={styles.dealFoot}>
              <View style={styles.flex}>
                <Text style={styles.dealAll}>Get all 3 at just</Text>
                <Text style={styles.dealPrice}>
                  {rupees(SPECIAL_DEAL.price)} <Text style={styles.strike}>{rupees(SPECIAL_DEAL.mrp)}</Text>{' '}
                  <Text style={styles.dealOff}> 50% OFF </Text>
                </Text>
              </View>
              <Pressable
                onPress={() => setDeal((d) => !d)}
                accessibilityRole="button"
                style={[styles.dealBtn, !deal && styles.dealBtnAdd]}
              >
                <Text style={styles.dealBtnText}>{deal ? 'Remove' : 'Add'}</Text>
              </Pressable>
            </View>
          </View>
        </Block>

        {/* Coupons and points */}
        <View style={styles.block}>
          <Pressable
            onPress={() => toast.show('No coupons available right now')}
            accessibilityRole="button"
            style={styles.line}
          >
            <Ionicons name="pricetag-outline" size={20} color="#E5322D" />
            <Text style={styles.lineText}>Apply Coupons/Referral</Text>
            <Text style={styles.lineMuted}>0 Available</Text>
            <Ionicons name="chevron-forward" size={18} color={T.ink} />
          </Pressable>
          <View style={styles.dashed} />
          <Pressable
            onPress={() => setPoints((p) => !p)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: points }}
            style={styles.line}
          >
            <View style={styles.coin}>
              <Text style={styles.coinText}>H</Text>
            </View>
            <Text style={styles.lineText}>Hoora Points</Text>
            <Ionicons name={points ? 'checkbox' : 'square-outline'} size={22} color={T.ink} />
            <Text style={styles.pointsNum}>{HOORA_POINTS}</Text>
          </Pressable>
        </View>

        {/* Service access details */}
        <Block
          title="Service Access Details"
          sub="Help our partner contact the right person and locate your car easily."
        >
          {selectedCar ? (
            <View style={styles.carCard}>
              <VehiclePhoto vehicle={selectedCar} width={56} height={36} />
              <View style={styles.flex}>
                <Text style={styles.carName}>
                  {[selectedCar.brandName, selectedCar.model].filter(Boolean).join(' ') || 'My Bike'}
                </Text>
                <Text style={styles.carMeta}>{selectedCar.body || (selectedCar.type === 'bike' ? 'Bike' : 'Car')}</Text>
              </View>
            </View>
          ) : (
            <Pressable onPress={() => router.push('/add-car')} style={styles.carCard} accessibilityRole="button">
              <Ionicons name="add-circle-outline" size={22} color={T.ink} />
              <Text style={styles.carName}>Add your vehicle</Text>
            </Pressable>
          )}
          <Text style={styles.label}>Vehicle number</Text>
          <View style={[styles.plate, tried && !plateOk && styles.plateErr]}>
            <View style={styles.ind}>
              <Text style={styles.indText}>IND</Text>
            </View>
            <TextInput
              value={plate}
              onChangeText={(t) => setPlate(t.toUpperCase())}
              placeholder="Enter vehicle number"
              placeholderTextColor={T.faint}
              autoCapitalize="characters"
              maxLength={13}
              style={styles.plateInput}
            />
          </View>
          {tried && !plateOk && <Text style={styles.err}>Enter a valid vehicle number (e.g. MH02AB1234)</Text>}
          {receiver ? (
            <View style={styles.forRow}>
              <Ionicons name="people-outline" size={15} color={T.ink} />
              <Text style={styles.forText}>
                Booking for <Text style={styles.bold}>{receiver.name}</Text> (from your saved address)
              </Text>
            </View>
          ) : null}
          <Text style={styles.label}>Contact for this service</Text>
          <ContactCard contact={contact} onChange={() => setSheet('contact')} />
        </Block>

        {/* More vehicles */}
        <View style={styles.multi}>
          <View style={styles.multiTitle}>
            <Text style={styles.multiTitleText}>
              Add Another vehicle & <Text style={styles.saveWord}>SAVE</Text>
            </Text>
          </View>
          <Text style={styles.multiSub}>“0” doorstep fee on other vehicles</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.multiScroll}
            contentContainerStyle={styles.multiRow}
          >
            {MULTI_VEHICLE.map((p, i) => (
              <Pressable
                key={p}
                onPress={() => (i === 0 ? undefined : router.push('/add-car'))}
                accessibilityRole="button"
                style={[styles.multiCard, i === 0 && styles.multiCardOn]}
              >
                {i > 0 && (
                  <View style={styles.multiPlus}>
                    <Ionicons name="add" size={14} color="#FFFFFF" />
                  </View>
                )}
                <Ionicons name="car" size={22} color="#1D4ED8" />
                <Text style={styles.multiCount}>
                  {i + 1} Vehicle{i ? 's' : ''}
                </Text>
                <View style={styles.multiPrice}>
                  <Text style={styles.multiPriceText}>~{rupees(p)}</Text>
                  <Text style={styles.multiPer}>Per Vehicle</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable onPress={() => router.push('/add-car')} accessibilityRole="button" style={styles.addAnother}>
            <Text style={styles.addAnotherText}>Add another Car/Bike</Text>
          </Pressable>
        </View>

        <View style={styles.block}>
          <TipCard tip={tip} onTip={setTip} />
        </View>

        {/* Bill */}
        <View style={styles.block}>
          <View style={styles.bill}>
            <Pressable onPress={() => setSheet('bill')} accessibilityRole="button" style={styles.billTop}>
              <View style={styles.flex}>
                <Text style={styles.billTitle}>Total Bill</Text>
                <Text style={styles.billNote}>Incl. taxes & charges</Text>
              </View>
              <View style={styles.billRight}>
                <Text style={styles.billPrice}>
                  <Text style={styles.strike}>{rupees(payable + saved)}</Text> {rupees(payable)}
                </Text>
                <Text style={styles.savedText}>You Saved {rupees(saved)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={T.ink} />
            </Pressable>
            {!blackMember && (
              <View style={styles.blackBox}>
                <View style={styles.blackRow}>
                  <View style={styles.flex}>
                    <Text style={styles.blackName}>
                      <Text style={styles.hMark}>H</Text> HOORA <Text style={styles.blackItalic}>BLACK</Text>
                    </Text>
                    <Text style={styles.blackFor}>for 12 months</Text>
                  </View>
                  <View style={styles.blackPrice}>
                    <Text style={styles.blackNow}>{rupees(BLACK.price)}</Text>
                    <Text style={styles.strike}>{rupees(BLACK.mrp)}</Text>
                  </View>
                  <Pressable onPress={() => setBlack((b) => !b)} accessibilityRole="button" style={styles.blackAdd}>
                    <Text style={styles.blackAddText}>{black ? 'Added' : 'Add'}</Text>
                  </Pressable>
                </View>
                <View style={styles.blackStrip}>
                  <Text style={styles.blackStripText}>
                    Save <Text style={styles.yellow}>{rupees(BLACK.saves)}</Text> more on this booking with{' '}
                    <Text style={styles.yellowItalic}>HOORA BLACK</Text>
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <Block title="Review before you pay">
          {[
            { icon: 'water-outline' as const, label: 'Service', value: main.name },
            {
              icon: 'car-outline' as const,
              label: 'Vehicle',
              value: selectedCar
                ? `${[selectedCar.brandName, selectedCar.model].filter(Boolean).join(' ') || 'My Bike'}${
                    plateOk ? ` · ${formatPlate(plate)}` : ''
                  }`
                : 'Add your vehicle',
            },
            { icon: 'time-outline' as const, label: 'When', value: when },
            {
              icon: 'location-outline' as const,
              label: 'Where',
              value: location ? `${location.label} - ${location.address}` : 'Add an address',
            },
            {
              icon: 'call-outline' as const,
              label: 'Contact',
              value: `${contact.id === 'me' ? 'You' : contact.name}${
                contact.id !== 'me' && contact.tag ? ` (${contact.tag})` : ''
              } · +91 ${contact.phone}`,
            },
          ].map((r, i) => (
            <View key={r.label} style={[styles.reviewLine, i > 0 && styles.reviewGap]}>
              <Ionicons name={r.icon} size={15} color={T.muted} />
              <Text style={styles.reviewLabel}>{r.label}</Text>
              <Text style={styles.reviewValue} numberOfLines={2}>
                {r.value}
              </Text>
            </View>
          ))}
        </Block>

        <Block title="Cancellation / Reschedule Policy">
          <Text style={styles.small}>
            ₹99 cancellation fee applies. Free cancellations for Hoora Black users. Rescheduling terms apply
          </Text>
          <Pressable onPress={() => setSheet('policy')} accessibilityRole="button">
            <Text style={styles.link}>Read Cancellation / Reschedule Policy</Text>
          </Pressable>
        </Block>
      </ScrollView>

      {/* Footer: where, when, pay */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <AddressRow />
        <Pressable onPress={() => router.back()} accessibilityRole="button" style={styles.whenRow}>
          <Ionicons name="time-outline" size={17} color={T.ink} />
          <Text style={styles.whenText}>{when}</Text>
          <Ionicons name="pencil" size={15} color={T.ink} />
        </Pressable>
        <View style={styles.payBar}>
          <Pressable onPress={() => setSheet('bill')} accessibilityRole="button" style={styles.total}>
            <Text style={styles.totalText}>
              {rupees(payable)} <Ionicons name="chevron-down" size={14} color={T.text} />
            </Text>
            <Text style={styles.totalSaved}>Saved {rupees(saved)}</Text>
          </Pressable>
          <Pressable
            onPress={() => pay('later')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.later, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.laterText}>Pay Later</Text>
          </Pressable>
          <Pressable
            onPress={() => pay('now')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.nowWrap, pressed && { opacity: 0.85 }]}
          >
            <LinearGradient colors={T.yellow} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.now}>
              <Text style={styles.nowText}>Pay Now</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>

      <ContactSheet
        visible={sheet === 'contact'}
        options={contactOptions}
        selected={contact.id}
        onClose={() => setSheet(null)}
        onSelect={(id) => {
          setContactId(id);
          setSheet(null);
        }}
      />

      <FormSheet
        visible={sheet === 'later'}
        title="Pay after your wash"
        subtitle={`Book now and pay ${rupees(payable)} once the service is done.`}
        onClose={() => setSheet(null)}
        footer={
          <YellowButton
            label="Confirm booking"
            onPress={() => {
              const pending = getPendingBooking();
              setSheet(null);
              if (pending) place(pending, { later: true });
            }}
          />
        }
      >
        <View style={styles.laterPoints}>
          {[
            'No advance payment needed',
            'Pay by UPI, card or cash after the wash',
            'Same price and offers as Pay Now',
          ].map((t) => (
            <View key={t} style={styles.laterPoint}>
              <Ionicons name="checkmark-circle" size={16} color={T.green} />
              <Text style={styles.laterPointText}>{t}</Text>
            </View>
          ))}
        </View>
        <Pressable
          onPress={() => {
            setSheet(null);
            router.push('/booking/pay');
          }}
          accessibilityRole="button"
          style={styles.laterAlt}
        >
          <Text style={styles.laterAltText}>Pay now instead</Text>
        </Pressable>
      </FormSheet>
      <PolicySheet
        visible={sheet === 'policy'}
        onClose={() => setSheet(null)}
        onBlack={() => {
          setBlack(true);
          setSheet(null);
          toast.show('Hoora Black added to this booking');
        }}
      />
      <Sheet visible={sheet === 'bill'} onClose={() => setSheet(null)}>
        <Text style={styles.sheetTitle}>Payment Summary</Text>
        <BillRow label={main.name} value={rupees(price.mrp)} />
        <BillRow label="Discount" value={`−${rupees(price.mrp - price.total)}`} green />
        {deal && <BillRow label="Special Deal (3 items)" value={rupees(SPECIAL_DEAL.price)} />}
        {!!tip && <BillRow label="Tip for your partner" value={rupees(tip)} />}
        {blackAmt > 0 && <BillRow label="Hoora Black · 12 months" value={rupees(blackAmt)} />}
        {blackSave > 0 && <BillRow label="Hoora Black saving" value={`−${rupees(blackSave)}`} green />}
        {pointsAmt > 0 && <BillRow label="Hoora Points" value={`−${rupees(pointsAmt)}`} green />}
        <BillRow label="Doorstep fee" value="FREE" green />
        <View style={styles.billLine} />
        <BillRow label="To pay (incl. taxes)" value={rupees(payable)} bold />
        <Pressable onPress={() => setSheet(null)} accessibilityRole="button" style={styles.okay}>
          <Text style={styles.okayText}>OKAY</Text>
        </Pressable>
      </Sheet>
      <Toast toast={toast} bottom={insets.bottom + 170} />
    </View>
  );
}

function Block({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>{title}</Text>
      {sub ? <Text style={styles.blockSub}>{sub}</Text> : null}
      <View style={styles.blockBody}>{children}</View>
    </View>
  );
}

function BillRow({ label, value, bold, green }: { label: string; value: string; bold?: boolean; green?: boolean }) {
  return (
    <View style={styles.billRow}>
      <Text style={[styles.billLabel, bold && styles.billBold]} numberOfLines={2}>
        {label}
      </Text>
      <Text style={[styles.billValue, bold && styles.billBold, green && { color: T.green }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F3F3F3',
  },
  flex: {
    flex: 1,
  },
  bold: {
    fontFamily: fonts.bold,
  },
  missing: {
    margin: 24,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: T.muted,
  },
  block: {
    marginBottom: 8,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  blockTitle: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: T.text,
  },
  blockSub: {
    marginTop: 3,
    fontFamily: fonts.regular,
    fontSize: 10.5,
    color: T.muted,
  },
  blockBody: {
    marginTop: 14,
  },
  vehicleRow: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  vehicleName: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: T.text,
  },
  reviewRow: {
    flexDirection: 'row',
    gap: 12,
  },
  reviewName: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 19,
    color: T.text,
  },
  reviewPrice: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: T.text,
  },
  bullet: {
    marginTop: 6,
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: T.muted,
  },
  more: {
    marginTop: 6,
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: '#1A5FD0',
    textDecorationLine: 'underline',
  },
  deal: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  dealHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dealTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: T.text,
  },
  special: {
    color: '#E5322D',
  },
  timer: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    backgroundColor: '#1BA81B',
  },
  timerText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: '#FFFFFF',
  },
  dealItems: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
  },
  dealItem: {
    flex: 1,
    alignItems: 'center',
  },
  dealImgWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: '#FFF8D8',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  dealImg: {
    width: '100%',
    height: '100%',
  },
  dealName: {
    marginTop: 6,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 12,
    color: T.text,
  },
  dealFoot: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dealAll: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: T.text,
  },
  dealPrice: {
    marginTop: 2,
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: T.text,
  },
  strike: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: T.muted,
    textDecorationLine: 'line-through',
  },
  dealOff: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: '#FFFFFF',
    backgroundColor: '#1BA81B',
  },
  dealBtn: {
    height: 40,
    paddingHorizontal: 26,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: T.text,
    justifyContent: 'center',
  },
  dealBtnAdd: {
    borderColor: '#FFE300',
    backgroundColor: '#FFE300',
  },
  dealBtnText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: T.text,
  },
  line: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lineText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: T.text,
  },
  lineMuted: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: T.muted,
  },
  dashed: {
    marginVertical: 8,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E3E3E3',
  },
  coin: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F5B800',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinText: {
    fontFamily: fonts.extraBold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  pointsNum: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: T.text,
  },
  carCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F2D98A',
    backgroundColor: '#FFFCF0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  carName: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: T.text,
  },
  carMeta: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: T.muted,
  },
  label: {
    marginTop: 16,
    marginBottom: 8,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: T.text,
  },
  plate: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E3E5E9',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  plateErr: {
    borderColor: '#E5322D',
  },
  ind: {
    width: 56,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: T.text,
  },
  plateInput: {
    flex: 1,
    paddingHorizontal: 14,
    fontFamily: fonts.medium,
    fontSize: 15,
    letterSpacing: 0.5,
    color: T.text,
  },
  err: {
    marginTop: 6,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#E5322D',
  },
  contact: {
    height: 50,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E3E5E9',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contactText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: T.text,
  },
  hint: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  hintText: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: T.muted,
  },
  multi: {
    marginBottom: 8,
    paddingVertical: 18,
    backgroundColor: '#FFF6D8',
    alignItems: 'center',
  },
  multiTitle: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#111111',
  },
  multiTitleText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  saveWord: {
    fontFamily: fonts.extraBold,
    fontSize: 17,
    color: '#FFE300',
  },
  multiSub: {
    marginTop: 8,
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: T.text,
  },
  multiScroll: {
    alignSelf: 'stretch',
  },
  multiRow: {
    paddingHorizontal: 16,
    paddingTop: 22,
    gap: 12,
  },
  multiCard: {
    width: 102,
    paddingTop: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E3E5E9',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    overflow: 'visible',
  },
  multiCardOn: {
    borderColor: '#1D4ED8',
    borderWidth: 1.5,
  },
  multiPlus: {
    position: 'absolute',
    top: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  multiCount: {
    marginTop: 4,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: T.text,
  },
  multiPrice: {
    marginTop: 8,
    alignSelf: 'stretch',
    paddingVertical: 5,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
  multiPriceText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#FFFFFF',
  },
  multiPer: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: '#FFFFFF',
  },
  addAnother: {
    marginTop: 16,
    alignSelf: 'stretch',
    marginHorizontal: 16,
    height: 46,
    borderRadius: 6,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAnotherText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  bill: {
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#BBBEBF',
    overflow: 'hidden',
  },
  billTop: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  billTitle: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: T.text,
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
    fontSize: 17,
    color: T.text,
  },
  savedText: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: T.green,
  },
  blackBox: {
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F2D98A',
    backgroundColor: '#FFFCF0',
    overflow: 'hidden',
  },
  blackRow: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  blackName: {
    fontFamily: fonts.extraBold,
    fontSize: 14,
    color: T.text,
  },
  hMark: {
    color: '#E2A400',
  },
  blackItalic: {
    fontFamily: fonts.extraBoldItalic,
  },
  blackFor: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: T.ink,
  },
  blackPrice: {
    alignItems: 'flex-end',
  },
  blackNow: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: T.text,
  },
  blackAdd: {
    height: 30,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#FFE300',
    justifyContent: 'center',
  },
  blackAddText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: T.text,
  },
  blackStrip: {
    paddingVertical: 8,
    backgroundColor: '#141414',
    alignItems: 'center',
  },
  blackStripText: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: '#FFFFFF',
  },
  yellow: {
    fontFamily: fonts.bold,
    color: '#FFE300',
  },
  yellowItalic: {
    fontFamily: fonts.extraBoldItalic,
    color: '#FFE300',
  },
  small: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 16,
    color: T.muted,
  },
  link: {
    marginTop: 6,
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: T.ink,
    textDecorationLine: 'underline',
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E3E5E9',
    backgroundColor: '#FFFFFF',
  },
  whenRow: {
    minHeight: 38,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EEEEEE',
  },
  whenText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: T.text,
  },
  payBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  total: {
    minWidth: 72,
  },
  totalText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: T.text,
  },
  totalSaved: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: T.green,
  },
  later: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D9DBE0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  laterText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: T.text,
  },
  nowWrap: {
    flex: 1,
  },
  now: {
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nowText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: T.text,
  },
  forRow: {
    marginTop: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F7F8FA',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  forText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: T.ink,
  },
  confirmCard: {
    marginTop: 14,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F7F7F8',
  },
  confirmHead: {
    marginTop: 18,
    marginBottom: -4,
    fontFamily: fonts.semiBold,
    fontSize: 13.5,
    color: T.text,
  },
  reviewGap: {
    marginTop: 10,
  },
  confirmFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  confirmAmount: {
    fontFamily: fonts.semiBold,
    fontSize: 17,
    color: T.text,
  },
  confirmWhen: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: T.muted,
  },
  reviewLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  reviewLabel: {
    width: 92,
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: T.muted,
  },
  reviewValue: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12.5,
    lineHeight: 17,
    color: T.text,
  },
  laterIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: 12,
    backgroundColor: '#FFF1D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  laterBody: {
    marginTop: -4,
    fontFamily: fonts.regular,
    fontSize: 13.5,
    lineHeight: 20,
    color: T.ink,
  },
  laterPoints: {
    marginTop: 14,
    gap: 10,
  },
  laterPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  laterPointText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: T.text,
  },
  laterCta: {
    marginTop: 20,
  },
  laterAlt: {
    alignSelf: 'center',
    paddingVertical: 14,
  },
  laterAltText: {
    fontFamily: fonts.semiBold,
    fontSize: 13.5,
    color: '#1A5FD0',
  },
  sheetTitle: {
    marginBottom: 12,
    fontFamily: fonts.bold,
    fontSize: 17,
    color: T.text,
  },
  billRow: {
    paddingVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  billLabel: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: T.muted,
  },
  billValue: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: T.text,
  },
  billBold: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: T.text,
  },
  billLine: {
    marginVertical: 6,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#DDDDDD',
  },
  okay: {
    marginTop: 18,
    height: 48,
    borderRadius: 8,
    backgroundColor: T.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  okayText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    letterSpacing: 0.5,
    color: '#FFFFFF',
  },
});
