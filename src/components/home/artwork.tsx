import { Image, type ImageSourcePropType, View } from 'react-native';

import { CroppedImage } from './CroppedImage';

// Home artwork, as in the released build (1896471): wash, garage, accessories, insurance, AC,
// denting, batteries, tyres and FASTag use the v2 illustration set (assets/home/v2, trimmed to
// content); the other tiles keep their Figma frame size and crop.

export type Crop = { w: number; h: number; x: number; y: number };
export type Art = { source: ImageSourcePropType; w: number; h: number; crop?: Crop; flipX?: boolean; icon?: boolean };

const a = (path: ImageSourcePropType, w: number, h: number, crop?: Crop, flipX?: boolean): Art => ({
  source: path,
  w,
  h,
  crop,
  flipX,
});

export const ART = {
  challan: a(require('../../../assets/home/challan-check.png'), 80.007, 81, { w: 158.84, h: 104.6, x: -23.68, y: 0 }),
  insurance: a(require('../../../assets/home/v2/insurance-icon.png'), 57.08, 44),
  ac: a(require('../../../assets/home/v2/ac-icon.png'), 59.83, 44),
  denting: a(require('../../../assets/home/v2/denting-icon.png'), 54.57, 44),
  roadside: a(
    require('../../../assets/home/roadside.png'),
    75.061,
    45,
    { w: 124.27, h: 207.29, x: -11.53, y: -51.42 },
    true,
  ),
  batteries: a(require('../../../assets/home/v2/battery-icon.png'), 56.93, 44),
  tyres: a(require('../../../assets/home/v2/tyres-icon.png'), 53.6, 44),
  qr: a(require('../../../assets/home/connect-qr.png'), 39.738, 39.096, { w: 201.87, h: 136.68, x: -50.78, y: -18.04 }),
  ev: a(require('../../../assets/home/ev-stations.png'), 79.124, 44, { w: 123.08, h: 147.55, x: -13.06, y: -24.35 }),
  dealers: a(
    require('../../../assets/home/car-dealers.png'),
    64.602,
    44,
    { w: 132.42, h: 194.42, x: -18.06, y: -45.27 },
    true,
  ),
  usedCars: a(require('../../../assets/home/used-cars.png'), 72.166, 50, {
    w: 124.65,
    h: 179.91,
    x: -12.43,
    y: -34.86,
  }),
  fastag: a(require('../../../assets/home/v2/fastag-icon.png'), 65.59, 44),
  accessories: a(require('../../../assets/home/v2/accessories-icon.png'), 38.94, 44),
  wash: a(require('../../../assets/home/v2/wash-icon.png'), 56.76, 44),
  garage: a(require('../../../assets/home/v2/garage-icon.png'), 56.63, 44),
  challanCar: a(require('../../../assets/home/challan-car.png'), 97, 40.541, {
    w: 196.67,
    h: 314.42,
    x: -11.41,
    y: -175.46,
  }),
  headerCar: a(require('../../../assets/home/header-car.png'), 54, 33, { w: 100, h: 111.93, x: 0, y: -12.12 }),
};

/** Scales a Figma art frame to fit inside a box, centred horizontally and sitting on the bottom. */
export function FittedArt({
  art,
  box,
  align = 'bottom',
}: {
  art: Art;
  box: { w: number; h: number };
  align?: 'bottom' | 'center';
}) {
  if (art.icon) {
    const size = Math.min(box.w, box.h);
    return (
      <View
        style={{
          width: box.w,
          height: box.h,
          alignItems: 'center',
          justifyContent: align === 'bottom' ? 'flex-end' : 'center',
        }}
      >
        <Image source={art.source} resizeMode="contain" style={{ width: size, height: size }} />
      </View>
    );
  }

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
