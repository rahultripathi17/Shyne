import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

// App state, saved on the device so onboarding, the address and the garage survive restarts.
// Swap for a backend (e.g. Supabase) once accounts are real.

const STORAGE_KEY = 'hoora/state/v1';

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

export type Gender = 'Male' | 'Female' | 'Other' | 'Prefer not to say';

type Persisted = {
  onboarded: boolean;
  phone: string;
  name?: string;
  email?: string;
  gender?: Gender;
  /** DD/MM/YYYY */
  dob?: string;
  photoUri?: string;
  /** Hoora Black (₹499) member — set by the test switch in Edit profile until payments exist. */
  blackMember?: boolean;
  /** Sign-in accounts linked to this profile (Apple on iPhone, Google on Android). */
  linked?: { apple?: boolean; google?: boolean };
  location: SavedLocation | null;
  cars: SavedCar[];
  selectedCarId?: string;
  bookings: Booking[];
};

type ProfilePatch = Partial<Pick<Persisted, 'name' | 'email' | 'gender' | 'dob' | 'photoUri' | 'blackMember' | 'linked'>>;

const EMPTY: Persisted = { onboarded: false, phone: '', location: null, cars: [], bookings: [] };

type AppState = Persisted & {
  ready: boolean;
  selectedCar: SavedCar | undefined;
  setPhone: (phone: string) => void;
  setProfile: (patch: ProfilePatch) => void;
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
        if (raw) setState({ ...EMPTY, ...(JSON.parse(raw) as Partial<Persisted>) });
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
      setProfile: (patch) => update(() => patch),
      setLocation: (location) => update(() => ({ location })),
      completeOnboarding: () => update(() => ({ onboarded: true })),
      addCar: (car) => {
        const id = newId();
        update((s) => ({ cars: [...s.cars, { ...car, id }], selectedCarId: id }));
      },
      selectCar: (id) => update(() => ({ selectedCarId: id })),
      updateCar: (id, patch) =>
        update((s) => ({ cars: s.cars.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
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
