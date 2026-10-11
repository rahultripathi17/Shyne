import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Animated, Easing, Image, type ImageSourcePropType, StyleSheet, View } from 'react-native';

import { ink } from '../home/homeTheme';
import { useAnimatedValue } from '../theme';

// The same 3D artwork the Home screen uses, so login previews what the app offers.
const ART: Record<string, ImageSourcePropType> = {
  bikeWash: require('../../../assets/home/wash-car.png'),
  carWash: require('../../../assets/home/wash-car2.png'),
  ac: require('../../../assets/home/ac-service.png'),
  tyres: require('../../../assets/home/tyres.png'),
  insurance: require('../../../assets/home/insurance.png'),
  dashcam: require('../../../assets/home/acc-product2b.png'),
  tools: require('../../../assets/home/garage-tools.png'),
  batteries: require('../../../assets/home/batteries.png'),
  fastag: require('../../../assets/home/fastag-tag.png'),
  helmet: require('../../../assets/home/acc-pngegg.png'),
  denting: require('../../../assets/home/denting.png'),
  roadside: require('../../../assets/home/roadside.png'),
  challan: require('../../../assets/home/challan-check.png'),
  qr: require('../../../assets/home/connect-qr.png'),
  spray: require('../../../assets/home/acc-product2.png'),
  usedCars: require('../../../assets/home/used-cars.png'),
  ev: require('../../../assets/home/ev-stations.png'),
  dealers: require('../../../assets/home/car-dealers.png'),
  suv: require('../../../assets/home/header-car.png'),
  washer: require('../../../assets/home/wash-man.png'),
};

const ROWS: string[][] = [
  ['carWash', 'ac', 'tyres', 'insurance', 'dashcam'],
  ['bikeWash', 'tools', 'batteries', 'fastag', 'helmet'],
  ['denting', 'roadside', 'challan', 'washer', 'spray'],
  ['suv', 'usedCars', 'ev', 'qr', 'dealers'],
];

const TILE = 92;
const GAP = 12;

function MarqueeRow({ items, duration, reverse }: { items: string[]; duration: number; reverse?: boolean }) {
  const t = useAnimatedValue(0);
  const span = items.length * (TILE + GAP);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(t, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [t, duration]);

  const translateX = t.interpolate({ inputRange: [0, 1], outputRange: reverse ? [-span, 0] : [0, -span] });

  return (
    <Animated.View style={[styles.row, { transform: [{ translateX }] }]}>
      {[...items, ...items, ...items].map((name, i) => (
        <View key={`${name}-${i}`} style={styles.tile}>
          <Image source={ART[name]} resizeMode="contain" style={styles.img} />
        </View>
      ))}
    </Animated.View>
  );
}

/** Slowly drifting tiles of Hoora's services on brand yellow, fading into white at the bottom. */
export function BrandPattern() {
  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={styles.tilt}>
        {ROWS.map((items, i) => (
          <MarqueeRow key={i} items={items} duration={[34000, 40000, 30000, 37000][i]} reverse={i % 2 === 1} />
        ))}
      </View>
      <LinearGradient colors={['rgba(255,255,255,0)', '#FFFFFF']} style={styles.fade} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    backgroundColor: ink.yellow,
  },
  tilt: {
    position: 'absolute',
    left: -140,
    right: -140,
    top: '46%',
    marginTop: -((TILE + GAP) * ROWS.length) / 2,
    gap: GAP,
    transform: [{ rotate: '-8deg' }],
  },
  row: {
    flexDirection: 'row',
    gap: GAP,
  },
  tile: {
    width: TILE,
    height: TILE,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7A6400',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  img: {
    width: TILE - 20,
    height: TILE - 20,
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
  },
});
