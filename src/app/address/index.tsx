import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FormSheet } from '../../components/booking/FormSheet';
import { fonts, noBounce } from '../../components/theme';
import { Toast, useToast } from '../../components/Toast';
import { TopBar } from '../../components/TopBar';
import { T } from '../../components/tracking/trackTheme';
import { closeAfterSave } from '../../data/bookingFlow';
import { currentPosition, type Place, searchPlaces } from '../../lib/geocode';
import { addressLine, type AddressTag, type SavedAddress, useAppStore } from '../../store/AppStore';

// Address Selection: search any place, use where you are, add a new address, or pick a saved one.
// Picking makes it the address everywhere (Home header, Car Services, Slot and Checkout).

const BLUE = '#1A5FD0';
const ICON: Record<AddressTag, { name: 'home' | 'briefcase' | 'location'; bg: string; fg: string }> = {
  Home: { name: 'home', bg: '#FFF4C2', fg: '#8A6400' },
  Work: { name: 'briefcase', bg: '#E8F0FE', fg: BLUE },
  Other: { name: 'location', bg: '#F1F2F4', fg: '#4A4A4A' },
};

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
  const isCurrent = (a: SavedAddress) => location?.address === addressLine(a) && location.label === a.tag;
  // The selected address first, then the rest in saved order.
  const sorted = [...addresses].sort((x, y) => Number(isCurrent(y)) - Number(isCurrent(x)));

  useFocusEffect(
    useCallback(() => {
      if (!closeAfterSave.current) return;
      closeAfterSave.current = false;
      if (router.canGoBack()) router.back();
    }, []),
  );

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
      <TopBar title="Select address" topInset={insets.top} onBack={() => router.back()} />

      <View style={styles.searchWrap}>
        <View style={styles.search}>
          <Ionicons name="search" size={18} color={T.gold} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search area, street or building"
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
          ) : null}
        </View>
      </View>

      <ScrollView
        {...noBounce}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {typing ? (
          <View style={styles.results}>
            {q.length < 3 && <Text style={styles.hint}>Type at least 3 letters</Text>}
            {q.length >= 3 && !searching && results.length === 0 && (
              <Text style={styles.hint}>No places found. Try a nearby landmark or area.</Text>
            )}
            {(q.length >= 3 ? results : []).map((p) => (
              <Pressable
                key={`${p.lat},${p.lng}`}
                onPress={() => openMap({ lat: String(p.lat), lng: String(p.lng) })}
                accessibilityRole="button"
                style={styles.result}
              >
                <View style={styles.resultIcon}>
                  <Ionicons name="location-outline" size={17} color={T.ink} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.resultTitle} numberOfLines={1}>
                    {p.title}
                  </Text>
                  <Text style={styles.resultLine} numberOfLines={2}>
                    {p.line}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <>
            <View style={styles.actions}>
              <Pressable onPress={() => void locateMe()} accessibilityRole="button" style={styles.action}>
                <View style={[styles.actionIcon, { backgroundColor: '#E8F0FE' }]}>
                  {locating ? (
                    <ActivityIndicator size="small" color={BLUE} />
                  ) : (
                    <Ionicons name="locate" size={18} color={BLUE} />
                  )}
                </View>
                <View style={styles.flex}>
                  <Text style={[styles.actionTitle, { color: BLUE }]}>Use current location</Text>
                  <Text style={styles.actionSub}>Using your phone’s GPS</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={T.faint} />
              </Pressable>
              <View style={styles.actionLine} />
              <Pressable onPress={() => openMap()} accessibilityRole="button" style={styles.action}>
                <View style={[styles.actionIcon, { backgroundColor: '#F1F2F4' }]}>
                  <Ionicons name="add" size={20} color={T.text} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.actionTitle}>Add new address</Text>
                  <Text style={styles.actionSub}>Pick the spot on the map</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={T.faint} />
              </Pressable>
            </View>

            <Text style={styles.section}>Saved addresses{addresses.length ? ` (${addresses.length})` : ''}</Text>
            {addresses.length === 0 ? (
              <View style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="location-outline" size={24} color={T.muted} />
                </View>
                <Text style={styles.emptyTitle}>No saved addresses yet</Text>
                <Text style={styles.emptyText}>Save home or work once and book in a tap next time.</Text>
              </View>
            ) : (
              <View style={styles.list}>
                {sorted.map((a) => {
                  const current = isCurrent(a);
                  const icon = ICON[a.tag];
                  return (
                    <View key={a.id} style={[styles.card, current && styles.cardOn]}>
                      <Pressable
                        onPress={() => {
                          pickAddress(a.id);
                          router.back();
                        }}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: current }}
                        accessibilityLabel={`${a.tag}, ${addressLine(a)}`}
                        style={({ pressed }) => [styles.cardTap, pressed && styles.cardPressed]}
                      >
                        {/* Header: icon, tag and status on one line, menu at the end */}
                        <View style={styles.cardHead}>
                          <View style={[styles.tagIcon, { backgroundColor: icon.bg }]}>
                            <Ionicons name={icon.name} size={15} color={icon.fg} />
                          </View>
                          <Text style={styles.tag} numberOfLines={1}>
                            {a.tag}
                          </Text>
                          {current && (
                            <View style={styles.current}>
                              <Ionicons name="checkmark-circle" size={12} color={T.text} />
                              <Text style={styles.currentText}>Selected</Text>
                            </View>
                          )}
                        </View>

                        {/* Body, aligned under the tag */}
                        <View style={styles.cardBody}>
                          <Text style={styles.addr} numberOfLines={2}>
                            {addressLine(a)}
                          </Text>
                          {a.landmark ? (
                            <Text style={styles.landmark} numberOfLines={1}>
                              Near {a.landmark}
                            </Text>
                          ) : null}
                          {a.contact ? (
                            <View style={styles.contactRow}>
                              <Ionicons name="person-outline" size={13} color={T.muted} />
                              <Text style={styles.contactText} numberOfLines={1}>
                                For <Text style={styles.contactName}>{a.contact.name}</Text>
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </Pressable>
                      <Pressable
                        onPress={() => setMenu(a)}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel={`More options for ${a.tag}`}
                        style={({ pressed }) => [styles.more, pressed && styles.morePressed]}
                      >
                        <Ionicons name="ellipsis-horizontal" size={18} color={T.ink} />
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
        title={menu?.tag ?? ''}
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
    backgroundColor: '#F6F7F9',
  },
  flex: {
    flex: 1,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  search: {
    height: 46,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: 46,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: T.text,
  },
  results: {
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  hint: {
    padding: 16,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 13,
    color: T.muted,
  },
  result: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEEFF2',
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
  actions: {
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  action: {
    minHeight: 62,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionLine: {
    marginLeft: 62,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E6E7EB',
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: T.text,
  },
  actionSub: {
    marginTop: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: T.muted,
  },
  section: {
    marginTop: 22,
    marginBottom: 10,
    marginHorizontal: 20,
    fontFamily: fonts.semiBold,
    fontSize: 13,
    letterSpacing: 0.2,
    color: T.muted,
  },
  list: {
    marginHorizontal: 16,
    gap: 12,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECEDF0',
    backgroundColor: '#FFFFFF',
  },
  cardOn: {
    borderColor: T.text,
  },
  cardTap: {
    paddingLeft: 16,
    paddingRight: 52,
    paddingTop: 14,
    paddingBottom: 16,
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardHead: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tagIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tag: {
    flexShrink: 1,
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: T.text,
  },
  current: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#F2F3F5',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  currentText: {
    fontFamily: fonts.semiBold,
    fontSize: 10.5,
    color: T.text,
  },
  more: {
    position: 'absolute',
    top: 14,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  morePressed: {
    backgroundColor: '#F2F3F5',
  },
  cardBody: {
    marginTop: 8,
    paddingLeft: 42,
  },
  addr: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: '#5F636B',
  },
  landmark: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: T.muted,
  },
  contactRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  contactText: {
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: T.muted,
  },
  contactName: {
    fontFamily: fonts.medium,
    color: T.text,
  },
  empty: {
    marginHorizontal: 16,
    paddingVertical: 28,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F4F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginTop: 10,
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: T.text,
  },
  emptyText: {
    marginTop: 3,
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
