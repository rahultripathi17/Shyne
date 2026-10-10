import { Platform } from 'react-native';

/** Demo identities for the prototype. Replace this module when auth is connected to a backend. */
export type SsoProvider = 'apple' | 'google';
export const SSO_PROVIDER: SsoProvider = Platform.OS === 'ios' ? 'apple' : 'google';
export const SSO_PROVIDERS: SsoProvider[] = Platform.OS === 'ios' ? ['google', 'apple'] : ['google'];
export const SSO_LABEL: Record<SsoProvider, string> = { apple: 'Apple', google: 'Google' };

export type SsoResult =
  | { ok: true; name: string; email: string }
  | { ok: false; reason: 'unavailable' };

const DEMO_ACCOUNTS: Record<SsoProvider, { name: string; email: string }> = {
  google: { name: 'Rahul Tripathi', email: 'rahultripathixx@gmail.com' },
  apple: { name: 'Rahul Tripathi', email: 'rahultripathixx@gmail.com' },
};

export async function signInWith(provider: SsoProvider): Promise<SsoResult> {
  if (provider === 'apple' && Platform.OS !== 'ios') return { ok: false, reason: 'unavailable' };
  return { ok: true, ...DEMO_ACCOUNTS[provider] };
}

export const ssoErrorMessage = (_reason: 'unavailable') => 'Apple sign-in is only available on iPhone';
