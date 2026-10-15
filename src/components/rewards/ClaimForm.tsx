import * as Haptics from 'expo-haptics';
import { type ComponentProps, type ReactNode, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppStore } from '../../store/AppStore';
import { fonts } from '../theme';
import { R, YellowButton } from './RewardsKit';

// Delivery details for a physical reward (Figma "Personal Details", node 12561:1222), plus the
// bottom sheet every Rewards flow opens in.

/** Bottom sheet: scrim, grabber, keyboard-aware, scrolls when tall. */
export function Sheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 14 }]}>
          <View style={styles.grabber} />
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

type Field = 'name' | 'email' | 'phone' | 'address';

function check(v: Record<Field, string>): Partial<Record<Field, string>> {
  const e: Partial<Record<Field, string>> = {};
  if (v.name.trim().length < 2) e.name = 'Enter your full name';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) e.email = 'Enter a valid email address';
  if (v.phone.replace(/\D/g, '').length !== 10) e.phone = 'Enter a 10-digit mobile number';
  if (v.address.trim().length < 10) e.address = 'Enter your full address';
  return e;
}

/** The delivery form itself, so it can sit inside other sheets (e.g. redeeming a product). */
export function DeliveryForm({
  item,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  item: string;
  submitLabel: string;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const { name, email, phone } = useAppStore();
  const [values, setValues] = useState<Record<Field, string>>(() => ({
    name: name ?? '',
    email: email ?? '',
    phone: phone.replace(/^\+91/, '').replace(/\D/g, '').slice(-10),
    address: '',
  }));
  const [tried, setTried] = useState(false);
  const errors = tried ? check(values) : {};
  const set = (f: Field) => (v: string) => setValues((s) => ({ ...s, [f]: v }));

  const submit = () => {
    setTried(true);
    if (Object.keys(check(values)).length > 0) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSubmit();
  };

  return (
    <View>
      <Text style={styles.title}>Personal Details</Text>
      <Text style={styles.subtitle}>
        So we can deliver your <Text style={styles.strong}>{item}</Text>.
      </Text>

      <Input
        label="Full Name*"
        value={values.name}
        onChangeText={set('name')}
        error={errors.name}
        autoComplete="name"
      />
      <Input
        label="Email Address*"
        value={values.email}
        onChangeText={set('email')}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <Input
        label="Mobile Number*"
        prefix="+91"
        value={values.phone}
        onChangeText={(v) => set('phone')(v.replace(/\D/g, '').slice(0, 10))}
        error={errors.phone}
        keyboardType="number-pad"
        autoComplete="tel"
      />
      <Input
        label="Address*"
        placeholder="House no., street, area, city, pincode"
        value={values.address}
        onChangeText={set('address')}
        error={errors.address}
        multiline
        autoComplete="street-address"
      />
      <YellowButton label={submitLabel} onPress={submit} style={styles.submit} />
      <Pressable onPress={onCancel} accessibilityRole="button" style={styles.cancel} hitSlop={6}>
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </View>
  );
}

/** Claim a won prize or a league reward: delivery details in a sheet. */
export function ClaimForm({
  visible,
  prize,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  prize: string;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <Sheet visible={visible} onClose={onClose}>
      {visible && <DeliveryForm item={prize} submitLabel="Confirm & claim" onSubmit={onSubmit} onCancel={onClose} />}
    </Sheet>
  );
}

function Input({
  label,
  error,
  multiline,
  prefix,
  ...rest
}: {
  label: string;
  error?: string;
  multiline?: boolean;
  prefix?: string;
} & ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputBox, multiline && styles.inputMulti, error ? styles.inputError : null]}>
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          {...rest}
          multiline={multiline}
          placeholderTextColor={R.faint}
          textAlignVertical={multiline ? 'top' : 'center'}
          style={styles.input}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    maxHeight: '92%',
    paddingTop: 8,
    paddingHorizontal: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: R.card,
  },
  grabber: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DEDED8',
    marginBottom: 14,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 19,
    letterSpacing: -0.4,
    color: R.text,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 4,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 19,
    color: R.muted,
  },
  strong: {
    fontFamily: fonts.bold,
    color: R.text,
  },
  field: {
    marginTop: 14,
    gap: 6,
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 12.5,
    color: '#3A3C42',
  },
  inputBox: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E2DC',
    backgroundColor: '#FBFBF9',
  },
  inputMulti: {
    minHeight: 84,
    alignItems: 'flex-start',
    paddingTop: 12,
  },
  inputError: {
    borderColor: '#E5484D',
  },
  prefix: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: R.muted,
  },
  input: {
    flex: 1,
    alignSelf: 'stretch',
    fontFamily: fonts.medium,
    fontSize: 14,
    color: R.text,
    paddingVertical: 0,
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: '#D93036',
  },
  submit: {
    marginTop: 22,
  },
  cancel: {
    alignSelf: 'center',
    paddingVertical: 12,
  },
  cancelText: {
    fontFamily: fonts.semiBold,
    fontSize: 13.5,
    color: R.muted,
  },
});
