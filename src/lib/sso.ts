import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

/** One-tap sign-in per platform: Apple on iPhone, Google everywhere else. */
export type SsoProvider = 'apple' | 'google';
export const SSO_PROVIDER: SsoProvider = Platform.OS === 'ios' ? 'apple' : 'google';
export const SSO_LABEL: Record<SsoProvider, string> = { apple: 'Apple', google: 'Google' };

export type SsoResult =
  | { ok: true; name?: string; email?: string }
  | { ok: false; reason: 'cancelled' | 'unavailable' | 'not-configured' | 'failed' };

async function signInWithApple(): Promise<SsoResult> {
  if (Platform.OS !== 'ios' || !(await AppleAuthentication.isAvailableAsync())) {
    return { ok: false, reason: 'unavailable' };
  }
  try {
    const cred = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    // Apple shares the name and email only the first time a user signs in to the app.
    const name = [cred.fullName?.givenName, cred.fullName?.familyName].filter(Boolean).join(' ') || undefined;
    return { ok: true, name, email: cred.email ?? undefined };
  } catch (e) {
    const code = (e as { code?: string }).code;
    return { ok: false, reason: code === 'ERR_REQUEST_CANCELED' ? 'cancelled' : 'failed' };
  }
}

/**
 * Google sign-in needs OAuth client IDs from Google Cloud (Android, iOS and web) and a backend to
 * verify the token. Until those exist, the button explains it isn't ready instead of failing silently.
 */
async function signInWithGoogle(): Promise<SsoResult> {
  return { ok: false, reason: 'not-configured' };
}

export const signInWith = (provider: SsoProvider) =>
  provider === 'apple' ? signInWithApple() : signInWithGoogle();

export const ssoErrorMessage = (reason: Exclude<SsoResult, { ok: true }>['reason']) =>
  ({
    cancelled: '',
    unavailable: 'Apple sign-in isn’t available on this device',
    'not-configured': 'Google sign-in is coming soon',
    failed: 'Couldn’t sign you in. Please try again.',
  })[reason];
