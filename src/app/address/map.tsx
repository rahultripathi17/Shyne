import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddressForm } from '../../components/booking/AddressForm';
import { fonts } from '../../components/theme';
import { Toast, useToast } from '../../components/Toast';
import { TopBar } from '../../components/TopBar';
import { T } from '../../components/tracking/trackTheme';
import { closeAfterSave } from '../../data/bookingFlow';
import { detectAddress } from '../../lib/location';
import { useAppStore } from '../../store/AppStore';

// Pin on the map (Figma "Location Map Screen" + live app): confirm where the partner should come,
// then fill the address details in the sheet. SAMPLE map image until a maps SDK is added.

const MAP = require('../../../assets/booking/flow/map-pick.jpg');
const DEFAULT_AREA = 'Survey Nagar, Nagpur';

export default function AddressMapScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const params = useLocalSearchParams<{ area?: string; id?: string }>();
  const { addresses = [], location, saveAddress } = useAppStore();
  const editing = addresses.find((a) => a.id === params.id);
  const [area, setArea] = useState(editing?.area ?? params.area ?? location?.address ?? DEFAULT_AREA);
  const [form, setForm] = useState(!!editing);
  const [box, setBox] = useState({ w: 390, h: 700 });
  // The pin's tip sits at 40% of the map; the map is placed so a street block (not the river) is under it.
  const pinY = box.h * 0.4;
  const size = Math.max(box.w, box.h) * 1.3;

  const current = async () => {
    toast.show('Finding your location…');
    const result = await detectAddress();
    if (result.ok) setArea(result.location.address);
    else
      toast.show(result.reason === 'denied' ? 'Allow location for Hoora in Settings' : 'Couldn’t find your location');
  };

  return (
    <View style={styles.screen}>
      <TopBar title="Address Selection" topInset={insets.top} onBack={() => router.back()} />
      <View
        style={styles.mapWrap}
        onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      >
        <Image
          source={MAP}
          style={{
            position: 'absolute',
            width: size,
            height: size,
            left: box.w / 2 - size * 0.55,
            top: pinY - size * 0.5,
          }}
          accessibilityLabel="Map"
        />
        <View style={[styles.center, { top: pinY - 108 }]} pointerEvents="none">
          <View style={styles.tip}>
            <Text style={styles.tipText}>Our Service Partner will{'\n'}reach here for the service.</Text>
          </View>
          <View style={styles.tipArrow} />
          <Ionicons name="location-sharp" size={44} color="#E5322D" />
        </View>

        <View style={[styles.bottom, { paddingBottom: insets.bottom + 14 }]}>
          <Pressable onPress={() => void current()} accessibilityRole="button" style={styles.current}>
            <Ionicons name="locate-outline" size={16} color={T.ink} />
            <Text style={styles.currentText}>Use current location</Text>
          </Pressable>
          <View style={styles.addr}>
            <Ionicons name="location-sharp" size={22} color="#3D3D3D" />
            <Text style={styles.addrText} numberOfLines={2}>
              {area}
            </Text>
          </View>
          <Pressable
            onPress={() => setForm(true)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.confirm, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.confirmText}>Confirm Location</Text>
          </Pressable>
        </View>
      </View>

      <AddressForm
        key={editing?.id ?? 'new'}
        visible={form}
        area={area}
        initial={editing}
        onChangeArea={() => setForm(false)}
        onClose={() => setForm(false)}
        onSave={(address) => {
          saveAddress({ ...address, id: editing?.id });
          setForm(false);
          // Back to Address Selection, which then closes too (see `closeAfterSave`).
          closeAfterSave.current = true;
          router.back();
        }}
      />
      <Toast toast={toast} bottom={insets.bottom + 180} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mapWrap: {
    flex: 1,
    overflow: 'hidden',
  },
  center: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
  },
  tipText: {
    textAlign: 'center',
    fontFamily: fonts.semiBold,
    fontSize: 13,
    lineHeight: 18,
    color: '#FFFFFF',
  },
  tipArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#2A2A2A',
    marginBottom: 2,
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    gap: 12,
  },
  current: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: T.ink,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: T.ink,
  },
  addr: {
    alignSelf: 'stretch',
    marginHorizontal: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FFE300',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  addrText: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 15,
    lineHeight: 20,
    color: T.text,
  },
  confirm: {
    width: '76%',
    height: 54,
    borderRadius: 27,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: '#FFFFFF',
  },
});
