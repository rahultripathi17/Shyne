import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { type ComponentProps, Fragment, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ink } from '../components/home/homeTheme';
import { fonts, noBounce } from '../components/theme';
import { Toast, useToast } from '../components/Toast';
import { TopBar } from '../components/TopBar';
import { signInWith, SSO_LABEL, SSO_PROVIDER, ssoErrorMessage } from '../lib/sso';
import { useAppStore } from '../store/AppStore';

type IconName = ComponentProps<typeof Ionicons>['name'];
type Row = { key: string; label: string; icon: IconName; value?: string; danger?: boolean };

/** Account Settings — sign-in, privacy, about & legal, and account actions in one place. */
export default function AccountSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { phone, name, email, linked, setProfile, signOut } = useAppStore();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const toast = useToast();
  const isLinked = !!linked?.[SSO_PROVIDER];

  const connect = async () => {
    if (isLinked) return;
    const result = await signInWith(SSO_PROVIDER);
    if (!result.ok) {
      const msg = ssoErrorMessage(result.reason);
      if (msg) toast.show(msg);
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setProfile({
      linked: { ...linked, [SSO_PROVIDER]: true },
      ...(!name && result.name ? { name: result.name } : {}),
      ...(!email && result.email ? { email: result.email } : {}),
    });
    toast.show(`${SSO_LABEL[SSO_PROVIDER]} account connected`);
  };

  const sections: { title: string; rows: Row[] }[] = [
    {
      title: 'Sign-in',
      rows: [
        { key: 'phone', label: 'Mobile number', icon: 'call-outline', value: phone || '—' },
        {
          key: 'sso',
          label: `${SSO_LABEL[SSO_PROVIDER]} account`,
          icon: SSO_PROVIDER === 'apple' ? 'logo-apple' : 'logo-google',
          value: isLinked ? 'Connected' : 'Connect',
        },
      ],
    },
    {
      title: 'Privacy',
      rows: [
        { key: 'tracking', label: 'Manage app tracking', icon: 'finger-print-outline' },
        { key: 'location', label: 'Location access', icon: 'navigate-outline' },
      ],
    },
    {
      title: 'About',
      rows: [
        { key: 'about', label: 'About Hoora', icon: 'information-circle-outline' },
        { key: 'terms', label: 'Terms & Conditions', icon: 'document-text-outline' },
        { key: 'privacy', label: 'Privacy Policy', icon: 'shield-checkmark-outline' },
      ],
    },
  ];

  const onRow = (key: string, label: string) => {
    if (key === 'sso') void connect();
    else if (key === 'tracking' || key === 'location') void Linking.openSettings();
    else if (key !== 'phone') toast.show(`${label} — coming soon`);
  };

  return (
    <View style={styles.screen}>
      <TopBar title="Account settings" topInset={insets.top} onBack={() => router.back()} />
      <ScrollView {...noBounce} contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]}>
        {sections.map((sec) => (
          <Fragment key={sec.title}>
            <Text style={styles.section}>{sec.title}</Text>
            <View style={styles.card}>
              {sec.rows.map((r, i) => (
                <Fragment key={r.key}>
                  {i > 0 && <View style={styles.rule} />}
                  <Pressable
                    onPress={() => onRow(r.key, r.label)}
                    disabled={r.key === 'phone'}
                    style={({ pressed }) => [styles.row, pressed && { backgroundColor: '#FAFAFB' }]}
                    accessibilityRole="button"
                  >
                    <Ionicons name={r.icon} size={20} color={ink.text} />
                    <Text style={styles.label}>{r.label}</Text>
                    {r.value ? (
                      <Text
                        style={[
                          styles.value,
                          r.key === 'sso' && !isLinked && styles.valueAction,
                          r.key === 'sso' && isLinked && styles.valueOk,
                        ]}
                      >
                        {r.value}
                      </Text>
                    ) : null}
                    {r.key === 'phone' ? (
                      <Ionicons name="checkmark-circle" size={16} color="#1E8E4E" />
                    ) : (
                      <Ionicons name="chevron-forward" size={18} color={ink.faint} />
                    )}
                  </Pressable>
                </Fragment>
              ))}
            </View>
          </Fragment>
        ))}

        <Text style={styles.section}>Account</Text>
        <View style={styles.card}>
          <Pressable onPress={signOut} style={({ pressed }) => [styles.row, pressed && { backgroundColor: '#FAFAFB' }]} accessibilityRole="button">
            <Ionicons name="log-out-outline" size={20} color={ink.text} />
            <Text style={styles.label}>Log out</Text>
          </Pressable>
          <View style={styles.rule} />
          {confirmDelete ? (
            <View style={styles.confirm}>
              <Text style={styles.confirmTitle}>Delete your Hoora account?</Text>
              <Text style={styles.confirmBody}>
                Your profile, vehicles, bookings and Hoora Points will be removed. This can’t be undone.
              </Text>
              <View style={styles.confirmRow}>
                <Pressable onPress={() => setConfirmDelete(false)} style={styles.keep} accessibilityRole="button">
                  <Text style={styles.keepText}>Keep account</Text>
                </Pressable>
                <Pressable onPress={signOut} style={styles.delete} accessibilityRole="button">
                  <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={() => setConfirmDelete(true)}
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: '#FFF7F7' }]}
              accessibilityRole="button"
            >
              <Ionicons name="trash-outline" size={20} color={ink.red} />
              <Text style={[styles.label, { color: ink.red }]}>Delete account</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
      <Toast toast={toast} bottom={insets.bottom + 24} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },
  body: {
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 18,
    marginBottom: 8,
    marginLeft: 4,
    fontFamily: fonts.bold,
    fontSize: 13,
    color: ink.muted,
  },
  card: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: ink.line,
    overflow: 'hidden',
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 48,
    backgroundColor: '#E2E3E8',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    height: 54,
    paddingHorizontal: 16,
  },
  label: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: ink.text,
  },
  value: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: ink.muted,
  },
  valueAction: {
    fontFamily: fonts.bold,
    color: ink.gold,
  },
  valueOk: {
    color: '#1E8E4E',
  },
  confirm: {
    padding: 16,
    backgroundColor: '#FFF7F7',
  },
  confirmTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
    color: ink.text,
  },
  confirmBody: {
    marginTop: 4,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 19,
    color: ink.muted,
  },
  confirmRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  keep: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: ink.line,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keepText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: ink.text,
  },
  delete: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: ink.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
