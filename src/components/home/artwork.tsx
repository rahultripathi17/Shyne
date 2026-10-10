import type { ImageSourcePropType } from 'react-native';
import { View } from 'react-native';

import { CroppedImage } from './CroppedImage';

// Home artwork. Wash, garage, accessories and insurance use the newer illustration set
// (assets/home/v2, trimmed to content); the other tiles keep their Figma frame size and crop,
// so any of them can be scaled to a box without changing how it looks.

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
  insurance: a(require('../../../assets/home/v2/insurance.png'), 53.55, 44),
  ac: a(require('../../../assets/home/ac-service.png'), 60, 62.16, { w: 125.4, h: 121.04, x: -9.2, y: -9.27 }),
  denting: a(require('../../../assets/home/denting.png'), 55, 43.173, { w: 108.47, h: 138.19, x: -5.51, y: -15.11 }),
  roadside: a(require('../../../assets/home/roadside.png'), 75.061, 45, { w: 124.27, h: 207.29, x: -11.53, y: -51.42 }, true),
  batteries: a(require('../../../assets/home/batteries.png'), 72.443, 43.951, { w: 107.11, h: 176.55, x: -3.45, y: -27.93 }),
  tyres: a(require('../../../assets/home/tyres.png'), 62.99, 39.447, { w: 130.11, h: 207.77, x: -16.52, y: -56.61 }),
  qr: a(require('../../../assets/home/connect-qr.png'), 39.738, 39.096, { w: 201.87, h: 136.68, x: -50.78, y: -18.04 }),
  ev: a(require('../../../assets/home/ev-stations.png'), 79.124, 44, { w: 123.08, h: 147.55, x: -13.06, y: -24.35 }),
  dealers: a(require('../../../assets/home/car-dealers.png'), 64.602, 44, { w: 132.42, h: 194.42, x: -18.06, y: -45.27 }, true),
  usedCars: a(require('../../../assets/home/used-cars.png'), 72.166, 50, { w: 124.65, h: 179.91, x: -12.43, y: -34.86 }),
  fastag: a(require('../../../assets/home/fastag-tag.png'), 72, 41.46),
  accessories: a(require('../../../assets/home/v2/accessories.png'), 64.72, 44),
  wash: a(require('../../../assets/home/v2/wash.png'), 81.84, 44),
  garage: a(require('../../../assets/home/v2/garage.png'), 61.78, 44),
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
