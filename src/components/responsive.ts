import { Dimensions, PixelRatio } from 'react-native';

// Sizes in the app are designed on a 393pt-wide phone (iPhone 15 / 16). On other phones they're
// scaled by the screen width so controls keep the same proportion: smaller phones shrink, larger
// ones grow a touch — clamped so nothing becomes tiny or oversized. Text scales half as much as
// layout, so it stays readable. Touch targets stay at least 44pt (Apple) / 48dp (Android).

const BASE_WIDTH = 393;
const width = Dimensions.get('window').width;

/** How much this screen differs from the design width (0.86 – 1.06). */
export const SCREEN_K = Math.min(1.06, Math.max(0.86, width / BASE_WIDTH));

/** Spacing, sizes, radii and icons, scaled to the screen. */
export const sz = (n: number) => PixelRatio.roundToNearestPixel(n * SCREEN_K);

/** Font sizes and line heights: half the screen scaling, so type never gets too small or too big. */
export const fs = (n: number) => PixelRatio.roundToNearestPixel(n * (1 + (SCREEN_K - 1) * 0.5));
