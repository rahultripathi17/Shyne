import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FormSheet } from '../../components/booking/FormSheet';
import { fonts, noBounce } from '../../components/theme';
import { Toast, useToast } from '../../components/Toast';
import { T } from '../../components/tracking/trackTheme';
import { closeAfterSave } from '../../data/bookingFlow';
import {
  currentPosition,
  distanceLabel,
  lastKnownPosition,
  type LatLng,
  type Place,
  searchPlaces,
} from '../../lib/geocode';
import { addressLabel, addressLine, type AddressTag, type SavedAddress, useAppStore } from '../../store/AppStore';

// Select your location: search, two quick actions, then every saved address in one list.
// An address saved for someone else is listed under that person's name with a person icon.
// Picking one makes it the address everywhere (Home header, Car Services, Slot and Checkout).

const YELLOW = '#FFF4C2';
const GOLD = '#8A6400';
// The app's address icons: filled glyphs on one neutral circle (a person for someone else's address).
const ICON: Record<AddressTag, 'home' | 'briefcase' | 'location'> = {
  Home: 'home',
  Work: 'briefcase',
  Other: 'location',
};

/** What a saved address is called in the list: the receiver's name, or its tag. */
const titleOf = (a: SavedAddress) => (a.contact ? a.contact.name : a.tag === 'Work' ? 'Office' : a.tag);

