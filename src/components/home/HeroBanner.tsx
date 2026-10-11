import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Animated, Easing, FlatList, Image, type ImageSourcePropType, Pressable, StyleSheet, View } from 'react-native';

import { noBounce, useAnimatedValue } from '../theme';

export type BannerTarget = 'wash' | 'garage' | 'denting' | 'accessories';

type Banner = {
  id: string;
  target: BannerTarget;
  source: ImageSourcePropType;
  /** Login's top area is taller and narrower than Home's, so the sides get trimmed there: this is
   *  where to keep in view across the width (0 = left edge, 1 = right edge). Home ignores it. */
  loginX: number;
};

// Paint, products and accessories first, then washing and servicing. Login shows the same set.
export const BANNERS: Banner[] = [
  {
    id: 'denting-painting',
    target: 'denting',
    source: require('../../../assets/home/banner-denting-painting.jpg'),
    loginX: 0.85,
  },
  {
    id: 'care-products',
    target: 'accessories',
    source: require('../../../assets/home/banner-care-products.jpg'),
    loginX: 0.55,
  },
  {
    id: 'accessories',
    target: 'accessories',
    source: require('../../../assets/home/banner-accessories.jpg'),
    loginX: 0.55,
  },
  { id: 'car-wash', target: 'wash', source: require('../../../assets/home/banner-car-wash.jpg'), loginX: 0.95 },
  {
    id: 'interior-cleaning',
    target: 'wash',
    source: require('../../../assets/home/banner-interior-cleaning.jpg'),
    loginX: 1,
  },
  {
    id: 'exterior-detailing',
    target: 'wash',
    source: require('../../../assets/home/banner-exterior-detailing.jpg'),
    loginX: 0.9,
  },
  { id: 'car-service', target: 'garage', source: require('../../../assets/home/banner-car-service.jpg'), loginX: 0.95 },
];

const SLIDE_MS = 4500;

type Props = {
  width: number;
  height: number;
  topFadeHeight: number;
  /** Distance of the timeline dots from the bottom edge. */
  dotsBottom: number;
  onPress: (target: BannerTarget) => void;
  /** Overlay content (status bar area + header). */
  children?: ReactNode;
};

// Full-bleed banner with "timeline" dots: the active dot fills like a progress line,
// then the next banner slides in. Dragging pauses the timer.
export function HeroBanner({ width, height, topFadeHeight, dotsBottom, onPress, children }: Props) {
  const listRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const progress = useAnimatedValue(0);

  useEffect(() => {
    progress.setValue(0);
    if (paused) return;
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: SLIDE_MS,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    anim.start(({ finished }) => {
      if (!finished) return;
      const next = (index + 1) % BANNERS.length;
      listRef.current?.scrollToOffset({ offset: next * width, animated: true });
      setIndex(next);
    });
    return () => anim.stop();
  }, [index, paused, width, progress]);

  return (
    <View style={{ width, height }}>
      <FlatList
        {...noBounce}
        ref={listRef}
        data={BANNERS}
        keyExtractor={(b) => b.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        onScrollBeginDrag={() => setPaused(true)}
        onMomentumScrollEnd={(e) => {
          setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
          setPaused(false);
        }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onPress(item.target)}
            accessibilityRole="imagebutton"
            accessibilityLabel="Hoora offer"
          >
            <Image source={item.source} resizeMode="cover" style={{ width, height }} />
          </Pressable>
        )}
      />

      <LinearGradient
        pointerEvents="none"
        colors={['rgba(0,0,0,0.82)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0)']}
        locations={[0, 0.6, 1]}
        style={[styles.fade, { top: 0, height: topFadeHeight }]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.45)']}
        style={[styles.fade, { bottom: 0, height: 120 }]}
      />

      <View pointerEvents="box-none" style={styles.overlay}>
        {children}
      </View>

      <View pointerEvents="none" style={[styles.timeline, { bottom: dotsBottom }]}>
        {BANNERS.map((b, i) =>
          i === index ? (
            <View key={b.id} style={styles.track}>
              <Animated.View style={[styles.fill, { transform: [{ scaleX: progress }] }]} />
            </View>
          ) : (
            <View key={b.id} style={styles.dot} />
          ),
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  timeline: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  track: {
    width: 28,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  fill: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
    transformOrigin: 'left',
  },
});
