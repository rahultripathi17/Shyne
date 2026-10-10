import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionFooter, PrimaryButton } from '../components/Buttons';
import { ink } from '../components/home/homeTheme';
import { SsoButton } from '../components/SsoButton';
import { fonts, noBounce } from '../components/theme';
import { Toast, useToast } from '../components/Toast';
import { TopBar } from '../components/TopBar';
import { signInWith, SSO_LABEL, SSO_PROVIDER, ssoErrorMessage } from '../lib/sso';
import { type Gender, useAppStore } from '../store/AppStore';

const GENDERS: Gender[] = ['Male', 'Female', 'Other', 'Prefer not to say'];

const isEmail = (v: string) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/** Types "12081995" as "12/08/1995". */
const formatDob = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 8);
  return [d.slice(0, 2), d.slice(2, 4), d.slice(4)].filter(Boolean).join('/');
};

/** Empty is fine (optional); otherwise a real past date for someone 16–100 years old. */
const isDob = (v: string) => {
  if (!v) return true;
  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return false;
  const [day, month, year] = [+m[1], +m[2], +m[3]];
  const date = new Date(year, month - 1, day);
  if (date.getDate() !== day || date.getMonth() !== month - 1) return false;
  const age = (Date.now() - date.getTime()) / (365.25 * 864e5);
  return age >= 16 && age <= 100;
};

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const store = useAppStore();
  const { phone, linked, blackMember, setProfile } = store;
  const toast = useToast();

  const [name, setName] = useState(store.name ?? '');
  const [email, setEmail] = useState(store.email ?? '');
  const [gender, setGender] = useState<Gender | undefined>(store.gender);
  const [dob, setDob] = useState(store.dob ?? '');
  const [photoUri, setPhotoUri] = useState(store.photoUri);
  const [focus, setFocus] = useState<string>();
  const isLinked = !!linked?.[SSO_PROVIDER];

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const emailOk = isEmail(trimmedEmail);
  const dobOk = isDob(dob);
  const changed =
    trimmedName !== (store.name ?? '') ||
    trimmedEmail !== (store.email ?? '') ||
    gender !== store.gender ||
    dob !== (store.dob ?? '') ||
    photoUri !== store.photoUri;
  const canSave = trimmedName.length > 1 && emailOk && dobOk && changed;

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };

  const connect = async () => {
    const result = await signInWith(SSO_PROVIDER);
    if (!result.ok) {
      const msg = ssoErrorMessage(result.reason);
      if (msg) toast.show(msg);
      return;
    }
    // Fill empty fields from the account the user just connected.
    if (!trimmedName && result.name) setName(result.name);
    if (!trimmedEmail && result.email) setEmail(result.email);
    setProfile({ linked: { ...linked, [SSO_PROVIDER]: true } });
    toast.show(`${SSO_LABEL[SSO_PROVIDER]} account connected`);
  };

  const save = () => {
    if (!canSave) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setProfile({
      name: trimmedName,
      email: trimmedEmail || undefined,
      gender,
      dob: dob || undefined,
      photoUri,
    });
    router.back();
  };

  const input = (key: string) => [styles.input, focus === key && styles.inputOn];

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <TopBar title="Edit profile" topInset={insets.top} onBack={() => router.back()} />
      <ScrollView {...noBounce} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
        {/* Photo */}
        <Pressable onPress={pickPhoto} style={styles.photoWrap} accessibilityRole="button" accessibilityLabel="Change profile photo">
          <View style={styles.photo}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoImg} />
            ) : trimmedName ? (
              <Text style={styles.photoInitials}>{initialsOf(trimmedName)}</Text>
            ) : (
              <Ionicons name="person" size={40} color={ink.text} />
            )}
          </View>
          <View style={styles.camera}>
            <Ionicons name="camera" size={16} color={ink.text} />
          </View>
        </Pressable>
        <Text style={styles.photoHint}>{photoUri ? 'Tap to change photo' : 'Add a profile photo'}</Text>

        <Text style={styles.label}>Full name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          onFocus={() => setFocus('name')}
          onBlur={() => setFocus(undefined)}
          placeholder="Your full name"
          placeholderTextColor={ink.faint}
          autoCapitalize="words"
          textContentType="name"
          autoComplete="name"
          style={input('name')}
        />

        <Text style={styles.label}>Mobile number</Text>
        <View style={[styles.input, styles.locked]}>
          <Text style={styles.lockedText}>{phone || '—'}</Text>
          <View style={styles.verified}>
            <Ionicons name="checkmark-circle" size={15} color="#1E8E4E" />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        </View>

        <Text style={styles.label}>Email address</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          onFocus={() => setFocus('email')}
          onBlur={() => setFocus(undefined)}
          placeholder="you@example.com"
          placeholderTextColor={ink.faint}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          style={[input('email'), !emailOk && styles.inputError]}
        />
        {!emailOk && <Text style={styles.error}>Please enter a valid email.</Text>}

        <Text style={styles.label}>Gender</Text>
        <View style={styles.chips}>
          {GENDERS.map((g) => {
            const on = gender === g;
            return (
              <Pressable
                key={g}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setGender(on ? undefined : g);
                }}
                style={[styles.chip, on && styles.chipOn]}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
              >
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{g}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Date of birth</Text>
        <TextInput
          value={dob}
          onChangeText={(v) => setDob(formatDob(v))}
          onFocus={() => setFocus('dob')}
          onBlur={() => setFocus(undefined)}
          placeholder="DD/MM/YYYY"
          placeholderTextColor={ink.faint}
          keyboardType="number-pad"
          maxLength={10}
          style={[input('dob'), !dobOk && dob.length === 10 && styles.inputError]}
        />
        {!dobOk && dob.length === 10 && <Text style={styles.error}>Please enter a real date of birth.</Text>}

        {/* Connected sign-in */}
        <Text style={styles.label}>Connected account</Text>
        {isLinked ? (
          <View style={[styles.input, styles.locked]}>
            <Text style={styles.lockedText}>{SSO_LABEL[SSO_PROVIDER]}</Text>
            <View style={styles.verified}>
              <Ionicons name="checkmark-circle" size={15} color="#1E8E4E" />
              <Text style={styles.verifiedText}>Connected</Text>
            </View>
          </View>
        ) : (
          <>
            <SsoButton provider={SSO_PROVIDER} verb="Connect" onPress={connect} />
            <Text style={styles.hint}>Log in with {SSO_LABEL[SSO_PROVIDER]} if an OTP ever doesn’t arrive.</Text>
          </>
        )}

        {/* Test switch until payments exist */}
        <View style={styles.test}>
          <View style={{ flex: 1 }}>
            <Text style={styles.testTitle}>Hoora Black member</Text>
            <Text style={styles.testSub}>Testing only — preview the member profile</Text>
          </View>
          <Switch
            value={!!blackMember}
            onValueChange={(v) => setProfile({ blackMember: v })}
            trackColor={{ false: '#D9DBE1', true: ink.yellowDeep }}
            thumbColor="#FFFFFF"
          />
        </View>
      </ScrollView>

      <ActionFooter bottomInset={insets.bottom}>
        <PrimaryButton label="Save changes" onPress={save} disabled={!canSave} />
      </ActionFooter>
      <Toast toast={toast} bottom={insets.bottom + 90} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  photoWrap: {
    alignSelf: 'center',
  },
  photo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: ink.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  photoInitials: {
    fontFamily: fonts.extraBold,
    fontSize: 32,
    color: ink.text,
  },
  camera: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: ink.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoHint: {
    marginTop: 8,
    textAlign: 'center',
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: ink.muted,
  },
  label: {
    marginTop: 18,
    marginBottom: 8,
    fontFamily: fonts.bold,
    fontSize: 13,
    color: ink.text,
  },
  input: {
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#DADCE2',
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: ink.text,
  },
  inputOn: {
    borderColor: ink.text,
  },
  inputError: {
    borderColor: ink.red,
  },
  error: {
    marginTop: 6,
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: ink.red,
  },
  hint: {
    marginTop: 8,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: ink.muted,
  },
  locked: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F6F7F9',
    borderColor: '#ECEDF1',
  },
  lockedText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: ink.label,
  },
  verified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: '#1E8E4E',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#DADCE2',
    justifyContent: 'center',
  },
  chipOn: {
    borderColor: ink.yellowDeep,
    backgroundColor: '#FFFBE6',
  },
  chipText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: ink.label,
  },
  chipTextOn: {
    fontFamily: fonts.bold,
    color: ink.text,
  },
  test: {
    marginTop: 26,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#C9CBD2',
    backgroundColor: '#FAFAFB',
  },
  testTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: ink.text,
  },
  testSub: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: ink.muted,
  },
});
