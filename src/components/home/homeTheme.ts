import { StyleSheet } from 'react-native';

import { fonts } from '../theme';

// Home design language: Hoora black + yellow (from the Figma banners), full-bleed hero,
// light sheet below. One family (Plus Jakarta Sans) with a strict type scale.
export const ink = {
  bg: '#0B0B0F',
  bgRaised: '#17171E',
  glass: 'rgba(255,255,255,0.07)',
  glassBorder: 'rgba(255,255,255,0.12)',
  onDark: '#FFFFFF',
  onDarkMuted: 'rgba(255,255,255,0.72)',
  yellow: '#FFE300', // Hoora logo yellow
  yellowDeep: '#F5B800', // yellow that still reads on white (selected tab icons)
  yellowSoft: '#FFF4D1',
  gold: '#8A6400',
  surface: '#F5F5F7',
  sheet: '#FAFAFB',
  card: '#FFFFFF',
  text: '#15161A',
  label: '#24262B',
  muted: '#6B6E76',
  faint: '#A9ABB2',
  line: '#ECECF0',
  red: '#E5484D',
  green: '#12B76A',
};

/** One spacing step between every card and section on Home. */
export const SPACE = 14;

export const type = StyleSheet.create({
  display: { fontFamily: fonts.extraBold, fontSize: 22, lineHeight: 26, letterSpacing: -0.5 },
  h2: { fontFamily: fonts.extraBold, fontSize: 18, lineHeight: 24, letterSpacing: -0.3 },
  h3: { fontFamily: fonts.extraBold, fontSize: 17, lineHeight: 22, letterSpacing: -0.3 },
  title: { fontFamily: fonts.extraBold, fontSize: 15, lineHeight: 19, letterSpacing: -0.2 },
  body: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fonts.bold, fontSize: 11.5, lineHeight: 14 },
  overline: { fontFamily: fonts.extraBold, fontSize: 10.5, lineHeight: 14, letterSpacing: 1.1 },
});
