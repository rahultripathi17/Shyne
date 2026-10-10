import { Image, type ImageSourcePropType, StyleSheet, View } from 'react-native';

// Reproduces Figma's image fills: a fixed frame (position + size inside its card)
// with the source image scaled and offset inside it, clipped to the frame.
type Props = {
  source: ImageSourcePropType;
  frame: { left: number; top: number; width: number; height: number };
  /** Image size/offset as % of the frame, e.g. { w: 125.4, h: 121.04, x: -9.2, y: -9.27 }. Omit for object-cover. */
  crop?: { w: number; h: number; x: number; y: number };
  flipX?: boolean;
};

export function CroppedImage({ source, frame, crop, flipX }: Props) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.frame,
        frame,
        flipX && { transform: [{ scaleX: -1 }] },
      ]}
    >
      {crop ? (
        <Image
          source={source}
          resizeMode="stretch"
          style={{
            position: 'absolute',
            width: `${crop.w}%`,
            height: `${crop.h}%`,
            left: `${crop.x}%`,
            top: `${crop.y}%`,
          }}
        />
      ) : (
        <Image source={source} resizeMode="cover" style={styles.fill} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    position: 'absolute',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
  },
});
