import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CarCard } from '../components/CarCard';
import { colors, formatPrice, noBounce, shared } from '../components/theme';
import { PACKAGES, SERVICES, tierForBody } from '../data/services';
import { useAppStore } from '../store/AppStore';

export default function WashScreen() {
  const { selectedCar } = useAppStore();
  const tier = selectedCar ? tierForBody(selectedCar.body) : 'small';

  return (
    <ScrollView
      {...noBounce}
      style={shared.scroll}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <CarCard car={selectedCar} onPress={() => router.push('/add-car')} />

      <Text style={shared.sectionTitle}>Car wash services</Text>
      <View style={styles.grid}>
        {SERVICES.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => router.push(`/service/${s.id}`)}
            style={({ pressed }) => [styles.serviceTile, pressed && { opacity: 0.8 }]}
          >
            <View style={[styles.serviceIcon, { backgroundColor: s.color + '1A' }]}>
              <Ionicons name={s.icon} size={26} color={s.color} />
            </View>
            <Text style={styles.serviceName}>{s.name}</Text>
            <Text style={styles.serviceTagline}>{s.tagline}</Text>
            <Text style={styles.servicePrice}>
              {selectedCar ? '' : 'from '}
              {formatPrice(s.prices[tier])}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={shared.sectionTitle}>Wash packages</Text>
      <ScrollView {...noBounce} horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
        {PACKAGES.map((p) => (
          <View key={p.id} style={styles.packageCard}>
            {p.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{p.badge}</Text>
              </View>
            )}
            <Text style={styles.packageName}>{p.name}</Text>
            <Text style={styles.packagePrice}>
              {formatPrice(p.price)}
              <Text style={styles.packagePeriod}>{p.period}</Text>
            </Text>
            {p.perks.map((perk) => (
              <View key={perk} style={styles.perkRow}>
                <Ionicons name="checkmark" size={16} color={colors.success} />
                <Text style={styles.perkText}>{perk}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  serviceTile: {
    width: '48.5%',
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  serviceTagline: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  servicePrice: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.brand,
    marginTop: 10,
  },
  hScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  packageCard: {
    width: 200,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    marginRight: 12,
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  packageName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textMuted,
  },
  packagePrice: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    marginTop: 4,
    marginBottom: 8,
  },
  packagePeriod: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMuted,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  perkText: {
    fontSize: 14,
    color: colors.text,
  },
});