export default function AddressSelectionScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { addresses = [], location, pickAddress, removeAddress } = useAppStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [menu, setMenu] = useState<SavedAddress | null>(null);
  const [deleting, setDeleting] = useState<SavedAddress | null>(null);
  const [here, setHere] = useState<LatLng | null>(null);

  const isCurrent = (a: SavedAddress) =>
    location?.address === addressLine(a) && [a.tag, addressLabel(a)].includes(location.label);
  // The selected address first, then the rest in saved order.
  const sorted = [...addresses].sort((x, y) => Number(isCurrent(y)) - Number(isCurrent(x)));

  useFocusEffect(
    useCallback(() => {
      if (!closeAfterSave.current) return;
      closeAfterSave.current = false;
      if (router.canGoBack()) router.back();
    }, []),
  );

  // Distance under each address, when location is already allowed (never prompts here).
  useEffect(() => {
    void lastKnownPosition().then(setHere);
  }, []);

  // Live suggestions while typing (OpenStreetMap search).
  const q = query.trim();
  useEffect(() => {
    if (q.length < 3) return;
    const t = setTimeout(async () => {
      setSearching(true);
      setResults(await searchPlaces(q));
      setSearching(false);
    }, 450);
    return () => clearTimeout(t);
  }, [q]);
  const typing = q.length > 0;

  const openMap = (params: Record<string, string> = {}) => router.push({ pathname: '/address/map', params });

  const locateMe = async () => {
    setLocating(true);
    const res = await currentPosition();
    setLocating(false);
    if (res.ok) openMap({ lat: String(res.at.lat), lng: String(res.at.lng) });
    else toast.show(res.reason === 'denied' ? 'Allow location for Hoora in Settings' : 'Couldn’t find your location');
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={22} color={T.text} />
        </Pressable>
        <Text style={styles.title}>Select your location</Text>
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.search}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search an area or address"
            placeholderTextColor={T.faint}
            returnKeyType="search"
            style={styles.searchInput}
          />
          {searching ? (
            <ActivityIndicator size="small" color={T.muted} />
          ) : typing ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear">
              <Ionicons name="close-circle" size={18} color={T.faint} />
            </Pressable>
          ) : (
            <Ionicons name="search" size={20} color={T.muted} />
          )}
        </View>
      </View>

      <ScrollView
        {...noBounce}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {typing ? (
          <View style={styles.group}>
            {q.length < 3 && <Text style={styles.hint}>Type at least 3 letters</Text>}
            {q.length >= 3 && !searching && results.length === 0 && (
              <Text style={styles.hint}>No places found. Try a nearby landmark or area.</Text>
            )}
            {(q.length >= 3 ? results : []).map((p, i) => (
              <Pressable
                key={`${p.lat},${p.lng}`}
                onPress={() => openMap({ lat: String(p.lat), lng: String(p.lng) })}
                accessibilityRole="button"
                style={[styles.row, i > 0 && styles.rowLine]}
              >
                <View style={styles.tile}>
                  <View style={[styles.box, styles.neutral]}>
                    <Ionicons name="location-outline" size={17} color={T.text} />
                  </View>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {p.title}
                  </Text>
                  <Text style={styles.rowAddr} numberOfLines={2}>
                    {p.line}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <>
            <View style={styles.quick}>
              <Pressable
                onPress={() => void locateMe()}
                accessibilityRole="button"
                style={({ pressed }) => [styles.quickTile, pressed && styles.pressed]}
              >
                <View style={styles.quickIcon}>
                  {locating ? (
                    <ActivityIndicator size="small" color={GOLD} />
                  ) : (
                    <Ionicons name="locate" size={18} color={GOLD} />
                  )}
                </View>
                <View>
                  <Text style={styles.quickTitle}>Use current location</Text>
                  <Text style={styles.quickSub}>Using your phone’s GPS</Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => openMap()}
                accessibilityRole="button"
                style={({ pressed }) => [styles.quickTile, pressed && styles.pressed]}
              >
                <View style={styles.quickIcon}>
                  <Ionicons name="add" size={20} color={GOLD} />
                </View>
                <View>
                  <Text style={styles.quickTitle}>Add new address</Text>
                  <Text style={styles.quickSub}>Pick the spot on the map</Text>
                </View>
              </Pressable>
            </View>

            <Text style={styles.section}>SAVED ADDRESSES</Text>
            {addresses.length === 0 ? (
              <View style={[styles.group, styles.empty]}>
                <Ionicons name="location-outline" size={24} color={T.muted} />
                <Text style={styles.emptyTitle}>No saved addresses yet</Text>
                <Text style={styles.emptyText}>Save home or work once and book in a tap next time.</Text>
              </View>
            ) : (
              <View style={styles.group}>
                {sorted.map((a, i) => {
                  const current = isCurrent(a);
                  const icon = a.contact ? 'person' : ICON[a.tag];
                  return (
                    <View key={a.id} style={[styles.rowWrap, i > 0 && styles.rowLine]}>
                      <Pressable
                        onPress={() => {
                          pickAddress(a.id);
                          router.back();
                        }}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: current }}
                        accessibilityLabel={`${titleOf(a)}, ${addressLine(a)}`}
                        style={({ pressed }) => [styles.row, styles.rowFlex, pressed && styles.pressed]}
                      >
                        <View style={styles.tile}>
                          <View style={[styles.box, styles.neutral]}>
                            <Ionicons name={icon} size={17} color={T.text} />
                          </View>
                          {here && a.lat && a.lng ? (
                            <Text style={styles.distance}>{distanceLabel(here, { lat: a.lat, lng: a.lng })}</Text>
                          ) : null}
                        </View>
                        <View style={styles.flex}>
                          <View style={styles.titleRow}>
                            <Text style={styles.rowTitle} numberOfLines={1}>
                              {titleOf(a)}
                            </Text>
                            {current && (
                              <View style={styles.selected}>
                                <Text style={styles.selectedText}>SELECTED</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.rowAddr} numberOfLines={2}>
                            {addressLine(a)}
                          </Text>
                        </View>
                      </Pressable>
                      <Pressable
                        onPress={() => setMenu(a)}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel={`More options for ${titleOf(a)}`}
                        style={({ pressed }) => [styles.more, pressed && styles.morePressed]}
                      >
                        <Ionicons name="ellipsis-vertical" size={18} color={T.text} />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Edit / delete */}
      <FormSheet
        visible={!!menu}
        title={menu ? titleOf(menu) : ''}
        subtitle={menu ? addressLine(menu) : ''}
        onClose={() => setMenu(null)}
      >
        <Pressable
          onPress={() => {
            const a = menu;
            setMenu(null);
            if (a) setTimeout(() => router.push({ pathname: '/address/map', params: { id: a.id } }), 280);
          }}
          accessibilityRole="button"
          style={styles.sheetRow}
        >
          <Ionicons name="create-outline" size={20} color={T.text} />
          <Text style={styles.sheetText}>Edit address</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            const a = menu;
            setMenu(null);
            if (a) setTimeout(() => setDeleting(a), 280);
          }}
          accessibilityRole="button"
          style={[styles.sheetRow, styles.sheetLine]}
        >
          <Ionicons name="trash-outline" size={20} color="#D93636" />
          <Text style={[styles.sheetText, { color: '#D93636' }]}>Delete address</Text>
        </Pressable>
      </FormSheet>

      <Modal visible={!!deleting} transparent animationType="fade" onRequestClose={() => setDeleting(null)}>
        <View style={styles.scrim}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Delete this address?</Text>
            <Text style={styles.dialogText} numberOfLines={2}>
              {deleting ? addressLine(deleting) : ''}
            </Text>
            <View style={styles.dialogRow}>
              <Pressable onPress={() => setDeleting(null)} style={styles.dialogBack} accessibilityRole="button">
                <Text style={styles.dialogBackText}>Keep</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (deleting) removeAddress(deleting.id);
                  setDeleting(null);
                  toast.show('Address deleted');
                }}
                style={styles.dialogDelete}
                accessibilityRole="button"
              >
                <Text style={styles.dialogDeleteText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Toast toast={toast} bottom={insets.bottom + 24} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F5F8',
  },
  flex: {
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 17,
    color: T.text,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  search: {
    height: 48,
    paddingLeft: 16,
    paddingRight: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCDEE3',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: T.text,
  },
  quick: {
    marginHorizontal: 16,
    flexDirection: 'row',
    gap: 10,
  },
  quickTile: {
    flex: 1,
    minHeight: 84,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E3E5E9',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  quickTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 13.5,
    color: T.text,
  },
  quickSub: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 11.5,
    lineHeight: 15,
    color: T.muted,
  },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  neutral: {
    backgroundColor: '#F2F3F5',
  },
  section: {
    marginTop: 24,
    marginBottom: 10,
    marginHorizontal: 22,
    fontFamily: fonts.semiBold,
    fontSize: 12,
    letterSpacing: 1.2,
    color: '#8A8D94',
  },
  group: {
    marginHorizontal: 16,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  rowWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rowLine: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E3E5E9',
  },
  row: {
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  rowFlex: {
    flex: 1,
  },
  tile: {
    width: 48,
    alignItems: 'center',
    gap: 4,
  },
  distance: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: T.ink,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowTitle: {
    flexShrink: 1,
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: T.text,
  },
  selected: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: T.text,
  },
  selectedText: {
    fontFamily: fonts.semiBold,
    fontSize: 9.5,
    letterSpacing: 0.6,
    color: '#FFFFFF',
  },
  rowAddr: {
    marginTop: 3,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: '#5F636B',
  },
  more: {
    marginTop: 12,
    marginRight: -6,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  morePressed: {
    backgroundColor: '#F2F3F5',
  },
  hint: {
    paddingVertical: 16,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 13,
    color: T.muted,
  },
  empty: {
    paddingVertical: 28,
    alignItems: 'center',
    gap: 4,
  },
  emptyTitle: {
    marginTop: 6,
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: T.text,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: T.muted,
    textAlign: 'center',
  },
  sheetRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sheetLine: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E6E7EB',
  },
  sheetText: {
    fontFamily: fonts.medium,
    fontSize: 14.5,
    color: T.text,
  },
  scrim: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  dialog: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  dialogTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 17,
    color: T.text,
  },
  dialogText: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: T.muted,
  },
  dialogRow: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 10,
  },
  dialogBack: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D5D7DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogBackText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: T.text,
  },
  dialogDelete: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#D93636',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogDeleteText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
