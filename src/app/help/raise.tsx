import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HELP, Select } from '../../components/help/HelpKit';
import { fonts, noBounce } from '../../components/theme';
import { TopBar } from '../../components/TopBar';
import { T } from '../../components/tracking/trackTheme';
import { YellowButton } from '../../components/tracking/TrackingSheets';
import type { BookingItem } from '../../data/bookingsDemo';
import { ISSUES, raiseTicket, SERVICES, type ServiceKey } from '../../data/support';
import { useAllBookings } from '../../lib/bookings';
import { fs, sz } from '../../components/responsive';

// Raise Ticket (Dev File → "Help & Support"): from a booking the service is filled in and its
// details shown; otherwise pick the service. Then issue category → reason, a description and
// optional pictures.

const HERO = require('../../../assets/help/help-hero.png');
const FROM_VERTICAL: Record<BookingItem['vertical'], ServiceKey> = {
  washes: 'wash',
  society: 'wash',
  bundles: 'wash',
  garage: 'garage',
  products: 'products',
  challans: 'challan',
  qr: 'qr',
};
type Field = 'service' | 'category' | 'reason';

export default function RaiseTicketScreen() {
  const insets = useSafeAreaInsets();
  const { booking: bookingId } = useLocalSearchParams<{ booking?: string }>();
  const booking = useAllBookings().find((b) => b.id === bookingId);
  const [service, setService] = useState<ServiceKey | undefined>(booking ? FROM_VERTICAL[booking.vertical] : undefined);
  const [category, setCategory] = useState<string>();
  const [reason, setReason] = useState<string>();
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [open, setOpen] = useState<Field>();
  const [tried, setTried] = useState(false);

  const reasons = ISSUES.find((i) => i.category === category)?.reasons ?? [];
  const toggle = (f: Field) => setOpen((o) => (o === f ? undefined : f));

  const addImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 4 - images.length,
      quality: 0.7,
    });
    if (!result.canceled) setImages((cur) => [...cur, ...result.assets.map((a) => a.uri)].slice(0, 4));
  };

  const submit = () => {
    setTried(true);
    if (!service || !category || !reason) return;
    const id = raiseTicket({
      service,
      category,
      reason,
      description,
      images,
      booking: booking ? { ref: booking.ref, title: booking.title } : undefined,
    });
    router.replace({ pathname: '/help/ticket/[id]', params: { id } });
  };

  return (
    <View style={styles.screen}>
      <TopBar title="Help & Support" topInset={insets.top} arrow onBack={() => router.back()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          {...noBounce}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.body, { paddingBottom: 24 }]}
        >
          <View style={[styles.card, styles.hero]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Tell us more</Text>
              <Text style={styles.heroSub}>Select a reason that best describes your issue.</Text>
            </View>
            <Image source={HERO} style={styles.heroArt} resizeMode="contain" accessibilityIgnoresInvertColors />
          </View>

          {booking ? (
            <View>
              <Text style={styles.label}>Service / Order Details</Text>
              <View style={[styles.card, styles.details]}>
                {[
                  ['Booking / order id', booking.ref],
                  ['Service / booking date', booking.when.title.split(' · ')[0]],
                  ['Service name', booking.title],
                ].map(([k, v], i) => (
                  <View key={k} style={[styles.detail, i > 0 && styles.line]}>
                    <Text style={styles.detailKey}>{k}</Text>
                    <Text style={styles.detailValue}>{v}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <Select
              label="Service Category"
              placeholder="Select a service"
              value={service}
              options={SERVICES.map((s) => ({ key: s.key, label: s.label, icon: s.icon }))}
              open={open === 'service'}
              onToggle={() => toggle('service')}
              onSelect={(o) => {
                setService(o.key as ServiceKey);
                setOpen(undefined);
              }}
              error={tried && !service ? 'Select the service' : undefined}
            />
          )}

          <Select
            label="Select the Issue Category"
            placeholder="Select an issue category"
            value={category}
            options={ISSUES.map((i) => ({ key: i.category, label: i.category }))}
            open={open === 'category'}
            onToggle={() => toggle('category')}
            onSelect={(o) => {
              setCategory(o.key);
              setReason(undefined);
              setOpen(undefined);
            }}
            error={tried && !category ? 'Select an issue category' : undefined}
          />

          <Select
            label="Select the Issue Reason"
            placeholder="Select a reason"
            value={reason}
            options={reasons.map((r) => ({ key: r, label: r }))}
            open={open === 'reason'}
            onToggle={() => toggle('reason')}
            onSelect={(o) => {
              setReason(o.key);
              setOpen(undefined);
            }}
            disabled={!category}
            error={tried && category && !reason ? 'Select a reason' : undefined}
          />

          <View>
            <Text style={styles.label}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your issue in detail…"
              placeholderTextColor={T.faint}
              multiline
              textAlignVertical="top"
              maxLength={1000}
              style={styles.textArea}
            />
          </View>

          <View>
            <Text style={styles.label}>
              Attachment <Text style={styles.optional}>(Optional)</Text>
            </Text>
            {images.length > 0 && (
              <View style={styles.thumbs}>
                {images.map((uri) => (
                  <View key={uri}>
                    <Image source={{ uri }} style={styles.thumb} />
                    <Pressable
                      onPress={() => setImages((cur) => cur.filter((u) => u !== uri))}
                      hitSlop={8}
                      style={styles.thumbX}
                      accessibilityRole="button"
                      accessibilityLabel="Remove picture"
                    >
                      <Ionicons name="close" size={12} color="#FFFFFF" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
            {images.length < 4 && (
              <Pressable
                onPress={() => void addImages()}
                style={({ pressed }) => [styles.upload, pressed && { backgroundColor: '#F7F8FA' }]}
                accessibilityRole="button"
              >
                <View style={styles.uploadIcon}>
                  <Ionicons name="cloud-upload-outline" size={20} color={HELP.blue} />
                </View>
                <Text style={styles.uploadTitle}>Upload files or images</Text>
                <Text style={styles.uploadSub}>(Max. file size 20 MB)</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <YellowButton label="Submit Ticket" onPress={submit} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: HELP.page,
  },
  body: {
    padding: sz(16),
    gap: sz(14),
  },
  card: {
    borderRadius: sz(12),
    backgroundColor: HELP.card,
  },
  hero: {
    padding: sz(16),
    paddingVertical: sz(14),
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fs(15),
    color: T.ink,
  },
  heroSub: {
    marginTop: sz(4),
    fontFamily: fonts.regular,
    fontSize: fs(12.5),
    lineHeight: fs(18),
    color: T.muted,
  },
  heroArt: {
    width: sz(112),
    height: sz(74),
  },
  label: {
    marginBottom: sz(8),
    fontFamily: fonts.medium,
    fontSize: fs(13),
    color: T.text,
  },
  optional: {
    fontFamily: fonts.regular,
    fontSize: fs(12),
    color: T.muted,
  },
  details: {
    paddingHorizontal: sz(14),
  },
  detail: {
    paddingVertical: sz(12),
    gap: sz(2),
  },
  line: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HELP.line,
  },
  detailKey: {
    fontFamily: fonts.regular,
    fontSize: fs(12),
    color: T.muted,
  },
  detailValue: {
    fontFamily: fonts.medium,
    fontSize: fs(14),
    color: T.text,
  },
  textArea: {
    minHeight: sz(92),
    paddingHorizontal: sz(14),
    paddingTop: sz(12),
    paddingBottom: sz(12),
    borderRadius: sz(10),
    borderWidth: 1,
    borderColor: '#E3E5E9',
    backgroundColor: '#FFFFFF',
    fontFamily: fonts.regular,
    fontSize: fs(13.5),
    lineHeight: fs(20),
    color: T.text,
  },
  thumbs: {
    marginBottom: sz(10),
    flexDirection: 'row',
    gap: sz(10),
  },
  thumb: {
    width: sz(64),
    height: sz(64),
    borderRadius: sz(8),
    backgroundColor: '#ECEDF0',
  },
  thumbX: {
    position: 'absolute',
    top: sz(-6),
    right: sz(-6),
    width: sz(20),
    height: sz(20),
    borderRadius: sz(10),
    backgroundColor: T.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upload: {
    paddingVertical: sz(14),
    borderRadius: sz(10),
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D5D7DC',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  uploadIcon: {
    width: sz(34),
    height: sz(34),
    borderRadius: sz(17),
    backgroundColor: '#EAF1FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTitle: {
    marginTop: sz(8),
    fontFamily: fonts.medium,
    fontSize: fs(13),
    color: T.text,
  },
  uploadSub: {
    marginTop: sz(2),
    fontFamily: fonts.regular,
    fontSize: fs(11.5),
    color: T.muted,
  },
  footer: {
    paddingHorizontal: sz(16),
    paddingTop: sz(10),
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HELP.line,
  },
});
