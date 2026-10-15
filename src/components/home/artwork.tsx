import { Image, type ImageSourcePropType, View } from 'react-native';

import { CroppedImage } from './CroppedImage';

// Shared AI-generated service icon family. Each transparent PNG uses the same
// 256px canvas so the category artwork scales consistently across Home cards.

export type Crop = { w: number; h: number; x: number; y: number };
export type Art = { source: ImageSourcePropType; w: number; h: number; crop?: Crop; flipX?: boolean; icon?: boolean };

const a = (path: ImageSourcePropType, w: number, h: number, crop?: Crop, flipX?: boolean): Art => ({
  source: path,
  w,
  h,
  crop,
  flipX,
});

const icon = (source: ImageSourcePropType): Art => ({ source, w: 256, h: 256, icon: true });

export const ART = {
  challan: icon(require('../../../assets/home/service-icons-v4/challan.png')),
  insurance: icon(require('../../../assets/home/service-icons-v4/insurance.png')),
  ac: icon(require('../../../assets/home/service-icons-v4/ac.png')),
  denting: icon(require('../../../assets/home/service-icons-v4/denting.png')),
  roadside: icon(require('../../../assets/home/service-icons-v4/roadside.png')),
  batteries: icon(require('../../../assets/home/service-icons-v4/batteries.png')),
  tyres: icon(require('../../../assets/home/service-icons-v4/tyres.png')),
  qr: icon(require('../../../assets/home/service-icons-v4/qr.png')),
  ev: icon(require('../../../assets/home/service-icons-v4/ev.png')),
  dealers: icon(require('../../../assets/home/service-icons-v4/dealers.png')),
  usedCars: icon(require('../../../assets/home/service-icons-v4/used-cars.png')),
  fastag: icon(require('../../../assets/home/service-icons-v4/fastag.png')),
  accessories: icon(require('../../../assets/home/service-icons-v4/accessories.png')),
  wash: icon(require('../../../assets/home/service-icons-v4/wash.png')),
  garage: icon(require('../../../assets/home/service-icons-v4/garage.png')),
  challanCar: a(require('../../../assets/home/challan-car.png'), 97, 40.541, { w: 196.67, h: 314.42, x: -11.41, y: -175.46 }),
  headerCar: a(require('../../../assets/home/header-car.png'), 54, 33, { w: 100, h: 111.93, x: 0, y: -12.12 }),
};

/** Scales a Figma art frame to fit inside a box, centred horizontally and sitting on the bottom. */
export function FittedArt({ art, box, align = 'bottom' }: { art: Art; box: { w: number; h: number }; align?: 'bottom' | 'center' }) {
  if (art.icon) {
    const size = Math.min(box.w, box.h);
    return (
      <View style={{ width: box.w, height: box.h, alignItems: 'center', justifyContent: align === 'bottom' ? 'flex-end' : 'center' }}>
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
