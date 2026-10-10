import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { type ReactNode, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { BRAND_LOGOS } from '../data/brandLogos';
import { BRANDS, type CarBrand, type CarModel, MODELS } from '../data/cars';
import { MODEL_IMAGES } from '../data/modelImages';
import type { SavedCar } from '../store/AppStore';
import { ink } from './home/homeTheme';
import { ActionFooter, PrimaryButton, TextButton } from './Buttons';
import { FadeIn } from './home/motion';
import { isPlateComplete, PlateField } from './PlateField';
import { fonts, noBounce } from './theme';
import { TopBar } from './TopBar';

const POPULAR = ['maruti-suzuki', 'hyundai', 'tata', 'mahindra', 'kia', 'toyota', 'honda', 'mg'];
const BRAND_GAP = 10;
const SIZES = ['Hatchback', 'Sedan', 'SUV'] as const;

type Step =
  | { kind: 'brand' }
  | { kind: 'model'; brand: CarBrand }
  | { kind: 'details'; model: CarModel; brand: CarBrand }
  | { kind: 'manual'; brand?: CarBrand };

type Props = {
  onDone: (car: Omit<SavedCar, 'id'>) => void;
  /** Called when Back is pressed on the first (brand) step. */
  onExit: () => void;
  /** Title on the first step, e.g. "Select your car". */
  title: string;
  topInset: number;
  bottomInset: number;
  saveLabel?: string;
  /** Extra content under the top bar on the first step (e.g. a Car | Bike switch). */
  accessory?: ReactNode;
};

const brandOf = (slug: string) => BRANDS.find((b) => b.slug === slug);

export function CarPicker({ onDone, onExit, title, topInset, bottomInset, saveLabel = 'Save vehicle', accessory }: Props) {
  const { width } = useWindowDimensions();
  // Four equal brand columns, sized from the grid's measured width (falls back to the screen width).
  const [gridW, setGridW] = useState(width - 32);
  const tileW = Math.floor((gridW - 3 * BRAND_GAP) / 4);
  const [step, setStep] = useState<Step>({ kind: 'brand' });
  const [query, setQuery] = useState('');
  const [plate, setPlate] = useState('');
  const [manualName, setManualName] = useState('');
  const [size, setSize] = useState<(typeof SIZES)[number]>('Sedan');

  const q = query.trim().toLowerCase();

  const go = (next: Step) => {
    void Haptics.selectionAsync();
    setQuery('');
    setStep(next);
    if (next.kind === 'manual') setManualName(next.brand ? `${next.brand.name} ` : '');
  };

  const popular = useMemo(() => POPULAR.map(brandOf).filter((b): b is CarBrand => !!b), []);
  const others = useMemo(() => BRANDS.filter((b) => !POPULAR.includes(b.slug)), []);
  const brandMatches = useMemo(() => (q ? BRANDS.filter((b) => b.name.toLowerCase().includes(q)) : []), [q]);
  const modelMatches = useMemo(() => {
    if (step.kind === 'model') {
      return MODELS.filter((m) => m.brand === step.brand.slug && m.name.toLowerCase().includes(q));
    }
    if (!q) return [];
    return MODELS.filter((m) => `${brandOf(m.brand)?.name ?? ''} ${m.name}`.toLowerCase().includes(q)).slice(0, 40);
  }, [step, q]);

  // One back button, one step at a time.
  const back = () => {
    if (step.kind === 'brand') return onExit();
    if (step.kind === 'details') return go({ kind: 'model', brand: step.brand });
    if (step.kind === 'manual' && step.brand) return go({ kind: 'model', brand: step.brand });
    go({ kind: 'brand' });
  };
  const barTitle =
    step.kind === 'brand'
      ? title
      : step.kind === 'model'
        ? step.brand.name
        : step.kind === 'details'
          ? 'Vehicle details'
          : 'Add your vehicle';
  const bar = (
    <TopBar
      title={barTitle}
      topInset={topInset}
      onBack={back}
      right={
        step.kind === 'model' ? (
          <Image source={BRAND_LOGOS[step.brand.slug]} resizeMode="contain" style={styles.barLogo} />
        ) : undefined
      }
    />
  );

  const save = (car: Omit<SavedCar, 'id'>) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onDone(car);
  };

  const searchBar = (placeholder: string) => (
    <View style={styles.search}>
      <Ionicons name="search" size={18} color={ink.muted} />
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={placeholder}
        placeholderTextColor={ink.faint}
        style={styles.searchInput}
        autoCorrect={false}
        returnKeyType="search"
      />
      {query.length > 0 && (
        <Pressable onPress={() => setQuery('')} hitSlop={10}>
          <Ionicons name="close-circle" size={18} color={ink.faint} />
        </Pressable>
      )}
    </View>
  );

  const modelRow = (m: CarModel, showBrand: boolean) => {
    const brand = brandOf(m.brand);
    return (
      <Pressable
        key={`${m.brand}-${m.name}`}
        onPress={() => brand && go({ kind: 'details', model: m, brand })}
        style={({ pressed }) => [styles.modelRow, pressed && styles.rowPressed]}
        accessibilityRole="button"
        accessibilityLabel={`${brand?.name ?? ''} ${m.name}`}
      >
        <View style={styles.modelThumb}>
          <Image source={MODEL_IMAGES[m.image]} resizeMode="contain" style={styles.modelImg} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.modelName} numberOfLines={1}>
            {showBrand && brand ? `${brand.name} ` : ''}
            {m.name}
          </Text>
          <Text style={styles.modelMeta} numberOfLines={1}>
            {m.body} · {m.fuel}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={ink.faint} />
      </Pressable>
    );
  };

  const cantFind = (brand?: CarBrand) => (
    <Pressable onPress={() => go({ kind: 'manual', brand })} style={styles.cantFind}>
      <View style={styles.cantFindIcon}>
        <Ionicons name="add" size={18} color={ink.text} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cantFindTitle}>Can’t find your vehicle?</Text>
        <Text style={styles.cantFindBody}>Add its name and number yourself</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={ink.faint} />
    </Pressable>
  );

  // ——— Brand step ———
  if (step.kind === 'brand') {
    const tile = (b: CarBrand) => (
      <Pressable
        key={b.slug}
        onPress={() => go({ kind: 'model', brand: b })}
        style={({ pressed }) => [styles.brandTile, { width: tileW }, pressed && styles.rowPressed]}
        accessibilityRole="button"
        accessibilityLabel={b.name}
      >
        <Image source={BRAND_LOGOS[b.slug]} resizeMode="contain" style={styles.brandLogo} />
        <Text style={styles.brandName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
          {b.name}
        </Text>
      </Pressable>
    );
    return (
      <View style={{ flex: 1 }}>
        {bar}
        {accessory}
        <View style={styles.searchWrap}>{searchBar('Search car name or brand')}</View>
        <ScrollView {...noBounce} keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.pad, { paddingBottom: bottomInset + 24 }]}>
          {q ? (
            <>
              {brandMatches.length > 0 && (
                <>
                  <Text style={styles.overline}>BRANDS</Text>
                  <View style={styles.brandGrid}>{brandMatches.map(tile)}</View>
                </>
              )}
              {modelMatches.length > 0 && <Text style={[styles.overline, { marginTop: 18 }]}>MODELS</Text>}
              <View style={{ gap: 8 }}>{modelMatches.map((m) => modelRow(m, true))}</View>
              {brandMatches.length === 0 && modelMatches.length === 0 && (
                <Text style={styles.empty}>No cars match “{query}”</Text>
              )}
            </>
          ) : (
            <FadeIn>
              <View onLayout={(e) => setGridW(e.nativeEvent.layout.width)} />
              <Text style={styles.overline}>POPULAR IN INDIA</Text>
              <View style={styles.brandGrid}>{popular.map(tile)}</View>
              <Text style={[styles.overline, { marginTop: 22 }]}>ALL BRANDS</Text>
              <View style={styles.brandGrid}>{others.map(tile)}</View>
            </FadeIn>
          )}
          <View style={{ marginTop: 20 }}>{cantFind()}</View>
        </ScrollView>
      </View>
    );
  }

  // ——— Model step ———
  if (step.kind === 'model') {
    return (
      <View style={{ flex: 1 }}>
        {bar}
        <View style={styles.searchWrap}>{searchBar(`Search ${step.brand.name} models`)}</View>
        <FlatList
          {...noBounce}
          data={modelMatches}
          keyExtractor={(m) => `${m.brand}-${m.name}`}
          renderItem={({ item }) => modelRow(item, false)}
          contentContainerStyle={[styles.pad, { gap: 8, paddingBottom: bottomInset + 24 }]}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<Text style={styles.empty}>No models match “{query}”</Text>}
          ListFooterComponent={<View style={{ marginTop: 12 }}>{cantFind(step.brand)}</View>}
        />
      </View>
    );
  }

  // ——— Details / manual step ———
  const isManual = step.kind === 'manual';
  const canSave = isManual ? manualName.trim().length > 1 : true;
  const plateDone = isPlateComplete(plate);

  // Save with the number, or skip for now to save without it.
  const finish = (withPlate: boolean) => {
    if (!canSave || (withPlate && !plateDone)) return;
    const plateValue = withPlate ? plate.trim() : undefined;
    if (step.kind === 'details') {
      save({
        type: 'car',
        brand: step.brand.slug,
        brandName: step.brand.name,
        model: step.model.name,
        body: step.model.body,
        image: step.model.image,
        plate: plateValue,
      });
    } else {
      save({
        type: 'car',
        brand: step.brand?.slug ?? '',
        brandName: '',
        model: manualName.trim(),
        body: size,
        plate: plateValue,
      });
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {bar}
      <ScrollView {...noBounce} keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.pad, { paddingBottom: 24 }]}>
        {step.kind === 'details' ? (
          <FadeIn style={styles.stage}>
            <Image source={MODEL_IMAGES[step.model.image]} resizeMode="contain" style={styles.stageImg} />
            <Text style={styles.stageBrand}>{step.brand.name}</Text>
            <Text style={styles.stageName}>{step.model.name}</Text>
            <View style={styles.chips}>
              <Text style={styles.chip}>{step.model.body}</Text>
              <Text style={styles.chip}>{step.model.fuel}</Text>
            </View>
          </FadeIn>
        ) : (
          <>
            <Text style={styles.formBody}>Tell us the name and size so we can price it right.</Text>
            <Text style={styles.label}>Vehicle name</Text>
            <TextInput
              value={manualName}
              onChangeText={setManualName}
              placeholder="e.g. Tata Sierra"
              placeholderTextColor={ink.faint}
              style={styles.input}
            />
            <Text style={styles.label}>Size</Text>
            <View style={styles.sizeRow}>
              {SIZES.map((s) => (
                <Pressable key={s} onPress={() => setSize(s)} style={[styles.sizeChip, size === s && styles.sizeChipOn]}>
                  <Text style={[styles.sizeText, size === s && styles.sizeTextOn]}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <Text style={styles.label}>Vehicle number</Text>
        <PlateField value={plate} onChange={setPlate} />
      </ScrollView>

      <ActionFooter bottomInset={bottomInset}>
        <PrimaryButton label={saveLabel} onPress={() => finish(true)} disabled={!(canSave && plateDone)} />
        <TextButton label="Skip for now" onPress={() => finish(false)} />
      </ActionFooter>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  pad: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: ink.card,
    borderWidth: 1,
    borderColor: ink.line,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: ink.text,
  },
  overline: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 0.9,
    color: ink.muted,
    marginBottom: 10,
  },
  brandGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: BRAND_GAP,
  },
  brandTile: {
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderRadius: 16,
    backgroundColor: ink.card,
    borderWidth: 1,
    borderColor: ink.line,
  },
  brandLogo: {
    width: 54,
    height: 34,
  },
  brandName: {
    marginTop: 8,
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: ink.label,
  },
  rowPressed: {
    backgroundColor: '#F1F2F5',
  },
  modelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    paddingRight: 14,
    borderRadius: 16,
    backgroundColor: ink.card,
    borderWidth: 1,
    borderColor: ink.line,
  },
  modelThumb: {
    width: 84,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F4F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modelImg: {
    width: 78,
    height: 52,
  },
  modelName: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: ink.text,
  },
  modelMeta: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: ink.muted,
    marginTop: 2,
  },
  empty: {
    textAlign: 'center',
    fontFamily: fonts.medium,
    fontSize: 14,
    color: ink.muted,
    marginVertical: 24,
  },
  cantFind: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#C9CBD2',
  },
  cantFindIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: ink.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cantFindTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: ink.text,
  },
  cantFindBody: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: ink.muted,
    marginTop: 1,
  },
  barLogo: {
    width: 44,
    height: 28,
  },
  stage: {
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 22,
    backgroundColor: '#F4F5F7',
  },
  stageImg: {
    width: 270,
    height: 170,
  },
  stageBrand: {
    marginTop: 10,
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: ink.muted,
  },
  stageName: {
    fontFamily: fonts.extraBold,
    fontSize: 24,
    letterSpacing: -0.5,
    color: ink.text,
  },
  chips: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  chip: {
    fontFamily: fonts.semiBold,
    fontSize: 11.5,
    color: ink.label,
    backgroundColor: ink.card,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  formBody: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    lineHeight: 19,
    color: ink.muted,
    marginTop: 4,
  },
  label: {
    marginTop: 20,
    marginBottom: 8,
    fontFamily: fonts.bold,
    fontSize: 13,
    color: ink.text,
  },
  input: {
    height: 50,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: ink.card,
    borderWidth: 1,
    borderColor: ink.line,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: ink.text,
  },
  sizeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sizeChip: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ink.card,
    borderWidth: 1,
    borderColor: ink.line,
  },
  sizeChipOn: {
    backgroundColor: ink.text,
    borderColor: ink.text,
  },
  sizeText: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: ink.text,
  },
  sizeTextOn: {
    color: '#FFFFFF',
  },
});
