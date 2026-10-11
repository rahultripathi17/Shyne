import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { type ComponentProps, Fragment, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ink } from '../components/home/homeTheme';
import { fonts, noBounce } from '../components/theme';
import { Toast, useToast } from '../components/Toast';
import { TopBar } from '../components/TopBar';
import { useAppStore } from '../store/AppStore';

type IconName = ComponentProps<typeof Ionicons>['name'];

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
type Row = { key: string; label: string; icon: IconName };

/** Account Settings — privacy, about & legal, then logging out and deleting the account. */
export default function AccountSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAppStore();
  const [confirm, setConfirm] = useState<'logout' | 'delete'>();
  const toast = useToast();

  // Privacy, about & legal, then the account actions last. Sign-in details live in Edit profile.
  const sections: { title: string; rows: Row[] }[] = [
    {
      title: 'Privacy',
      rows: [{ key: 'tracking', label: 'Manage app tracking', icon: 'finger-print-outline' }],
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
    if (key === 'tracking') void Linking.openSettings();
    else toast.show(`${label} — coming soon`);
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
                    style={({ pressed }) => [styles.row, pressed && { backgroundColor: '#FAFAFB' }]}
                    accessibilityRole="button"
                  >
                    <Ionicons name={r.icon} size={20} color={ink.text} />
                    <Text style={styles.label}>{r.label}</Text>
                    <Ionicons name="chevron-forward" size={18} color={ink.faint} />
                  </Pressable>
                </Fragment>
              ))}
            </View>
          </Fragment>
        ))}

        <Text style={styles.section}>Account</Text>
        <View style={styles.card}>
          {confirm ? (
            <View style={[styles.confirm, confirm === 'logout' && styles.confirmCalm]}>
              <Text style={styles.confirmTitle}>
                {confirm === 'logout' ? 'Log out of Hoora?' : 'Delete your Hoora account?'}
              </Text>
              <Text style={styles.confirmBody}>
                {confirm === 'logout'
                  ? 'You can log back in anytime with your mobile number.'
                  : 'Your profile, vehicles, bookings and Hoora Points will be removed. This can’t be undone.'}
              </Text>
              <View style={styles.confirmRow}>
                <Pressable onPress={() => setConfirm(undefined)} style={styles.keep} accessibilityRole="button">
                  <Text style={styles.keepText}>{confirm === 'logout' ? 'Cancel' : 'Keep account'}</Text>
                </Pressable>
                <Pressable
                  onPress={signOut}
                  style={[styles.delete, confirm === 'logout' && styles.logoutBtn]}
                  accessibilityRole="button"
                >
                  <Text style={styles.deleteText}>{confirm === 'logout' ? 'Log out' : 'Delete'}</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              <Pressable
                onPress={() => setConfirm('logout')}
                style={({ pressed }) => [styles.row, pressed && { backgroundColor: '#FAFAFB' }]}
                accessibilityRole="button"
              >
                <Ionicons name="log-out-outline" size={20} color={ink.text} />
                <Text style={styles.label}>Log out</Text>
              </Pressable>
              <View style={styles.rule} />
              <Pressable
                onPress={() => setConfirm('delete')}
                style={({ pressed }) => [styles.row, pressed && { backgroundColor: '#FFF7F7' }]}
                accessibilityRole="button"
              >
                <Ionicons name="trash-outline" size={20} color={ink.red} />
                <Text style={[styles.label, { color: ink.red }]}>Delete account</Text>
              </Pressable>
            </>
          )}
        </View>

        <Text style={styles.version}>Hoora · Version {APP_VERSION}</Text>
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
  confirm: {
    padding: 16,
    backgroundColor: '#FFF7F7',
  },
  confirmCalm: {
    backgroundColor: '#F7F8FA',
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
  logoutBtn: {
    backgroundColor: ink.text,
  },
  deleteText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  version: {
    marginTop: 22,
    textAlign: 'center',
    fontFamily: fonts.medium,
    fontSize: 12,
    color: ink.faint,
  },
});
