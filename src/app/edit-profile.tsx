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
import { signInWith, SSO_LABEL, ssoErrorMessage, type SsoProvider } from '../lib/sso';
import { type Gender, useAppStore } from '../store/AppStore';

const GENDERS: Gender[] = ['Male', 'Female', 'Other', 'Prefer not to say'];
const PROFILE_AVATAR = require('../../assets/profile/siddharth-jain.webp');

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

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const store = useAppStore();
  const { phone, linked, blackMember, setProfile } = store;
  const toast = useToast();

  const [name, setName] = useState(store.name ?? '');
  const [gender, setGender] = useState<Gender | undefined>(store.gender);
  const [dob, setDob] = useState(store.dob ?? '');
  const [photoUri, setPhotoUri] = useState(store.photoUri);
  const [failedPhotoUri, setFailedPhotoUri] = useState<string>();
  const [changingAccount, setChangingAccount] = useState(false);
  const [focus, setFocus] = useState<string>();
  const selectedProvider: SsoProvider | undefined = linked?.apple ? 'apple' : linked?.google ? 'google' : undefined;

  const trimmedName = name.trim();
  const nameParts = trimmedName.toLowerCase().split(/\s+/).filter(Boolean);
  const sampleLocalPart = [nameParts[0], nameParts.length > 1 ? nameParts[nameParts.length - 1] : undefined].filter(Boolean).join('.') || 'hoora.user';
  const linkedEmail = store.email || `${sampleLocalPart}@${selectedProvider === 'apple' ? 'icloud.com' : 'gmail.com'}`;
  const dobOk = isDob(dob);
  const changed =
    trimmedName !== (store.name ?? '') ||
    gender !== store.gender ||
    dob !== (store.dob ?? '') ||
    photoUri !== store.photoUri;
  const canSave = trimmedName.length > 1 && dobOk && changed;

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };

  const connect = async (provider: SsoProvider) => {
    const result = await signInWith(provider);
    if (!result.ok) {
      const msg = ssoErrorMessage(result.reason);
      if (msg) toast.show(msg);
      return;
    }
    if (!trimmedName && result.name) setName(result.name);
    setProfile({ linked: { [provider]: true }, email: result.email });
    setChangingAccount(false);
    toast.show(`${SSO_LABEL[provider]} account connected`);
  };

  const save = () => {
    if (!canSave) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setProfile({
      name: trimmedName,
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
            {photoUri && photoUri !== failedPhotoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoImg} onError={() => setFailedPhotoUri(photoUri)} />
            ) : (
              <Image source={PROFILE_AVATAR} style={styles.photoImg} />
            )}
          </View>
          <View style={styles.camera}>
            <Ionicons name="camera" size={16} color={ink.text} />
          </View>
        </Pressable>
        <Text style={styles.photoHint}>{photoUri ? 'Tap to change photo' : 'Tap to add your photo'}</Text>

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

        <Text style={styles.label}>Email & sign-in</Text>
        <View style={styles.accountCard}>
          {selectedProvider ? (
            <View style={styles.accountRow}>
              <View style={styles.accountMark}>
                <Ionicons name={selectedProvider === 'apple' ? 'logo-apple' : 'logo-google'} size={22} color={ink.text} />
              </View>
              <View style={styles.accountCopy}>
                <Text style={styles.accountProvider}>{SSO_LABEL[selectedProvider]}</Text>
                <Text style={styles.accountEmail}>{linkedEmail}</Text>
              </View>
              <Pressable onPress={() => setChangingAccount((value) => !value)} style={styles.changeAccount} accessibilityRole="button" accessibilityLabel="Change sign-in account">
                <Text style={styles.changeAccountText}>{changingAccount ? 'Cancel' : 'Change'}</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={styles.accountTitle}>Connect an account</Text>
              <Text style={styles.accountDescription}>Choose how you’d like to sign in.</Text>
            </>
          )}
          {(!selectedProvider || changingAccount) && (
            <View style={[styles.accountOptions, !!selectedProvider && styles.accountOptionsSeparated]}>
              <SsoButton provider="google" onPress={() => void connect('google')} />
              {Platform.OS === 'ios' && <SsoButton provider="apple" onPress={() => void connect('apple')} />}
            </View>
          )}
        </View>

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
  accountCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ink.line,
    backgroundColor: '#FAFAFB',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  accountMark: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: ink.line,
  },
  accountCopy: {
    flex: 1,
    minWidth: 0,
  },
  accountProvider: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: ink.text,
  },
  accountEmail: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    color: ink.muted,
  },
  changeAccount: {
    minHeight: 36,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeAccountText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: ink.text,
    textDecorationLine: 'underline',
  },
  accountTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: ink.text,
  },
  accountDescription: {
    marginTop: 3,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: ink.muted,
  },
  accountOptions: {
    gap: 8,
    marginTop: 12,
  },
  accountOptionsSeparated: {
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: ink.line,
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
