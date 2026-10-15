import { StyleSheet, Text, View } from 'react-native';

import { fonts } from '../theme';
import { ART, type Art, FittedArt } from './artwork';
import { ink } from './homeTheme';
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

// ——— The three main services, side by side (one row, equal weight) ———

const MAIN: { id: CategoryId; title: string; sub: string; art: Art }[] = [
  { id: 'wash', title: 'Car & Bike Wash', sub: 'At your doorstep', art: ART.wash },
  { id: 'garage', title: 'Garage Service', sub: 'Pickup & drop', art: ART.garage },
  { id: 'accessories', title: 'Products', sub: 'Care kits & more', art: ART.accessories },
];

export function MainCategories({ width, onPress }: { width: number; onPress: (id: CategoryId) => void }) {
  const gap = 10;
  const tileW = (width - gap * 2) / 3;

  return (
    <View style={[styles.duo, { gap }]}>
      {MAIN.map((m) => (
        <PressableScale
          key={m.id}
          onPress={() => onPress(m.id)}
          scaleTo={0.97}
          style={[styles.main, { width: tileW }]}
          accessibilityLabel={m.title}
        >
          <View style={styles.mainArt}>
            <FittedArt art={m.art} box={{ w: tileW - 20, h: 58 }} align="center" />
          </View>
          <Text style={styles.mainTitle} numberOfLines={2}>
            {m.title}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {m.sub}
          </Text>
        </PressableScale>
      ))}
    </View>
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
  const inner = width - 24; // panel padding
  const colW = inner / 4;
  const art = { w: Math.min(52, colW - 18), h: 40 };

  // One card per group: its name, then its four services in a row.
  return (
    <View style={styles.groups}>
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
  borderRadius: 16,
  borderWidth: 1,
  borderColor: '#ECEDF1',
};

const styles = StyleSheet.create({
  duo: {
    flexDirection: 'row',
  },
  // Art sits straight on the white tiles, no box behind it.
  main: {
    ...card,
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 12,
  },
  mainArt: {
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  mainTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 13.5,
    lineHeight: 17,
    letterSpacing: -0.2,
    color: ink.text,
  },
  sub: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 15,
    color: ink.muted,
  },
  groups: {
    gap: 12,
  },
  panel: {
    ...card,
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 4,
  },
  groupTitle: {
    marginLeft: 4,
    marginBottom: 12,
    fontFamily: fonts.semiBold,
    fontSize: 14.5,
    letterSpacing: -0.2,
    color: ink.text,
  },
  row: {
    flexDirection: 'row',
  },
  tile: {
    alignItems: 'center',
    paddingBottom: 12,
  },
  artWrap: {
    width: 52,
    height: 44,
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
    marginTop: 5,
    minHeight: 28,
    fontFamily: fonts.medium,
    fontSize: 11.5,
    lineHeight: 14,
    color: ink.label,
    textAlign: 'center',
  },
});
