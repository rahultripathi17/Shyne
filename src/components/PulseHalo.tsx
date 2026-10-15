import { useEffect } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

import { useAnimatedValue } from './theme';

/**
 * A soft ring that breathes out from behind an icon, to draw the eye to something that needs
 * action (an amount due). Place it as the first child of a centred, fixed-size container.
 */
export function PulseHalo({ size, color }: { size: number; color: string }) {
  const t = useAnimatedValue(0);
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.delay(400),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.halo,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
          transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  halo: {
    position: 'absolute',
  },
});
