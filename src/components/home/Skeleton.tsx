import { LinearGradient } from 'expo-linear-gradient';
import { createContext, type ReactNode, useContext, useEffect } from 'react';
import { Animated, Easing, StyleSheet, View, type ViewStyle } from 'react-native';

import { useAnimatedValue } from '../theme';
import { ink } from './homeTheme';

// One shared sweep drives every block, so the whole skeleton shimmers in sync.
const ShimmerContext = createContext<Animated.Value | null>(null);

export function ShimmerProvider({ children }: { children: ReactNode }) {
  const sweep = useAnimatedValue(0);
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(sweep, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [sweep]);
  return <ShimmerContext.Provider value={sweep}>{children}</ShimmerContext.Provider>;
}

export function Bone({ style }: { style: ViewStyle }) {
  const sweep = useContext(ShimmerContext);
  const width = typeof style.width === 'number' ? style.width : 360;
  return (
    <View style={[styles.bone, style]}>
      {sweep && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { transform: [{ translateX: sweep.interpolate({ inputRange: [0, 1], outputRange: [-width, width] }) }] },
          ]}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.75)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
    </View>
  );
}

/** Placeholder for the Home sheet while it refreshes: same shapes as the real sections. */
export function HomeSkeleton({ width }: { width: number }) {
  const half = (width - 12) / 2;
  const tile = (width - 28 - 30) / 4;
  return (
    <ShimmerProvider>
      <View style={{ gap: 12 }}>
        <Bone style={{ width, height: 112, borderRadius: 20 }} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Bone style={{ width: half, height: 146, borderRadius: 20 }} />
          <Bone style={{ width: half, height: 146, borderRadius: 20 }} />
        </View>
        {[0, 1, 2].map((g) => (
          <View key={g} style={styles.group}>
            <Bone style={{ width: 140, height: 14, borderRadius: 7 }} />
            <View style={styles.row}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={{ width: tile, alignItems: 'center', gap: 8 }}>
                  <Bone style={{ width: 52, height: 44, borderRadius: 12 }} />
                  <Bone style={{ width: tile - 14, height: 10, borderRadius: 5 }} />
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </ShimmerProvider>
  );
}

const styles = StyleSheet.create({
  bone: {
    backgroundColor: '#E9EAEE',
    overflow: 'hidden',
  },
  group: {
    padding: 14,
    gap: 16,
    borderRadius: 20,
    backgroundColor: ink.card,
    borderWidth: 1,
    borderColor: '#ECEDF1',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
