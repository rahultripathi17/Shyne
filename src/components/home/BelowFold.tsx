import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { HooraLogo } from '../HooraLogo';
import { formatPlate } from '../PlateField';
import { fonts } from '../theme';
import { ART, FittedArt } from './artwork';
import { ink, type } from './homeTheme';
import { PressableScale } from './motion';

// Dynamic alert banner (Figma challan banners). With a vehicle number it shows what's due
// (sample data until the challan API is connected); without one it invites a check.
export function ChallanBanner({ plate, onPress }: { plate?: string; onPress: () => void }) {
  const due = !!plate;
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.98}
      accessibilityLabel={due ? '1 pending challan, pay now' : 'Check your challans'}
    >
      <LinearGradient
        colors={['#FFF3CC', '#FFFAEB', '#FFFFFF']}
        locations={[0, 0.65, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.4 }}
        style={styles.alert}
      >
        <View style={{ flex: 1 }}>
          <Text style={[type.overline, { color: due ? '#C8372D' : ink.gold }]}>
            {due ? 'ACTION NEEDED' : 'STAY CHALLAN-FREE'}
          </Text>
          <Text style={[type.title, styles.alertTitle]}>{due ? '1 pending challan' : 'Check your challans'}</Text>
          <Text style={[type.body, styles.alertBody]}>
            {due ? 'Settle now to avoid heavy fines' : 'Instant check with your vehicle number'}
          </Text>
          <View style={styles.payRow}>
            <Text style={styles.pay}>{due ? 'Pay now' : 'Check now'}</Text>
            <Ionicons name="arrow-forward" size={13} color={ink.gold} />
          </View>
        </View>
        <View style={styles.alertRight}>
          {due && (
            <View style={styles.plate}>
              <View style={styles.plateInd}>
                <Text style={styles.plateIndText}>IND</Text>
              </View>
              <Text style={styles.plateText}>{formatPlate(plate)}</Text>
            </View>
          )}
          <FittedArt art={due ? ART.challanCar : ART.challan} box={due ? { w: 108, h: 50 } : { w: 86, h: 70 }} />
        </View>
      </LinearGradient>
    </PressableScale>
  );
}

const STATS = [
  { value: '1 Lac+', label: 'Happy customers' },
  { value: '5 Years+', label: 'Auto care' },
  { value: '80+', label: 'Cities' },
];

export function BrandFooter() {
  return (
    <View style={styles.footer}>
      <View style={styles.footerLogo}>
        <HooraLogo width={112} />
      </View>
      <Text style={styles.footerTitle}>{'India’s #1\nCar & Bike Care App'}</Text>
      <View style={styles.stats}>
        {STATS.map((s, i) => (
          <View key={s.label} style={[styles.stat, i > 0 && styles.statDivider]}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.born}>
        Born and engineered in <Text style={{ fontFamily: fonts.bold }}>Nagpur</Text>, India 🇮🇳
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    paddingVertical: 14,
    paddingLeft: 16,
    paddingRight: 12,
    borderWidth: 1,
    borderColor: '#F2E1A6',
    overflow: 'hidden',
  },
  alertTitle: {
    color: ink.text,
    marginTop: 2,
  },
  alertBody: {
    color: ink.muted,
    fontSize: 12,
    marginTop: 1,
  },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  pay: {
    ...type.label,
    fontSize: 12.5,
    color: ink.gold,
  },
  alertRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  plate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#2A3C6E',
    borderRadius: 4,
    paddingVertical: 2,
    paddingLeft: 2,
    paddingRight: 6,
  },
  plateInd: {
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    paddingHorizontal: 3,
    paddingVertical: 2,
  },
  plateIndText: {
    fontFamily: fonts.bold,
    fontSize: 6,
    color: '#153E8E',
  },
  plateText: {
    fontFamily: fonts.bold,
    fontSize: 8.5,
    color: '#FFFFFF',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 22,
  },
  footerLogo: {
    marginBottom: 14,
  },
  footerTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.6,
    color: '#C9CAD1',
    textAlign: 'center',
  },
  stats: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    marginTop: 16,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    borderLeftWidth: 1,
    borderLeftColor: '#E6E6EA',
  },
  statValue: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
    color: '#9EA0A8',
  },
  statLabel: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    color: ink.faint,
  },
  born: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: ink.faint,
    marginTop: 16,
  },
});
