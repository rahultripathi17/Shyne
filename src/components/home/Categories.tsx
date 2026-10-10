import { StyleSheet, Text, View } from 'react-native';

import { fonts } from '../theme';
import { ART, type Art, FittedArt, PRODUCT_GROUP, ProductCluster, WASH_GROUP, WashCluster } from './artwork';
import { ink, SPACE } from './homeTheme';
import { PressableScale } from './motion';
import { ScaledBox } from './ScaledBox';

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

// ——— Main categories: wash first, then garage and accessories ———

export function MainCategories({ width, onPress }: { width: number; onPress: (id: CategoryId) => void }) {
  const gap = SPACE;
  const halfW = (width - gap) / 2;
  const panelW = Math.round(width * 0.4);

  return (
    <View style={{ gap }}>
      <PressableScale onPress={() => onPress('wash')} scaleTo={0.98} style={styles.wash} accessibilityLabel="Car and bike wash">
        <View style={styles.washText}>
          <Text style={styles.washTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
            Car & Bike Wash
          </Text>
          <Text style={styles.washSub} numberOfLines={1}>
            At your doorstep
          </Text>
        </View>
        <View style={[styles.washPanel, { width: panelW }]}>
          <ScaledBox designWidth={WASH_GROUP.w} designHeight={WASH_GROUP.h} width={panelW - 10}>
            <WashCluster />
          </ScaledBox>
        </View>
      </PressableScale>

      <View style={[styles.duo, { gap }]}>
        <PressableScale onPress={() => onPress('garage')} scaleTo={0.97} style={[styles.small, { width: halfW }]} accessibilityLabel="Garage service">
          <Text style={styles.smallTitle}>Garage Service</Text>
          <Text style={styles.smallSub}>Free pickup & drop</Text>
          <View style={styles.smallArt}>
            <FittedArt art={ART.garage} box={{ w: 52, h: 42 }} align="bottom" />
          </View>
        </PressableScale>

        <PressableScale onPress={() => onPress('accessories')} scaleTo={0.97} style={[styles.small, { width: halfW }]} accessibilityLabel="Accessories">
          <Text style={styles.smallTitle}>Accessories</Text>
          <Text style={styles.smallSub}>Care kits & add-ons</Text>
          <View style={[styles.smallArt, { right: 6 }]}>
            <ScaledBox designWidth={PRODUCT_GROUP.w} designHeight={PRODUCT_GROUP.h} width={Math.min(92, halfW - 60)}>
              <ProductCluster />
            </ScaledBox>
          </View>
        </PressableScale>
      </View>
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
      { id: 'challan', label: 'Clear\nChallan', art: ART.challan },
      { id: 'insurance', label: 'Insurance', art: ART.insurance },
      { id: 'fastag', label: 'FASTag', art: ART.fastag },
      { id: 'qr', label: 'Connect\nQR', art: ART.qr },
    ],
  },
  {
    title: 'On the road',
    tiles: [
      { id: 'roadside', label: 'Roadside\nHelp', art: ART.roadside },
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
  wash: {
    ...card,
    flexDirection: 'row',
    alignItems: 'stretch',
    height: 104,
    padding: 6,
    paddingLeft: 16,
    overflow: 'hidden',
  },
  washText: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 8,
  },
  washTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 19,
    lineHeight: 24,
    letterSpacing: -0.4,
    color: ink.text,
  },
  washSub: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 12.5,
    lineHeight: 17,
    color: ink.muted,
  },
  washPanel: {
    borderRadius: 14,
    backgroundColor: '#EEF3FB',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  duo: {
    flexDirection: 'row',
  },
  small: {
    ...card,
    height: 104,
    padding: 14,
    overflow: 'hidden',
  },
  smallTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
    letterSpacing: -0.2,
    color: ink.text,
  },
  smallSub: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: ink.muted,
  },
  smallArt: {
    position: 'absolute',
    right: 10,
    bottom: 6,
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
