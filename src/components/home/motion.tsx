import * as Haptics from 'expo-haptics';
import { type ReactNode, useEffect } from 'react';
import { Animated, Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { useAnimatedValue } from '../theme';

type PressableScaleProps = {
  onPress: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** Layout for the outer touch target, e.g. { flex: 1 } so the element can grow or shrink in a row. */
  containerStyle?: StyleProp<ViewStyle>;
  children: ReactNode;
  /** How far the element shrinks while pressed. */
  scaleTo?: number;
  accessibilityLabel?: string;
};

// Springy press feedback with a light haptic tick — the tactile feel of CRED / Zepto taps.
export function PressableScale({
  onPress,
  onLongPress,
  style,
  containerStyle,
  children,
  scaleTo = 0.96,
  accessibilityLabel,
}: PressableScaleProps) {
  const scale = useAnimatedValue(1);
  const to = (value: number) =>
    Animated.spring(scale, { toValue: value, useNativeDriver: true, speed: 40, bounciness: 6 }).start();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={containerStyle}
      // Short delay so a finger that starts a scroll doesn't shrink the item it landed on.
      unstable_pressDelay={80}
      onPressIn={() => to(scaleTo)}
      onPressOut={() => to(1)}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      onLongPress={onLongPress}
      delayLongPress={450}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

type FadeInProps = {
  delay?: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

// Fades and lifts content in on first render; stagger sections with increasing delays.
export function FadeIn({ delay = 0, children, style }: FadeInProps) {
  const progress = useAnimatedValue(0);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 480,
      delay,
      useNativeDriver: true,
    }).start();
  }, [progress, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
