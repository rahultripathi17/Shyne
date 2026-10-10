import type { ReactNode } from 'react';
import { View } from 'react-native';

// Lays out children at the Figma frame size, then scales the whole block to fit `width`,
// so fixed-position artwork keeps its exact proportions on every screen size.
type Props = {
  designWidth: number;
  designHeight: number;
  width: number;
  children: ReactNode;
};

export function ScaledBox({ designWidth, designHeight, width, children }: Props) {
  const scale = width / designWidth;
  return (
    <View style={{ width, height: designHeight * scale }}>
      <View
        style={{
          width: designWidth,
          height: designHeight,
          transformOrigin: 'top left',
          transform: [{ scale }],
        }}
      >
        {children}
      </View>
    </View>
  );
}
