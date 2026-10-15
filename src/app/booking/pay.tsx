import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { type ComponentProps, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HooraMark } from '../../components/HooraLogo';
import { fonts, noBounce } from '../../components/theme';
import { YellowButton } from '../../components/tracking/TrackingSheets';
import { T } from '../../components/tracking/trackTheme';
import { getPendingBooking } from '../../data/pendingBooking';
import { usePlaceBooking } from '../../lib/placeBooking';
import { useAppStore } from '../../store/AppStore';

// Payment (Figma "Pay,ent screen" 8863:3942): the yellow checkout sheet with the total, contact
// details and how to pay. SAMPLE flow until the payment gateway is connected: paying always succeeds.

type Method = { id: string; name: string; sub: string; icon: ComponentProps<typeof Ionicons>['name'] };

const METHODS: Method[] = [
  { id: 'UPI', name: 'UPI', sub: 'Google Pay, PhonePe, Paytm and more', icon: 'qr-code-outline' },
  { id: 'Card', name: 'Cards', sub: 'Visa, Mastercard, RuPay', icon: 'card-outline' },
  { id: 'Netbanking', name: 'Netbanking', sub: 'All Indian banks', icon: 'business-outline' },
  { id: 'Wallet', name: 'Wallet', sub: 'Paytm, Amazon Pay, Mobikwik', icon: 'wallet-outline' },
];

const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function PaymentScreen() {
  const insets = useSafeAreaInsets();
  const { phone, email } = useAppStore();
  const place = usePlaceBooking();
  const [pending] = useState(getPendingBooking);
  const [method, setMethod] = useState('UPI');
  const [upi, setUpi] = useState('');
  const [mobile, setMobile] = useState((phone ?? '').replace(/\D/g, '').slice(-10));
  const [mail, setMail] = useState(email ?? '');
  const [paying, setPaying] = useState(false);

  if (!pending) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 40 }]}>
        <Text style={styles.missing}>Nothing to pay right now.</Text>
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.back}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const label = METHODS.find((m) => m.id === method)?.name ?? 'UPI';
  const pay = () => {
    setPaying(true);
    setTimeout(() => place(pending, { paidVia: label }), 1400);
  };

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#FFD84D', '#F7C42B']} style={[styles.head, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headRow}>
          <View style={styles.logo}>
            <HooraMark size={30} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.merchant}>{pending.kind}</Text>
            <View style={styles.trusted}>
              <Ionicons name="shield-checkmark" size={11} color="#1B891F" />
              <Text style={styles.trustedText}>Hoora Trusted Business</Text>
            </View>
          </View>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Close payment"
          >
            <Ionicons name="close" size={24} color={T.text} />
          </Pressable>
        </View>
        <View style={styles.totalRow}>
          <View>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.total}>{rupees(pending.payable)}</Text>
          </View>
          <View style={styles.secure}>
            <Ionicons name="lock-closed" size={11} color={T.text} />
            <Text style={styles.secureText}>Secured payment</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView {...noBounce} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
        <View style={styles.sectionHead}>
          <Ionicons name="person-outline" size={15} color={T.ink} />
          <Text style={styles.section}>Contact Details</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Phone Number</Text>
          <View style={styles.phoneRow}>
            <Text style={styles.code}>+91</Text>
            <TextInput
              value={mobile}
              onChangeText={(t) => setMobile(t.replace(/[^0-9]/g, '').slice(0, 10))}
              keyboardType="phone-pad"
              style={styles.input}
            />
          </View>
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Email (Optional)</Text>
          <TextInput
            value={mail}
            onChangeText={setMail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="you@example.com"
            placeholderTextColor={T.faint}
            style={[styles.input, styles.inputPad]}
          />
        </View>

        <View style={[styles.sectionHead, styles.methodsHead]}>
          <Ionicons name="wallet-outline" size={15} color={T.ink} />
          <Text style={styles.section}>Pay using</Text>
        </View>
        <View style={styles.methods}>
          {METHODS.map((m, i) => {
            const on = method === m.id;
            return (
              <View key={m.id} style={i > 0 && styles.methodLine}>
                <Pressable
                  onPress={() => setMethod(m.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  style={styles.method}
                >
                  <View style={styles.methodIcon}>
                    <Ionicons name={m.icon} size={18} color={T.ink} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.methodName}>{m.name}</Text>
                    <Text style={styles.methodSub}>{m.sub}</Text>
                  </View>
                  <View style={[styles.radio, on && styles.radioOn]}>{on && <View style={styles.radioInner} />}</View>
                </Pressable>
                {on && m.id === 'UPI' && (
                  <TextInput
                    value={upi}
                    onChangeText={setUpi}
                    autoCapitalize="none"
                    placeholder="Enter UPI ID (optional), e.g. name@okaxis"
                    placeholderTextColor={T.faint}
                    style={[styles.input, styles.inputPad, styles.upi]}
                  />
                )}
              </View>
            );
          })}
        </View>
        <Text style={styles.note}>You won’t be charged in this preview. Payments go live with the gateway.</Text>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <YellowButton label={`Pay ${rupees(pending.payable)} using ${label}`} onPress={pay} disabled={paying} />
      </View>

      <Modal visible={paying} transparent animationType="fade">
        <View style={styles.scrim}>
          <View style={styles.processing}>
            <ActivityIndicator size="large" color={T.text} />
            <Text style={styles.processingTitle}>Processing payment</Text>
            <Text style={styles.processingSub}>Please don’t close the app</Text>
          </View>
        </View>
      </Modal>
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
  missing: {
    textAlign: 'center',
    fontFamily: fonts.medium,
    fontSize: 14,
    color: T.muted,
  },
  back: {
    marginTop: 12,
    textAlign: 'center',
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: '#1A5FD0',
  },
  head: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#0B0B0F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  merchant: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: T.text,
  },
  trusted: {
    marginTop: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.55)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustedText: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    color: T.text,
  },
  totalRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#5A4A10',
  },
  total: {
    marginTop: 2,
    fontFamily: fonts.semiBold,
    fontSize: 24,
    color: T.text,
  },
  secure: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingBottom: 4,
  },
  secureText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: T.text,
  },
  body: {
    padding: 16,
    paddingBottom: 24,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  methodsHead: {
    marginTop: 22,
  },
  section: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: T.text,
  },
  field: {
    marginBottom: 12,
  },
  fieldLabel: {
    marginBottom: 6,
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: T.muted,
  },
  phoneRow: {
    height: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E3E5E9',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    gap: 10,
  },
  code: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: T.text,
  },
  input: {
    flex: 1,
    height: 46,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: T.text,
  },
  inputPad: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    height: 46,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E3E5E9',
  },
  methods: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ECEDF0',
    paddingHorizontal: 12,
  },
  methodLine: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F2',
  },
  method: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  methodIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F5F6F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodName: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: T.text,
  },
  methodSub: {
    marginTop: 1,
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: T.muted,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#C9CBD2',
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
  upi: {
    marginBottom: 12,
  },
  note: {
    marginTop: 14,
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: T.muted,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E3E5E9',
  },
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processing: {
    width: 240,
    paddingVertical: 24,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    gap: 6,
  },
  processingTitle: {
    marginTop: 8,
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: T.text,
  },
  processingSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: T.muted,
  },
});
