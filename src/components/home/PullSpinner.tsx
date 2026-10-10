import { useEffect } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useAnimatedValue } from '../theme';
import { ink } from './homeTheme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 26;
const STROKE = 3;
const R = (SIZE - STROKE) / 2;
const LENGTH = 2 * Math.PI * R;

type Props = {
  /** Scroll offset; negative while the user pulls down. */
  scrollY: Animated.Value;
  refreshing: boolean;
  top: number;
  /** Pull distance that triggers a refresh. */
  threshold: number;
};

/**
 * iOS pull-to-refresh: a ring that draws itself as you pull, then spins fast (like a tyre)
 * while refreshing. Content underneath stays in place.
 */
export function PullSpinner({ scrollY, refreshing, top, threshold }: Props) {
  const spin = useAnimatedValue(0);

  useEffect(() => {
    if (!refreshing) return;
    spin.setValue(0);
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 600, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [refreshing, spin]);

  const pulled = scrollY.interpolate({ inputRange: [-threshold, 0], outputRange: [1, 0], extrapolate: 'clamp' });
  // Arc grows from 10% to 75% of the circle while pulling; stays at 75% while spinning.
  const dashOffset = refreshing
    ? LENGTH * 0.25
    : pulled.interpolate({ inputRange: [0, 1], outputRange: [LENGTH * 0.9, LENGTH * 0.25] });
  const rotate = refreshing
    ? spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })
    : pulled.interpolate({ inputRange: [0, 1], outputRange: ['-90deg', '180deg'] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.bubble,
        {
          top,
          opacity: refreshing ? 1 : pulled,
          transform: [
            {
              translateY: refreshing
                ? 0
                : scrollY.interpolate({ inputRange: [-threshold, 0], outputRange: [0, -30], extrapolate: 'clamp' }),
            },
            { scale: refreshing ? 1 : pulled.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
          ],
        },
      ]}
    >
      <Animated.View style={{ transform: [{ rotate }] }}>
        <Svg width={SIZE} height={SIZE}>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke="#EDEDF0" strokeWidth={STROKE} fill="none" />
          <AnimatedCircle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke={ink.yellowDeep}
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${LENGTH} ${LENGTH}`}
            strokeDashoffset={dashOffset}
          />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    alignSelf: 'center',
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
});
