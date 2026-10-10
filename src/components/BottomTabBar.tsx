import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import type { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ink } from './home/homeTheme';
import { fonts } from './theme';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];
type IconName = ComponentProps<typeof Ionicons>['name'];

// Outline when idle, filled when selected — always the same shape.
export const TAB_ICONS: Record<string, [IconName, IconName]> = {
  index: ['home-outline', 'home'],
  rewards: ['gift-outline', 'gift'],
  profile: ['person-circle-outline', 'person-circle'],
};

// Bookings: a booking ticket, outline when idle and filled when selected (from Material icons).
const BOOKINGS_ICON = ['ticket-confirmation-outline', 'ticket-confirmation'] as const;

/** Height of the docked bar above the system navigation area. */
export const BOTTOM_BAR_HEIGHT = 62;

/**
 * Android (and web) tab bar: a solid white bar docked to the bottom, like Urban Company and
 * Swiggy — no floating glass. The selected tab gets a dark marker, a filled icon and a
 * bold label.
 */
export function BottomTabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom, height: BOTTOM_BAR_HEIGHT + insets.bottom }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const label = descriptors[route.key].options.title ?? route.name;
        const [outline, filled] = TAB_ICONS[route.name] ?? ['ellipse-outline', 'ellipse'];

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            void Haptics.selectionAsync();
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            android_ripple={{ color: 'rgba(0,0,0,0.06)', borderless: true, radius: 40 }}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            style={styles.item}
          >
            <View style={[styles.marker, focused && styles.markerOn]} />
            {route.name === 'bookings' ? (
              <MaterialCommunityIcons
                name={BOOKINGS_ICON[focused ? 1 : 0]}
                size={24}
                color={focused ? ink.text : '#8A8D95'}
              />
            ) : (
              <Ionicons name={focused ? filled : outline} size={23} color={focused ? ink.text : '#8A8D95'} />
            )}
            <Text style={[styles.label, focused && styles.labelOn]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E3E8',
    ...Platform.select({
      android: { elevation: 12 },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: -2 },
      },
    }),
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  // Short dark bar on the top edge above the selected tab.
  marker: {
    position: 'absolute',
    top: 0,
    width: 32,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: 'transparent',
  },
  markerOn: {
    backgroundColor: ink.text,
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: '#8A8D95',
  },
  labelOn: {
    fontFamily: fonts.extraBold,
    color: ink.text,
  },
});
