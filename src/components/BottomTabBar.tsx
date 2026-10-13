import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import type { Tabs } from 'expo-router';
import { type ComponentProps, useEffect } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ink } from './home/homeTheme';
import { fonts, useAnimatedValue } from './theme';

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

/** Idle tabs stay light so the selected one reads at a glance (the original Hoora nav grey). */
const IDLE = '#8A8D95';

/** The same docked bar and icon states on iOS, Android, and web. */
export function BottomTabBar({ state, descriptors, navigation, merged }: TabBarProps & { merged?: boolean }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        // Inside the booking-dock panel the panel casts the shadow; the hairline stays as the divider.
        merged && styles.barMerged,
        { paddingBottom: insets.bottom, height: BOTTOM_BAR_HEIGHT + insets.bottom },
      ]}
    >
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
            <TabItem focused={focused} icon={focused ? filled : outline} label={label} />
          </Pressable>
        );
      })}
    </View>
  );
}

/** Selecting a tab: the yellow line grows out from the centre and the icon gives a small spring pop. */
function TabItem({ focused, icon, label }: { focused: boolean; icon: IconName; label: string }) {
  const on = useAnimatedValue(focused ? 1 : 0);
  const pop = useAnimatedValue(1);

  useEffect(() => {
    Animated.timing(on, { toValue: focused ? 1 : 0, duration: 220, useNativeDriver: true }).start();
    if (focused) {
      pop.setValue(0.82);
      Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 12 }).start();
    }
  }, [focused, on, pop]);

  return (
    <>
      <Animated.View style={[styles.marker, { opacity: on, transform: [{ scaleX: on }] }]} />
      <Animated.View style={{ transform: [{ scale: pop }] }}>
        <Ionicons name={icon} size={24} color={focused ? ink.text : IDLE} />
      </Animated.View>
      <Text style={[styles.label, focused && styles.labelOn]} numberOfLines={1}>
        {label}
      </Text>
    </>
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
  barMerged: {
    elevation: 0,
    shadowOpacity: 0,
    backgroundColor: 'transparent',
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
    backgroundColor: ink.yellow,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    includeFontPadding: false,
    textAlign: 'center',
    color: IDLE,
  },
  labelOn: {
    fontFamily: fonts.bold,
    color: ink.text,
  },
});
