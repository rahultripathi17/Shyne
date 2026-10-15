import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, LayoutAnimation, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddressBar } from '../components/booking/AddressBar';
import { PlanSheet, ServiceDetailsSheet, SocietySheet, UpgradeSheet } from '../components/booking/BookingSheets';
import { fonts, noBounce } from '../components/theme';
import { Toast, useToast } from '../components/Toast';
import { T } from '../components/tracking/trackTheme';
import { VehicleSheet } from '../components/VehicleSheet';
import {
  setDraft,
  SOCIETY_PACKS,
  type VehicleKind,
  WASH_SERVICES,
  washService,
  type WashService,
} from '../data/bookingFlow';
import { useAppStore } from '../store/AppStore';

// Car Services (Figma "New flow 02/08/2026" + live app): address at the top like Home, Car/Bike,
// Regular Services or Society Package, and each service opens in place to build it and pick a plan.

const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;
type Society = 'bike' | 'car' | 'soon' | null;

export default function CarServicesScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { cars, selectedCar, location } = useAppStore();
  const [kind, setKind] = useState<VehicleKind>(selectedCar?.type ?? 'car');
  const [tab, setTab] = useState<'regular' | 'society'>('regular');
  const [open, setOpen] = useState<string | null>(null);
  const [picked, setPicked] = useState<Record<string, string[]>>({});
  const [vehiclesOpen, setVehiclesOpen] = useState(false);
  const [details, setDetails] = useState<WashService | undefined>();
  const [planFor, setPlanFor] = useState<string | null>(null);
  const [upgrade, setUpgrade] = useState(false);
  const [society, setSociety] = useState<Society>(null);

  const services = WASH_SERVICES.filter((s) => s.kind === kind);
  const addOnsOf = (s: WashService) => picked[s.id] ?? s.addOns.filter((a) => a.on).map((a) => a.id);
  const priceOf = (s: WashService) =>
    s.base.price + s.addOns.filter((a) => addOnsOf(s).includes(a.id)).reduce((t, a) => t + a.price, 0);

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((o) => (o === id ? null : id));
  };

  const switchKind = (k: VehicleKind) => {
    void Haptics.selectionAsync();
    setKind(k);
    setOpen(null);
    if (tab === 'society' && k === 'bike') setSociety('bike');
  };

  const openSociety = () => {
    setTab('society');
    if (kind === 'bike') setSociety(cars.some((c) => c.type === 'car') ? 'bike' : 'car');
    else if (!location) setSociety('soon');
  };

  const bookOnce = (s: WashService) => {
    setDraft({
      kind,
      serviceId: s.id,
      addOns: addOnsOf(s),
      plan: 'one-time',
      instant: true,
      date: undefined,
      hour: undefined,
    });
    if (s.id === 'basic') setUpgrade(true);
    else router.push('/booking/slot');
  };

  const basic = washService('basic')!;
  const premium = washService('premium')!;
  const premiumPrice = premium.base.price + premium.addOns.filter((a) => a.on).reduce((t, a) => t + a.price, 0);

  return (
    <View style={styles.screen}>
      <View style={[styles.top, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={24} color={T.text} />
          </Pressable>
          <Text style={styles.title}>{kind === 'car' ? 'Car' : 'Bike'} Services</Text>
          <Pressable
            onPress={() => setVehiclesOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Change vehicle"
            style={styles.vehicle}
          >
            <View style={styles.vehicleText}>
              <Text style={styles.vehicleModel} numberOfLines={1}>
                {selectedCar ? selectedCar.model || 'My Bike' : 'Add vehicle'}
              </Text>
              {selectedCar?.brandName ? <Text style={styles.vehicleBrand}>{selectedCar.brandName}</Text> : null}
            </View>
            <MaterialCommunityIcons
              name={selectedCar?.type === 'bike' ? 'motorbike' : 'car-side'}
              size={24}
              color={T.text}
            />
          </Pressable>
        </View>
        <AddressBar />
      </View>

      <ScrollView {...noBounce} stickyHeaderIndices={[1]} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <View style={styles.kindWrap}>
          <View style={styles.kinds}>
            {(['car', 'bike'] as const).map((k) => {
              const on = kind === k;
              return (
                <Pressable
                  key={k}
                  onPress={() => switchKind(k)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  style={[styles.kind, on && styles.kindOn]}
                >
                  <MaterialCommunityIcons
                    name={k === 'car' ? 'car' : 'moped'}
                    size={18}
                    color={on ? '#FFFFFF' : T.text}
                  />
                  <Text style={[styles.kindText, on && styles.kindTextOn]}>{k === 'car' ? 'Car' : 'Bike'}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.tabs}>
          <Pressable
            onPress={() => setTab('regular')}
            accessibilityRole="tab"
            style={[styles.tab, tab === 'regular' && styles.tabOn]}
          >
            <Text style={[styles.tabText, tab === 'regular' && styles.tabTextOn]}>Regular Services</Text>
          </Pressable>
          <Pressable
            onPress={openSociety}
            accessibilityRole="tab"
            style={[styles.tab, tab === 'society' && styles.tabOn]}
          >
            <Text style={[styles.tabText, tab === 'society' && styles.tabTextOn]}>Society Package</Text>
            <View style={styles.off}>
              <Text style={styles.offText}>70% OFF</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.list}>
          {tab === 'regular' &&
            services.map((s) =>
              open === s.id ? (
                <ExpandedCard
                  key={s.id}
                  service={s}
                  picked={addOnsOf(s)}
                  price={priceOf(s)}
                  onCollapse={() => toggle(s.id)}
                  onPick={(ids) => setPicked((p) => ({ ...p, [s.id]: ids }))}
                  onDetails={() => setDetails(s)}
                  onMonthly={() => setPlanFor(s.id)}
                  onOnce={() => bookOnce(s)}
                  onWatch={() => toast.show('Video coming soon')}
                />
              ) : (
                <Pressable
                  key={s.id}
                  onPress={() => toggle(s.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`${s.name}, starts at ${rupees(s.from)}`}
                  style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
                >
                  <Image source={s.image} style={styles.cardImg} resizeMode="cover" />
                  <View style={[styles.cardFoot, { backgroundColor: s.tint }]}>
                    <View style={styles.flex}>
                      <Text style={styles.cardName}>{s.name}</Text>
                      <Text style={styles.cardMeta}>
                        Starts at <Text style={styles.cardPrice}>{rupees(s.from)}</Text> •{' '}
                        <Ionicons name="star" size={13} color={T.star} /> {s.rating}{' '}
                        <Text style={styles.cardRatings}>({s.ratings} ratings)</Text>
                      </Text>
                    </View>
                    <Ionicons name="chevron-down" size={20} color={T.text} />
                  </View>
                </Pressable>
              ),
            )}

          {tab === 'society' &&
            kind === 'car' &&
            SOCIETY_PACKS.map((p) => (
              <View key={p.id} style={styles.card}>
                <Image source={p.image} style={styles.cardImg} resizeMode="cover" />
                <View style={[styles.socFoot, { backgroundColor: p.tint }]}>
                  <View style={styles.socTop}>
                    <View style={styles.flex}>
                      <Text style={styles.cardName}>{p.name}</Text>
                      <Text style={styles.socPrice}>
                        {rupees(p.price)} <Text style={styles.mrp}>{rupees(p.mrp)}</Text>{' '}
                        <Text style={styles.offGreen}>{Math.round((1 - p.price / p.mrp) * 100)}% OFF</Text>
                      </Text>
                      <Text style={styles.socRating}>
                        <Ionicons name="star" size={12} color={T.star} /> {p.rating}{' '}
                        <Text style={styles.cardRatings}>({p.ratings} ratings)</Text>
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => setPlanFor(p.id === 'soc-basic' ? 'basic' : 'premium')}
                      accessibilityRole="button"
                      style={styles.choose}
                    >
                      <Text style={styles.chooseText}>Choose Plan</Text>
                    </Pressable>
                  </View>
                  <View style={styles.socLine} />
                  <View style={styles.includes}>
                    {p.includes.map((i) => (
                      <Text key={i} style={styles.include}>
                        • {i}
                      </Text>
                    ))}
                  </View>
                </View>
              </View>
            ))}
          {tab === 'society' && kind === 'bike' && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Society Packages are available for cars only.</Text>
              <Pressable onPress={() => switchKind('car')} accessibilityRole="button">
                <Text style={styles.emptyLink}>View Car Society Packages</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      <VehicleSheet visible={vehiclesOpen} onClose={() => setVehiclesOpen(false)} />
      <ServiceDetailsSheet visible={!!details} service={details} onClose={() => setDetails(undefined)} />
      <PlanSheet
        visible={!!planFor}
        onClose={() => setPlanFor(null)}
        onContinue={(period, freq) => {
          const s = washService(planFor ?? undefined);
          setPlanFor(null);
          if (!s) return;
          setDraft({ kind, serviceId: s.id, addOns: addOnsOf(s), plan: 'package', period, freq, instant: false });
          router.push('/booking/slot');
        }}
      />
      <UpgradeSheet
        visible={upgrade}
        basic={basic}
        premium={premium}
        basicPrice={priceOf(basic)}
        premiumPrice={premiumPrice}
        onClose={() => setUpgrade(false)}
        onUpgrade={() => {
          setUpgrade(false);
          setDraft({ serviceId: 'premium', addOns: premium.addOns.filter((a) => a.on).map((a) => a.id) });
          router.push('/booking/slot');
        }}
        onKeep={() => {
          setUpgrade(false);
          router.push('/booking/slot');
        }}
      />
      <SocietySheet
        visible={!!society}
        variant={society ?? 'bike'}
        onClose={() => setSociety(null)}
        onCta={() => {
          const v = society;
          setSociety(null);
          if (v === 'bike') switchKind('car');
          else if (v === 'car') router.push('/add-car');
          else setTab('regular');
        }}
        onAlt={() => {
          const v = society;
          setSociety(null);
          if (v === 'soon') router.push('/address');
          else setTab('regular');
        }}
      />
      <Toast toast={toast} bottom={insets.bottom + 24} />
    </View>
  );
}

function ExpandedCard({
  service: s,
  picked,
  price,
  onCollapse,
  onPick,
  onDetails,
  onMonthly,
  onOnce,
  onWatch,
}: {
  service: WashService;
  picked: string[];
  price: number;
  onCollapse: () => void;
  onPick: (ids: string[]) => void;
  onDetails: () => void;
  onMonthly: () => void;
  onOnce: () => void;
  onWatch: () => void;
}) {
  const [more, setMore] = useState(false);
  const recommended = s.addOns.filter((a) => a.on).map((a) => a.id);
  const isRecommended = recommended.length > 0 && recommended.every((id) => picked.includes(id));
  const visible = more ? s.addOns : s.addOns.slice(0, s.shown);
  const hidden = s.addOns.length - s.shown;
  // Package price per wash, and the one-time price spread over a month (SAMPLE maths).
  const perWash = Math.round(price * 0.22);
  const perDay = Math.max(9, Math.round((price / 30) * 1.4));
  const toggleItem = (id: string) => {
    void Haptics.selectionAsync();
    onPick(picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]);
  };

  return (
    <View style={styles.exp}>
      <Pressable onPress={onCollapse} accessibilityRole="button" style={styles.expHead}>
        <Text style={styles.expTitle}>{s.name}</Text>
        <Ionicons name="chevron-up" size={20} color={T.text} />
      </Pressable>

      <View style={styles.expBody}>
        <View style={styles.rowBetween}>
          <Text style={styles.make}>Make Your Service</Text>
          <Pressable onPress={onDetails} accessibilityRole="button" style={styles.details}>
            <Text style={styles.detailsText}>View Details</Text>
          </Pressable>
        </View>
        <Pressable
          onPress={() =>
            onPick(
              isRecommended
                ? picked.filter((id) => !recommended.includes(id))
                : [...new Set([...picked, ...recommended])],
            )
          }
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isRecommended }}
          style={styles.recRow}
        >
          <View style={[styles.box, isRecommended && styles.boxOn]}>
            {isRecommended && <Ionicons name="checkmark" size={14} color={T.text} />}
          </View>
          <Text style={styles.recText} numberOfLines={1}>
            Recommended Service
          </Text>
          <View style={styles.chosen}>
            <Text style={styles.chosenText}>Chosen by 75% of users</Text>
          </View>
        </Pressable>

        <View style={styles.itemsRow}>
          <View style={styles.flex}>
            <ItemRow name={s.base.name} price={s.base.price} state="locked" />
            {visible.map((a) => (
              <ItemRow
                key={a.id}
                name={a.name}
                price={a.price}
                state={picked.includes(a.id) ? 'on' : 'off'}
                onPress={() => toggleItem(a.id)}
              />
            ))}
            {hidden > 0 && (
              <Pressable onPress={() => setMore((m) => !m)} accessibilityRole="button" hitSlop={6}>
                <Text style={styles.moreLink}>
                  {more ? 'Show less' : `${hidden} More Add On${hidden > 1 ? 's' : ''}`}
                </Text>
              </Pressable>
            )}
          </View>
          <View style={styles.perDay}>
            <Image source={s.image} style={styles.perDayImg} resizeMode="cover" />
            <View style={styles.perDayBody}>
              <Text style={styles.perDayKicker}>Service at</Text>
              <Text style={styles.perDayPrice}>{rupees(perDay)}</Text>
              <Text style={styles.perDayKicker}>per day</Text>
            </View>
            <Pressable onPress={onWatch} accessibilityRole="button" style={styles.watch}>
              <Ionicons name="play-circle" size={16} color="#E5322D" />
              <Text style={styles.watchText}>Watch Now</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.dash} />
        <Text style={styles.pick}>Pick a plan that suits your needs</Text>
        <View style={styles.plans}>
          <View style={styles.flex}>
            <Pressable onPress={onMonthly} accessibilityRole="button" style={styles.plan}>
              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText}>50% OFF</Text>
              </View>
              <View style={styles.planBody}>
                <Text style={styles.planName}>Subscribe & Save</Text>
                <Text style={styles.planPrice}>
                  {rupees(perWash)}
                  <Text style={styles.planUnit}>/wash</Text>
                </Text>
                <View style={styles.blackChip}>
                  <Text style={styles.blackChipText}>
                    <Text style={styles.free}>FREE</Text> Road Side Assistance
                  </Text>
                </View>
              </View>
              <View style={styles.planFoot}>
                <Text style={styles.planFootText}>Monthly Packages</Text>
                <Ionicons name="arrow-forward" size={16} color={T.text} />
              </View>
            </Pressable>
            <View style={styles.opt}>
              <Text style={styles.optText}>Opt by 73% of users</Text>
            </View>
          </View>
          <View style={styles.flex}>
            <Pressable onPress={onOnce} accessibilityRole="button" style={styles.plan}>
              <View style={styles.planBody}>
                <Text style={styles.planName}>One Time Wash</Text>
                <Text style={styles.planPrice}>{rupees(price)}</Text>
                <View style={styles.blackChip}>
                  <Text style={styles.blackChipText}>
                    {rupees(Math.round(price * 0.43))} with <Text style={styles.blackWord}>BLACK</Text>
                  </Text>
                </View>
              </View>
              <View style={styles.planFoot}>
                <Text style={styles.planFootText}>One Time</Text>
                <Ionicons name="arrow-forward" size={16} color={T.text} />
              </View>
            </Pressable>
          </View>
        </View>
        <Pressable onPress={onMonthly} accessibilityRole="button" style={styles.unlimited}>
          <Text style={styles.unlimitedText}>Unlimited {s.kind === 'car' ? 'Car' : 'Bike'} Washes</Text>
          <Ionicons name="arrow-forward" size={18} color={T.text} />
        </Pressable>
      </View>
    </View>
  );
}

function ItemRow({
  name,
  price,
  state,
  onPress,
}: {
  name: string;
  price: number;
  state: 'locked' | 'on' | 'off';
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={state === 'locked'}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: state !== 'off', disabled: state === 'locked' }}
      style={styles.item}
    >
      <Text style={styles.itemName}>{name}</Text>
      <Text style={styles.itemPrice}>{rupees(price)}</Text>
      <View style={[styles.itemBox, state === 'on' && styles.itemBoxOn, state === 'locked' && styles.itemBoxLocked]}>
        <Ionicons name={state === 'off' ? 'add' : 'checkmark'} size={15} color={T.text} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  top: {
    backgroundColor: '#FAFAFA',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ECECEC',
  },
  header: {
    minHeight: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  title: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 17,
    color: T.text,
  },
  vehicle: {
    maxWidth: 160,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vehicleText: {
    alignItems: 'flex-end',
    flexShrink: 1,
  },
  vehicleModel: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: T.text,
  },
  vehicleBrand: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#8A94A6',
  },
  kindWrap: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  kinds: {
    padding: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  kind: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  kindOn: {
    backgroundColor: '#1F2125',
  },
  kindText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: T.text,
  },
  kindTextOn: {
    color: '#FFFFFF',
  },
  tabs: {
    marginTop: 8,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  tab: {
    flex: 1,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabOn: {
    borderBottomColor: '#FFD400',
  },
  tabText: {
    fontFamily: fonts.regular,
    fontSize: 14.5,
    color: '#6B7280',
  },
  tabTextOn: {
    fontFamily: fonts.medium,
    color: T.text,
  },
  off: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#F04444',
  },
  offText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: '#FFFFFF',
  },
  list: {
    padding: 16,
    gap: 16,
    backgroundColor: '#F5F6F8',
  },
  card: {
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardImg: {
    width: '100%',
    height: 168,
  },
  cardFoot: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardName: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: T.text,
  },
  cardMeta: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: '#6B7280',
  },
  cardPrice: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: T.text,
  },
  cardRatings: {
    fontSize: 11.5,
    color: '#8A8F98',
  },
  socFoot: {
    padding: 16,
  },
  socTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  socPrice: {
    marginTop: 4,
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: T.text,
  },
  mrp: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: T.muted,
    textDecorationLine: 'line-through',
  },
  offGreen: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: T.green,
  },
  socRating: {
    marginTop: 4,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: T.text,
  },
  choose: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#FFE300',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  chooseText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: T.text,
  },
  socLine: {
    marginVertical: 12,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E3E3E3',
  },
  includes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 6,
  },
  include: {
    width: '50%',
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: T.ink,
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: T.muted,
  },
  emptyLink: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: '#1A5FD0',
  },
  exp: {
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  expHead: {
    height: 52,
    paddingHorizontal: 16,
    backgroundColor: '#F6F6F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expTitle: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: T.text,
  },
  expBody: {
    padding: 14,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  make: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: T.text,
  },
  details: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#FFE300',
    justifyContent: 'center',
  },
  detailsText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: T.text,
  },
  recRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#B5B8BF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: {
    borderColor: '#FFE300',
    backgroundColor: '#FFE300',
  },
  recText: {
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: T.text,
  },
  chosen: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: '#E5F6E8',
  },
  chosenText: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: T.green,
  },
  itemsRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
  },
  item: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemName: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12.5,
    lineHeight: 16,
    color: T.text,
  },
  itemPrice: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: T.text,
  },
  itemBox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: T.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBoxOn: {
    borderColor: '#FFE300',
    backgroundColor: '#FFE300',
  },
  itemBoxLocked: {
    borderColor: '#D6D6D6',
    backgroundColor: '#E6E6E6',
  },
  moreLink: {
    marginTop: 6,
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: '#1A5FD0',
  },
  perDay: {
    width: 106,
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEE3B5',
    backgroundColor: '#FFFBEA',
    overflow: 'hidden',
  },
  perDayImg: {
    width: '100%',
    height: 100,
  },
  perDayBody: {
    paddingTop: 4,
    alignItems: 'center',
  },
  perDayKicker: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: T.green,
  },
  perDayPrice: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 28,
    color: T.green,
  },
  watch: {
    marginVertical: 6,
    marginHorizontal: 5,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  watchText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: T.text,
  },
  dash: {
    marginVertical: 14,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E3E3E3',
  },
  pick: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: T.text,
  },
  plans: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 10,
  },
  plan: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  planBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#1B891F',
    zIndex: 1,
  },
  planBadgeText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  planBody: {
    padding: 10,
    paddingTop: 14,
  },
  planName: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: T.text,
  },
  planPrice: {
    marginTop: 2,
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: T.text,
  },
  planUnit: {
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  blackChip: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#1F1F1F',
  },
  blackChipText: {
    fontFamily: fonts.medium,
    fontSize: 9.5,
    color: '#FFFFFF',
  },
  free: {
    fontFamily: fonts.bold,
    color: '#FFE300',
  },
  blackWord: {
    fontFamily: fonts.extraBoldItalic,
    color: '#FFFFFF',
  },
  planFoot: {
    height: 32,
    paddingHorizontal: 10,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: '#FFF6CC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planFootText: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: T.text,
  },
  opt: {
    marginTop: -2,
    marginHorizontal: 2,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: '#E5F6E8',
    alignItems: 'center',
  },
  optText: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: T.green,
  },
  unlimited: {
    marginTop: 14,
    height: 50,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#FFF3BF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unlimitedText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: T.text,
  },
});
