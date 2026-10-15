import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddressForm } from '../../components/booking/AddressForm';
import { LiveMap, type LiveMapHandle } from '../../components/booking/LiveMap';
import type { MapMessage } from '../../components/booking/liveMapHtml';
import { fonts, useAnimatedValue } from '../../components/theme';
import { Toast, useToast } from '../../components/Toast';
import { YellowButton } from '../../components/tracking/TrackingSheets';
import { T } from '../../components/tracking/trackTheme';
import { closeAfterSave } from '../../data/bookingFlow';
import {
  currentPosition,
  DEFAULT_CENTER,
  type LatLng,
  type Place,
  reverseGeocode,
  searchPlaces,
} from '../../lib/geocode';
import { useAppStore } from '../../store/AppStore';

// Pin the spot on a live OpenStreetMap: drag the map under the pin, or search, or jump to where you
// are. The card at the bottom names the place; Confirm opens the address details.

export default function AddressMapScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const params = useLocalSearchParams<{ id?: string; lat?: string; lng?: string; search?: string }>();
  const { addresses = [], saveAddress } = useAppStore();
  const editing = addresses.find((a) => a.id === params.id);
  const map = useRef<LiveMapHandle>(null);

  const [start] = useState<LatLng>(() =>
    editing?.lat && editing.lng
      ? { lat: editing.lat, lng: editing.lng }
      : params.lat && params.lng
        ? { lat: Number(params.lat), lng: Number(params.lng) }
        : DEFAULT_CENTER,
  );
  const [center, setCenter] = useState(start);
  const [place, setPlace] = useState<{ title: string; line: string } | null>(
    editing ? { title: editing.area.split(',')[0], line: editing.area.split(',').slice(1).join(',').trim() } : null,
  );
  const [moving, setMoving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [form, setForm] = useState(!!editing);
  const [searching, setSearching] = useState(params.search === '1');
  const lookup = useRef(0);

  // Pin lifts while the map moves, drops when it settles.
  const lift = useAnimatedValue(0);
  useEffect(() => {
    Animated.timing(lift, {
      toValue: moving ? 1 : 0,
      duration: 160,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [moving, lift]);

  const describe = async (p: LatLng) => {
    const id = ++lookup.current;
    const found = await reverseGeocode(p);
    if (id !== lookup.current) return; // a newer move superseded this one
    setPlace(found ?? { title: 'Pinned location', line: `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}` });
  };

  const onMap = (m: MapMessage) => {
    if (m.type === 'ready') {
      if (!place) void describe(start);
      return;
    }
    if (m.type === 'moving') {
      setMoving(true);
      return;
    }
    if (m.type === 'center') {
      setMoving(false);
      setCenter({ lat: m.lat, lng: m.lng });
      setPlace(null);
      void describe({ lat: m.lat, lng: m.lng });
    }
  };

  const goToMe = async () => {
    setLocating(true);
    const res = await currentPosition();
    setLocating(false);
    if (res.ok) map.current?.flyTo(res.at);
    else toast.show(res.reason === 'denied' ? 'Allow location for Hoora in Settings' : 'Couldn’t find your location');
  };

  const area = place ? [place.title, place.line].filter(Boolean).join(', ') : '';

  return (
    <View style={styles.screen}>
      <LiveMap ref={map} initial={start} onMessage={onMap} />

      {/* Fixed pin at the centre of the map */}
      <View style={styles.pinLayer} pointerEvents="none">
        {!moving && (
          <View style={styles.tip}>
            <Text style={styles.tipText}>Your service partner will come here</Text>
            <View style={styles.tipArrow} />
          </View>
        )}
        <Animated.View
          style={{ transform: [{ translateY: lift.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) }] }}
        >
          <Ionicons name="location-sharp" size={42} color="#E5322D" />
        </Animated.View>
        <View style={styles.pinShadow} />
      </View>

      {/* Top: back + search */}
      <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={styles.round}
        >
          <Ionicons name="arrow-back" size={20} color={T.text} />
        </Pressable>
        <Pressable onPress={() => setSearching(true)} accessibilityRole="search" style={styles.searchPill}>
          <Ionicons name="search" size={17} color={T.gold} />
          <Text style={styles.searchText}>Search for area, street name…</Text>
        </Pressable>
      </View>

      {/* Bottom card */}
      <View style={styles.bottom}>
        <Pressable onPress={() => void goToMe()} accessibilityRole="button" style={styles.locate}>
          {locating ? (
            <ActivityIndicator size="small" color="#1A5FD0" />
          ) : (
            <Ionicons name="locate" size={16} color="#1A5FD0" />
          )}
          <Text style={styles.locateText}>Use current location</Text>
        </Pressable>
        <View style={[styles.card, { paddingBottom: insets.bottom + 14 }]}>
          <Text style={styles.kicker}>Service location</Text>
          <View style={styles.placeRow}>
            <View style={styles.placeIcon}>
              <Ionicons name="location" size={18} color="#E5322D" />
            </View>
            <View style={styles.flex}>
              {place && !moving ? (
                <>
                  <Text style={styles.place} numberOfLines={1}>
                    {place.title}
                  </Text>
                  {place.line ? (
                    <Text style={styles.placeSub} numberOfLines={2}>
                      {place.line}
                    </Text>
                  ) : null}
                </>
              ) : (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={T.muted} />
                  <Text style={styles.placeSub}>{moving ? 'Place the pin on your spot' : 'Finding the address…'}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.cta}>
            <YellowButton label="Confirm location" onPress={() => setForm(true)} disabled={!place || moving} />
          </View>
        </View>
      </View>

      {searching && (
        <SearchOverlay
          top={insets.top}
          onClose={() => setSearching(false)}
          onPick={(p) => {
            setSearching(false);
            lookup.current++;
            setPlace({ title: p.title, line: p.line });
            setCenter({ lat: p.lat, lng: p.lng });
            map.current?.flyTo(p);
          }}
        />
      )}

      <AddressForm
        key={editing?.id ?? 'new'}
        visible={form}
        area={area || editing?.area || ''}
        initial={editing}
        onChangeArea={() => setForm(false)}
        onClose={() => setForm(false)}
        onSave={(address) => {
          saveAddress({ ...address, lat: center.lat, lng: center.lng, id: editing?.id });
          setForm(false);
          // Back to Address Selection, which then closes too (see `closeAfterSave`).
          closeAfterSave.current = true;
          router.back();
        }}
      />
      <Toast toast={toast} bottom={insets.bottom + 210} />
    </View>
  );
}

/** Full-screen place search over the map. */
function SearchOverlay({ top, onClose, onPick }: { top: number; onClose: () => void; onPick: (p: Place) => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (q.trim().length < 3) return;
    const t = setTimeout(async () => {
      setBusy(true);
      setResults(await searchPlaces(q));
      setBusy(false);
    }, 450);
    return () => clearTimeout(t);
  }, [q]);

  const shown = q.trim().length < 3 ? [] : results;

  return (
    <View style={[styles.overlay, { paddingTop: top + 8 }]}>
      <View style={styles.overlayBar}>
        <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close search">
          <Ionicons name="arrow-back" size={22} color={T.text} />
        </Pressable>
        <View style={styles.overlayInput}>
          <Ionicons name="search" size={17} color={T.gold} />
          <TextInput
            value={q}
            onChangeText={setQ}
            autoFocus
            placeholder="Search for area, street name…"
            placeholderTextColor={T.faint}
            returnKeyType="search"
            style={styles.overlayText}
          />
          {busy && <ActivityIndicator size="small" color={T.muted} />}
        </View>
      </View>
      <FlatList
        data={shown}
        keyExtractor={(p) => `${p.lat},${p.lng}`}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={styles.overlayHint}>
            {q.trim().length < 3
              ? 'Type at least 3 letters'
              : busy
                ? 'Searching…'
                : 'No places found. Try another name.'}
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => onPick(item)} accessibilityRole="button" style={styles.result}>
            <View style={styles.resultIcon}>
              <Ionicons name="location-outline" size={17} color={T.ink} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.resultTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.resultLine} numberOfLines={2}>
                {item.line}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const shadow = {
  shadowColor: '#000000',
  shadowOpacity: 0.12,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 3,
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#EEF0F2',
  },
  flex: {
    flex: 1,
  },
  pinLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    // The pin's tip (not its middle) marks the centre.
    paddingBottom: 42,
  },
  tip: {
    position: 'absolute',
    bottom: '50%',
    marginBottom: 46,
    alignItems: 'center',
  },
  tipText: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1F1F22',
    fontFamily: fonts.semiBold,
    fontSize: 12.5,
    color: '#FFFFFF',
  },
  tipArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#1F1F22',
  },
  pinShadow: {
    width: 10,
    height: 4,
    marginTop: -3,
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  top: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  round: {
    ...shadow,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchPill: {
    ...shadow,
    flex: 1,
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchText: {
    fontFamily: fonts.regular,
    fontSize: 13.5,
    color: T.faint,
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  locate: {
    ...shadow,
    alignSelf: 'center',
    marginBottom: 12,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locateText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: '#1A5FD0',
  },
  card: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
  kicker: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: T.muted,
  },
  placeRow: {
    marginTop: 8,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  placeIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  place: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: T.text,
  },
  placeSub: {
    marginTop: 1,
    fontFamily: fonts.regular,
    fontSize: 12.5,
    lineHeight: 17,
    color: T.muted,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cta: {
    marginTop: 16,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
  },
  overlayBar: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E7EB',
  },
  overlayInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F4F5F7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  overlayText: {
    flex: 1,
    height: 44,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: T.text,
  },
  overlayHint: {
    margin: 20,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 13,
    color: T.muted,
  },
  result: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F2',
  },
  resultIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F4F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: T.text,
  },
  resultLine: {
    marginTop: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: T.muted,
  },
});
