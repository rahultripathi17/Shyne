import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// App state, saved on the device so onboarding, the address and the garage survive restarts.
// Swap for a backend (e.g. Supabase) once accounts are real.

const STORAGE_KEY = 'hoora/state/v1';
const DEMO_PHONE = '+91 86687 15479';
const DEMO_NAME = 'Rahul Tripathi';
const DEMO_EMAIL = 'rahultripathixx@gmail.com';

export type VehicleType = 'car' | 'bike';

export type SavedCar = {
  id: string;
  type: VehicleType;
  /** Brand slug from the car dataset; empty when the brand was typed in manually or it's a bike. */
  brand: string;
  brandName: string;
  model: string;
  body: string;
  /** Dataset image key (brand/model) when the model came from the catalogue. */
  image?: string;
  /** Registration number, e.g. MH 20 AB 1234. */
  plate?: string;
};

export type SavedLocation = {
  /** Bold line, e.g. "Home" or the detected area name. */
  label: string;
  /** One-line full address. */
  address: string;
  detected: boolean;
};

export type Booking = {
  id: string;
  serviceId: string;
  car: SavedCar;
  date: string; // ISO date, e.g. 2026-10-12
  slot: string; // e.g. "09:00 AM"
  address: string;
  addOnIds: string[];
  total: number;
  status: 'Confirmed' | 'Completed' | 'Cancelled';
  createdAt: number;
};

export type Gender = 'Male' | 'Female';

export type DockPreview = {
  /** The whole dock is switched off. */
  off?: boolean;
  /** Dock states switched off, by key (see DOCK_STATES). */
  hidden?: string[];
};

type Persisted = {
  onboarded: boolean;
  phone: string;
  name?: string;
  email?: string;
  /** Keeps a deliberately removed demo email hidden across app restarts. */
  emailRemoved?: boolean;
  gender?: Gender;
  /** DD/MM/YYYY */
  dob?: string;
  photoUri?: string;
  /** Hoora Black (₹499) member — set by the test switch in Edit profile until payments exist. */
  blackMember?: boolean;
  /** Sign-in accounts linked to this profile (Apple on iPhone, Google on Android). */
  linked?: { apple?: boolean; google?: boolean };
  /** Preview build: booking dock above the nav — all on unless switched off in Configuration. */
  dockPreview?: DockPreview;
  location: SavedLocation | null;
  cars: SavedCar[];
  selectedCarId?: string;
  bookings: Booking[];
};

type ProfilePatch = Partial<
  Pick<Persisted, 'name' | 'email' | 'emailRemoved' | 'gender' | 'dob' | 'photoUri' | 'blackMember' | 'linked'>
>;

const EMPTY: Persisted = { onboarded: false, phone: '', location: null, cars: [], bookings: [] };
type DemoProvider = 'apple' | 'google';

const demoIdentity = (provider: DemoProvider = 'google') => ({
  phone: DEMO_PHONE,
  name: DEMO_NAME,
  email: DEMO_EMAIL,
  emailRemoved: false,
  linked: { [provider]: true },
  photoUri: undefined,
});

/** Carry older prototype profiles forward to the current demo identity and sign-in model. */
function migrateSavedProfile(saved: Partial<Persisted>): Partial<Persisted> {
  const profile = { ...saved };
  if (profile.name === 'Siddharth Jain' || (profile.onboarded && !profile.name)) {
    profile.name = DEMO_NAME;
  }
  if (profile.email === 'siddharth.jain@example.com' || profile.email === 'siddharth.jain@privaterelay.example.com') {
    profile.email = DEMO_EMAIL;
  }
  if (profile.onboarded) {
    profile.phone = DEMO_PHONE;
    if (profile.emailRemoved) {
      profile.email = undefined;
      profile.linked = undefined;
    } else {
      profile.email = DEMO_EMAIL;
      profile.linked = profile.linked?.apple ? { apple: true } : { google: true };
    }
  }
  if (profile.gender !== 'Male' && profile.gender !== 'Female') delete profile.gender;
  return profile;
}

type AppState = Persisted & {
  ready: boolean;
  selectedCar: SavedCar | undefined;
  setPhone: (phone: string) => void;
  activateDemoAccount: (provider?: DemoProvider) => void;
  setProfile: (patch: ProfilePatch) => void;
  setDockPreview: (patch: DockPreview) => void;
  setLocation: (location: SavedLocation) => void;
  completeOnboarding: () => void;
  addCar: (car: Omit<SavedCar, 'id'>) => void;
  selectCar: (id: string) => void;
  updateCar: (id: string, patch: Partial<Omit<SavedCar, 'id'>>) => void;
  removeCar: (id: string) => void;
  addBooking: (booking: Omit<Booking, 'id' | 'status' | 'createdAt'>) => void;
  /** Clears everything and returns to onboarding (used by Log out). */
  signOut: () => void;
};

const AppStoreContext = createContext<AppState | null>(null);

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setState({ ...EMPTY, ...migrateSavedProfile(JSON.parse(raw) as Partial<Persisted>) });
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  const update = useCallback((patch: (s: Persisted) => Partial<Persisted>) => {
    setState((s) => ({ ...s, ...patch(s) }));
  }, []);

  const value = useMemo<AppState>(
    () => ({
      ...state,
      ready,
      selectedCar: state.cars.find((c) => c.id === state.selectedCarId) ?? state.cars[0],
      setPhone: (phone) => update(() => ({ phone })),
      activateDemoAccount: (provider) => update(() => demoIdentity(provider)),
      setProfile: (patch) => update(() => patch),
      setDockPreview: (patch) => update((s) => ({ dockPreview: { ...s.dockPreview, ...patch } })),
      setLocation: (location) => update(() => ({ location })),
      completeOnboarding: () =>
        update((s) => ({
          onboarded: true,
          ...demoIdentity(s.linked?.apple ? 'apple' : 'google'),
        })),
      addCar: (car) => {
        const id = newId();
        update((s) => ({ cars: [...s.cars, { ...car, id }], selectedCarId: id }));
      },
      selectCar: (id) => update(() => ({ selectedCarId: id })),
      updateCar: (id, patch) => update((s) => ({ cars: s.cars.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      removeCar: (id) =>
        update((s) => {
          const cars = s.cars.filter((c) => c.id !== id);
          return { cars, selectedCarId: s.selectedCarId === id ? cars[0]?.id : s.selectedCarId };
        }),
      addBooking: (booking) =>
        update((s) => ({
          bookings: [{ ...booking, id: newId(), status: 'Confirmed', createdAt: Date.now() }, ...s.bookings],
        })),
      signOut: () => setState(EMPTY),
    }),
    [state, ready, update],
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error('useAppStore must be used inside AppStoreProvider');
  return ctx;
}
