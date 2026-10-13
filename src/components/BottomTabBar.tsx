import Ionicons from '@expo/vector-icons/Ionicons';
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
  bookings: ['calendar-outline', 'calendar'],
  rewards: ['gift-outline', 'gift'],
  profile: ['person-circle-outline', 'person-circle'],
};

/** Height of the docked bar above the system navigation area. */
export const BOTTOM_BAR_HEIGHT = 62;

/** The same docked bar and icon states on iOS, Android, and web. */
export function BottomTabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom, height: BOTTOM_BAR_HEIGHT + insets.bottom }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const options = descriptors[route.key].options;
        const label = options.title ?? route.name;
        const [outline, filled] = TAB_ICONS[route.name] ?? ['ellipse-outline', 'ellipse'];

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            void Haptics.selectionAsync();
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => navigation.emit({ type: 'tabLongPress', target: route.key });

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            onLongPress={onLongPress}
            android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            aria-selected={focused}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
          >
            <View style={[styles.marker, focused && styles.markerOn]} />
            <Ionicons name={focused ? filled : outline} size={24} color={focused ? ink.text : '#62656B'} />
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
  itemPressed: {
    opacity: 0.68,
  },
  // A short yellow line marks the selected tab without adding a colored background.
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
    backgroundColor: ink.yellow,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    includeFontPadding: false,
    textAlign: 'center',
    color: '#62656B',
  },
  labelOn: {
    fontFamily: fonts.bold,
    color: ink.text,
  },
});
