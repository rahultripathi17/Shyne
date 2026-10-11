import { StyleSheet, Text, View } from 'react-native';

import { fonts } from '../theme';
import { ART, type Art, FittedArt } from './artwork';
import { ink, SPACE } from './homeTheme';
import { PressableScale } from './motion';

export type CategoryId =
  | 'wash'
  | 'garage'
  | 'accessories'
  | 'denting'
  | 'ac'
  | 'tyres'
  | 'batteries'
  | 'challan'
  | 'insurance'
  | 'fastag'
  | 'qr'
  | 'roadside'
  | 'ev'
  | 'used-cars'
  | 'dealers';

// ——— Main categories: wash on its own row, then garage and accessories side by side ———

export function MainCategories({ width, onPress }: { width: number; onPress: (id: CategoryId) => void }) {
  const gap = 12;
  const halfW = (width - gap) / 2;
  const washArtW = Math.round(width * 0.44);

  return (
    <View style={{ gap }}>
      <PressableScale
        onPress={() => onPress('wash')}
        scaleTo={0.98}
        style={styles.wash}
        accessibilityLabel="Car and bike wash"
      >
        <View style={styles.washText}>
          <Text style={styles.washTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
            Car & Bike Wash
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            At your doorstep
          </Text>
        </View>
        <FittedArt art={ART.wash} box={{ w: washArtW, h: 92 }} align="center" />
      </PressableScale>

      <View style={[styles.duo, { gap }]}>
        <SmallCard
          title={'Garage\nService'}
          sub="Free pickup & drop"
          art={ART.garage}
          width={halfW}
          onPress={() => onPress('garage')}
        />
        <SmallCard
          title={'Products &\nAccessories'}
          sub="Care kits & add-ons"
          art={ART.accessories}
          width={halfW}
          onPress={() => onPress('accessories')}
        />
      </View>
    </View>
  );
}

/** Half-width card: name and one line up top, the picture filling the rest. */
function SmallCard(props: { title: string; sub: string; art: Art; width: number; onPress: () => void }) {
  const { title, sub, art, width, onPress } = props;
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.97}
      style={[styles.small, { width }]}
      accessibilityLabel={title.replace('\n', ' ')}
    >
      <Text style={styles.smallTitle} numberOfLines={2}>
        {title}
      </Text>
      <Text style={styles.sub} numberOfLines={1}>
        {sub}
      </Text>
      <View style={styles.smallArt}>
        <FittedArt art={art} box={{ w: width - 28, h: 72 }} align="center" />
      </View>
    </PressableScale>
  );
}

// ——— All other services, grouped and ranked, in one panel ———

type Tile = { id: CategoryId; label: string; art: Art; badge?: string };
type Group = { title: string; tiles: Tile[] };

export const GROUPS: Group[] = [
  {
    title: 'Repair & maintenance',
    tiles: [
      { id: 'denting', label: 'Denting &\nPainting', art: ART.denting },
      { id: 'ac', label: 'AC\nService', art: ART.ac },
      { id: 'tyres', label: 'Tyres &\nWheels', art: ART.tyres },
      { id: 'batteries', label: 'Batteries', art: ART.batteries },
    ],
  },
  {
    title: 'Papers & payments',
    tiles: [
      { id: 'challan', label: 'Clear My\nChallan', art: ART.challan },
      { id: 'insurance', label: 'Insurance', art: ART.insurance },
      { id: 'fastag', label: 'FASTag', art: ART.fastag },
      { id: 'qr', label: 'Connect\nQR', art: ART.qr },
    ],
  },
  {
    title: 'On the road',
    tiles: [
      { id: 'roadside', label: 'Roadside\nAssistance', art: ART.roadside },
      { id: 'ev', label: 'EV\nCharging', art: ART.ev },
      { id: 'used-cars', label: 'Used\nCars', art: ART.usedCars },
      { id: 'dealers', label: 'Car\nDealers', art: ART.dealers },
    ],
  },
];

export function AllServices({ width, onPress }: { width: number; onPress: (id: CategoryId) => void }) {
  const inner = width - 28; // panel padding
  const colW = inner / 4;
  const art = { w: Math.min(64, colW - 12), h: 46 };

  // One box per group (PhonePe style): title inside, four services below, no divider lines.
  return (
    <View style={{ gap: SPACE }}>
      {GROUPS.map((g) => (
        <View key={g.title} style={styles.panel}>
          <Text style={styles.groupTitle}>{g.title}</Text>
          <View style={styles.row}>
            {g.tiles.map((t) => (
              <PressableScale
                key={t.id}
                onPress={() => onPress(t.id)}
                style={[styles.tile, { width: colW }]}
                scaleTo={0.94}
                accessibilityLabel={t.label.replace('\n', ' ')}
              >
                <View style={styles.artWrap}>
                  <FittedArt art={t.art} box={art} />
                  {t.badge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{t.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.tileLabel} numberOfLines={2}>
                  {t.label}
                </Text>
              </PressableScale>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const card = {
  backgroundColor: ink.card,
  borderRadius: 20,
  borderWidth: 1,
  borderColor: '#ECEDF1',
};

const styles = StyleSheet.create({
  // Art sits straight on the white cards, no box behind it.
  wash: {
    ...card,
    height: 112,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 18,
    paddingRight: 10,
    overflow: 'hidden',
  },
  washText: {
    flex: 1,
    paddingRight: 8,
  },
  washTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: -0.4,
    color: ink.text,
  },
  sub: {
    marginTop: 3,
    fontFamily: fonts.medium,
    fontSize: 12.5,
    lineHeight: 17,
    color: ink.muted,
  },
  duo: {
    flexDirection: 'row',
  },
  small: {
    ...card,
    height: 172,
    paddingHorizontal: 14,
    paddingTop: 14,
    overflow: 'hidden',
  },
  smallTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.3,
    color: ink.text,
  },
  smallArt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 4,
  },
  panel: {
    ...card,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 6,
  },
  groupTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
    letterSpacing: -0.2,
    color: ink.text,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
  },
  tile: {
    alignItems: 'center',
    paddingBottom: 12,
  },
  artWrap: {
    width: 64,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: ink.red,
    borderRadius: 7,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1.5,
    borderColor: ink.card,
  },
  badgeText: {
    fontFamily: fonts.extraBold,
    fontSize: 8.5,
    color: '#FFFFFF',
  },
  tileLabel: {
    marginTop: 6,
    minHeight: 30,
    fontFamily: fonts.semiBold,
    fontSize: 12,
    lineHeight: 15,
    color: ink.label,
    textAlign: 'center',
  },
});
