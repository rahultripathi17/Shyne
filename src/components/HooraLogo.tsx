import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { HOORA_LOGO_XML } from './hooraLogoXml';

const RATIO = 40.9373 / 135.571;

/** The Hoora wordmark from Figma. `width` sets the size; height follows the logo's ratio. */
export function HooraLogo({ width = 120 }: { width?: number }) {
  return <SvgXml xml={HOORA_LOGO_XML} width={width} height={width * RATIO} />;
}

/** Just the round yellow "H" from the wordmark (it is the logo's first 41 × 41 units). */
export function HooraMark({ size = 40 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, overflow: 'hidden' }}>
      <SvgXml xml={HOORA_LOGO_XML} width={size / RATIO} height={size} />
    </View>
  );
}
