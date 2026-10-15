import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts, noBounce } from '../../components/theme';
import { Toast, useToast } from '../../components/Toast';
import { TopBar } from '../../components/TopBar';
import { T } from '../../components/tracking/trackTheme';
import { closeAfterSave } from '../../data/bookingFlow';
import { detectAddress } from '../../lib/location';
import { addressLine, type AddressTag, useAppStore } from '../../store/AppStore';

// Address Selection (Figma Address Page + live app): search, current location, add, and the
// saved addresses with edit / delete. Picking one makes it the address everywhere (Home header,
// Car Services, Slot and Checkout).

const BLUE = '#1A5FD0';
const ICON: Record<AddressTag, 'home' | 'briefcase' | 'location'> = {
  Home: 'home',
  Work: 'briefcase',
  Other: 'location',
};

export default function AddressSelectionScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { addresses = [], location, pickAddress, removeAddress } = useAppStore();
  const [query, setQuery] = useState('');
  const [menu, setMenu] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!closeAfterSave.current) return;
      closeAfterSave.current = false;
      if (router.canGoBack()) router.back();
    }, []),
  );

  const q = query.trim().toLowerCase();
  const shown = addresses.filter(
    (a) => !q || `${a.tag} ${addressLine(a)} ${a.landmark ?? ''}`.toLowerCase().includes(q),
  );

  const locateMe = async () => {
    setLocating(true);
    const result = await detectAddress();
    setLocating(false);
    if (result.ok) router.push({ pathname: '/address/map', params: { area: result.location.address } });
    else
      toast.show(result.reason === 'denied' ? 'Allow location for Hoora in Settings' : 'Couldn’t find your location');
  };

  return (
    <View style={styles.screen}>
      <TopBar title="Address Selection" topInset={insets.top} onBack={() => router.back()} />
      <ScrollView
        {...noBounce}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        <View style={styles.search}>
          <Ionicons name="search" size={20} color={T.gold} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search address or location"
            placeholderTextColor={T.faint}
            returnKeyType="search"
            onSubmitEditing={() => q && router.push({ pathname: '/address/map', params: { area: query.trim() } })}
            style={styles.searchInput}
          />
        </View>

        <Pressable onPress={() => void locateMe()} accessibilityRole="button" style={styles.action}>
          <Ionicons name="locate" size={22} color={BLUE} />
          <Text style={styles.actionText}>{locating ? 'Finding your location…' : 'Use Current Location'}</Text>
          <Ionicons name="chevron-forward" size={18} color={T.ink} />
        </Pressable>
        <View style={styles.thin} />
        <Pressable onPress={() => router.push('/address/map')} accessibilityRole="button" style={styles.action}>
          <Ionicons name="add-circle-outline" size={22} color={BLUE} />
          <Text style={styles.actionText}>Add Address</Text>
          <Ionicons name="chevron-forward" size={18} color={T.ink} />
        </Pressable>
        <View style={styles.dashed} />

        <Text style={styles.section}>Saved Addresses</Text>
        {shown.length === 0 && (
          <Text style={styles.empty}>
            {q ? 'No saved address matches.' : 'No saved addresses yet. Add one to book faster.'}
          </Text>
        )}
        {shown.map((a, i) => {
          const current = location?.address === addressLine(a) && location.label === a.tag;
          return (
            <View key={a.id} style={[styles.saved, i > 0 && styles.savedLine]}>
              <Pressable
                onPress={() => {
                  pickAddress(a.id);
                  router.back();
                }}
                accessibilityRole="button"
                accessibilityLabel={`Deliver to ${a.tag}, ${addressLine(a)}`}
                style={styles.savedMain}
              >
                <Ionicons name={ICON[a.tag]} size={20} color="#4A4A4A" />
                <View style={styles.flex}>
                  <View style={styles.tagRow}>
                    <Text style={styles.savedTag}>{a.tag}</Text>
                    {current && <Text style={styles.current}>Selected</Text>}
                  </View>
                  <Text style={styles.savedAddr} numberOfLines={2}>
                    {addressLine(a)}
                  </Text>
                  {a.contact && (
                    <Text style={styles.savedFor} numberOfLines={1}>
                      For {a.contact.name} · +91 {a.contact.phone}
                    </Text>
                  )}
                </View>
              </Pressable>
              <Pressable
                onPress={() => setMenu(menu === a.id ? null : a.id)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={`More options for ${a.tag}`}
                style={styles.more}
              >
                <Ionicons name="ellipsis-horizontal" size={20} color={T.ink} />
              </Pressable>
              {menu === a.id && (
                <View style={styles.menu}>
                  <Pressable
                    onPress={() => {
                      setMenu(null);
                      router.push({ pathname: '/address/map', params: { id: a.id } });
                    }}
                    style={styles.menuRow}
                    accessibilityRole="button"
                  >
                    <Ionicons name="pencil" size={14} color={BLUE} />
                    <Text style={[styles.menuText, { color: BLUE }]}>Edit</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setMenu(null);
                      setDeleting(a.id);
                    }}
                    style={styles.menuRow}
                    accessibilityRole="button"
                  >
                    <Ionicons name="trash" size={14} color="#E5484D" />
                    <Text style={[styles.menuText, { color: '#E5484D' }]}>Delete</Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={!!deleting} transparent animationType="fade" onRequestClose={() => setDeleting(null)}>
        <View style={styles.scrim}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Are you sure you want to delete this address?</Text>
            <View style={styles.dialogRow}>
              <Pressable onPress={() => setDeleting(null)} style={styles.dialogBack} accessibilityRole="button">
                <Text style={styles.dialogBackText}>Back</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (deleting) removeAddress(deleting);
                  setDeleting(null);
                  toast.show('Address deleted');
                }}
                style={styles.dialogDelete}
                accessibilityRole="button"
              >
                <Ionicons name="trash-outline" size={16} color="#C22F2F" />
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
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  search: {
    marginHorizontal: 16,
    marginTop: 6,
    height: 50,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCDEE3',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: T.text,
  },
  action: {
    minHeight: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionText: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: BLUE,
  },
  thin: {
    marginHorizontal: 16,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E3E5E9',
  },
  dashed: {
    marginHorizontal: 16,
    marginTop: 4,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#9A9CA3',
  },
  section: {
    marginTop: 20,
    marginBottom: 4,
    marginHorizontal: 16,
    fontFamily: fonts.semiBold,
    fontSize: 17,
    color: T.text,
  },
  empty: {
    marginHorizontal: 16,
    marginTop: 10,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: T.muted,
  },
  saved: {
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  savedLine: {
    borderTopWidth: 1,
    borderTopColor: '#E3E5E9',
  },
  savedMain: {
    flex: 1,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  savedTag: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: T.text,
  },
  current: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#E5F5EC',
    fontFamily: fonts.semiBold,
    fontSize: 10,
    color: '#17784A',
  },
  savedAddr: {
    marginTop: 3,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: '#6B7280',
  },
  savedFor: {
    marginTop: 3,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: T.ink,
  },
  more: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menu: {
    position: 'absolute',
    right: 34,
    top: 34,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    zIndex: 5,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  menuText: {
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  scrim: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dialog: {
    padding: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  dialogTitle: {
    textAlign: 'center',
    fontFamily: fonts.semiBold,
    fontSize: 18,
    lineHeight: 25,
    color: T.text,
  },
  dialogRow: {
    marginTop: 20,
    flexDirection: 'row',
    gap: 12,
  },
  dialogBack: {
    flex: 1,
    height: 44,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: T.text,
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
    borderRadius: 4,
    backgroundColor: '#FFD6D6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dialogDeleteText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: '#C22F2F',
  },
});
