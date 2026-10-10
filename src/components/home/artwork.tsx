import type { ImageSourcePropType } from 'react-native';
import { Image, StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { CroppedImage } from './CroppedImage';
import { shelfShadow, shelfV0, shelfV1, shelfV2, shelfV3, shelfV4 } from './figmaSvgs';

// Artwork from the Figma home screen. Each entry keeps the Figma frame size and image crop,
// so it can be scaled to any box without changing how it looks.

export type Crop = { w: number; h: number; x: number; y: number };
export type Art = { source: ImageSourcePropType; w: number; h: number; crop?: Crop; flipX?: boolean };

const a = (path: ImageSourcePropType, w: number, h: number, crop?: Crop, flipX?: boolean): Art => ({
  source: path,
  w,
  h,
  crop,
  flipX,
});

export const ART = {
  challan: a(require('../../../assets/home/challan-check.png'), 80.007, 81, { w: 158.84, h: 104.6, x: -23.68, y: 0 }),
  insurance: a(require('../../../assets/home/insurance.png'), 52.683, 46.829, { w: 121.53, h: 136.72, x: -12.21, y: -13.51 }),
  ac: a(require('../../../assets/home/ac-service.png'), 60, 62.16, { w: 125.4, h: 121.04, x: -9.2, y: -9.27 }),
  denting: a(require('../../../assets/home/denting.png'), 55, 43.173, { w: 108.47, h: 138.19, x: -5.51, y: -15.11 }),
  roadside: a(require('../../../assets/home/roadside.png'), 75.061, 45, { w: 124.27, h: 207.29, x: -11.53, y: -51.42 }, true),
  batteries: a(require('../../../assets/home/batteries.png'), 72.443, 43.951, { w: 107.11, h: 176.55, x: -3.45, y: -27.93 }),
  tyres: a(require('../../../assets/home/tyres.png'), 62.99, 39.447, { w: 130.11, h: 207.77, x: -16.52, y: -56.61 }),
  qr: a(require('../../../assets/home/connect-qr.png'), 39.738, 39.096, { w: 201.87, h: 136.68, x: -50.78, y: -18.04 }),
  ev: a(require('../../../assets/home/ev-stations.png'), 79.124, 44, { w: 123.08, h: 147.55, x: -13.06, y: -24.35 }),
  dealers: a(require('../../../assets/home/car-dealers.png'), 64.602, 44, { w: 132.42, h: 194.42, x: -18.06, y: -45.27 }, true),
  usedCars: a(require('../../../assets/home/used-cars.png'), 72.166, 50, { w: 124.65, h: 179.91, x: -12.43, y: -34.86 }),
  // Car with a toll tag (our SUV + Microsoft Fluent 3D "label", MIT). NPCI's FASTag mark needs their permission.
  fastag: a(require('../../../assets/home/fastag-tag.png'), 72, 41.46),
  garage: a(require('../../../assets/home/garage-tools.png'), 54, 46.033, { w: 100, h: 117.31, x: 0, y: -9.62 }),
  challanCar: a(require('../../../assets/home/challan-car.png'), 97, 40.541, { w: 196.67, h: 314.42, x: -11.41, y: -175.46 }),
  headerCar: a(require('../../../assets/home/header-car.png'), 54, 33, { w: 100, h: 111.93, x: 0, y: -12.12 }),
};

/** Scales a Figma art frame to fit inside a box, centred horizontally and sitting on the bottom. */
export function FittedArt({ art, box, align = 'bottom' }: { art: Art; box: { w: number; h: number }; align?: 'bottom' | 'center' }) {
  const s = Math.min(box.w / art.w, box.h / art.h);
  const w = art.w * s;
  const h = art.h * s;
  return (
    <View style={{ width: box.w, height: box.h }}>
      <CroppedImage
        source={art.source}
        frame={{ left: (box.w - w) / 2, top: align === 'bottom' ? box.h - h : (box.h - h) / 2, width: w, height: h }}
        crop={art.crop}
        flipX={art.flipX}
      />
    </View>
  );
}

// "Car/Bike Wash & Care" composite — 3 Figma layers, laid out in their 106.8 × 67.2 group.
export const WASH_GROUP = { w: 106.77, h: 67.2 };
export function WashCluster() {
  return (
    <View style={WASH_GROUP_STYLE}>
      <CroppedImage
        source={require('../../../assets/home/wash-car.png')}
        frame={{ left: 23.51, top: 21.38, width: 51.567, height: 38.99 }}
        crop={{ w: 100, h: 132.26, x: 0, y: -19.35 }}
      />
      <CroppedImage
        source={require('../../../assets/home/wash-car2.png')}
        frame={{ left: 46.06, top: 3.14, width: 60.71, height: 63.851 }}
        crop={{ w: 146.22, h: 111.26, x: 0.33, y: 0.06 }}
      />
      <CroppedImage
        source={require('../../../assets/home/wash-man.png')}
        frame={{ left: 0, top: 0, width: 46.258, height: 67.197 }}
        crop={{ w: 127.37, h: 109.56, x: 0, y: 0 }}
      />
    </View>
  );
}
const WASH_GROUP_STYLE = { width: WASH_GROUP.w, height: WASH_GROUP.h };

// "Product & Accessories" composite — shelf + 5 products in their 138 × 59.7 group.
export const PRODUCT_GROUP = { w: 138, h: 59.69 };
export function ProductCluster() {
  return (
    <View style={{ width: PRODUCT_GROUP.w, height: PRODUCT_GROUP.h }}>
      <View style={styles.shelf}>
        <SvgXml xml={shelfShadow} width={133.637} height={6.721} style={[styles.abs, { left: 0, top: 13.87 }]} />
        <SvgXml xml={shelfV0} width={120.025} height={7.746} style={[styles.abs, { left: 2.29, top: 0.05 }]} />
        <SvgXml xml={shelfV1} width={120.269} height={16.744} style={[styles.abs, { left: 2.17, top: 4.13 }]} />
        <SvgXml xml={shelfV2} width={120.047} height={3.946} style={[styles.abs, { left: 2.27, top: 3.95 }]} />
        <SvgXml xml={shelfV3} width={120.025} height={7.869} style={[styles.abs, { left: 2.29, top: 0 }]} />
        <SvgXml xml={shelfV4} width={120.029} height={4.009} style={[styles.abs, { left: 2.29, top: 3.95 }]} />
      </View>
      <View style={styles.pngeggBox}>
        <Image source={require('../../../assets/home/acc-pngegg.png')} resizeMode="cover" style={styles.pngegg} />
      </View>
      <CroppedImage
        source={require('../../../assets/home/acc-product3.png')}
        frame={{ left: 82.44, top: 2.6, width: 44.325, height: 42.355 }}
        crop={{ w: 103.33, h: 108.14, x: -3.33, y: 0 }}
      />
      <CroppedImage
        source={require('../../../assets/home/acc-product2.png')}
        frame={{ left: 28.29, top: 0, width: 24.587, height: 47.353 }}
        crop={{ w: 220.32, h: 114.39, x: -67.31, y: -7.45 }}
      />
      <CroppedImage
        source={require('../../../assets/home/acc-product2b.png')}
        frame={{ left: 44.34, top: 2.63, width: 44.818, height: 44.818 }}
      />
      <CroppedImage
        source={require('../../../assets/home/acc-small.png')}
        frame={{ left: 84.23, top: 22.15, width: 16.286, height: 22.608 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  abs: {
    position: 'absolute',
  },
  shelf: {
    position: 'absolute',
    left: 4.36,
    top: 38.82,
    width: 133.637,
    height: 20.877,
  },
  pngeggBox: {
    position: 'absolute',
    left: 12.54,
    top: 9.75,
    width: 53.135,
    height: 47.166,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pngegg: {
    width: 43.903,
    height: 32.928,
    transform: [{ rotate: '22.39deg' }],
  },
});
