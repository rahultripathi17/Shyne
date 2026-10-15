import { StyleSheet, Text, View } from 'react-native';

import { HooraLogo } from '../HooraLogo';
import { formatPlate } from '../PlateField';
import { fonts } from '../theme';
import { ART, FittedArt } from './artwork';
import { ink } from './homeTheme';
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
      <View style={[styles.alert, due && styles.alertDue]}>
        <FittedArt art={due ? ART.challanCar : ART.challan} box={due ? { w: 64, h: 34 } : { w: 46, h: 40 }} />
        <View style={styles.alertText}>
          <Text style={styles.alertTitle} numberOfLines={1}>
            {due ? '1 pending challan' : 'Check your challans'}
          </Text>
          <Text style={styles.alertBody} numberOfLines={1}>
            {due ? `On ${formatPlate(plate)}` : 'Instant check with your vehicle number'}
          </Text>
        </View>
        <View style={[styles.payBtn, due && styles.payBtnDue]}>
          <Text style={[styles.pay, due && styles.payDue]}>{due ? 'Pay now' : 'Check'}</Text>
        </View>
      </View>
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
    gap: 12,
    minHeight: 68,
    borderRadius: 16,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 12,
    borderWidth: 1,
    borderColor: '#ECEDF1',
    backgroundColor: ink.card,
  },
  alertDue: {
    borderColor: '#F6D7D3',
    backgroundColor: '#FFF8F7',
  },
  alertText: {
    flex: 1,
  },
  alertTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: ink.text,
  },
  alertBody: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: ink.muted,
  },
  payBtn: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D5D7DC',
    justifyContent: 'center',
  },
  payBtnDue: {
    borderColor: ink.text,
    backgroundColor: ink.text,
  },
  pay: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: ink.text,
  },
  payDue: {
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
    fontSize: 17,
    lineHeight: 22,
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
    fontSize: 14,
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
