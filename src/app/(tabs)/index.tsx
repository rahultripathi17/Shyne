import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Platform, RefreshControl, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandFooter, ChallanBanner } from '../../components/home/BelowFold';
import { AllServices, type CategoryId, MainCategories } from '../../components/home/Categories';
import { type BannerTarget, HeroBanner } from '../../components/home/HeroBanner';
import { HomeHeader } from '../../components/home/HomeHeader';
import { ink, SPACE } from '../../components/home/homeTheme';
import { FadeIn } from '../../components/home/motion';
import { PullSpinner } from '../../components/home/PullSpinner';
import { HomeSkeleton } from '../../components/home/Skeleton';
import { useAnimatedValue } from '../../components/theme';
import { detectAddress } from '../../lib/location';
import { useTabBarSpace } from '../../components/tabBarSpace';
import { Toast, useToast } from '../../components/Toast';
import { VehicleSheet } from '../../components/VehicleSheet';
import { useAppStore } from '../../store/AppStore';

const SIDE = 16;
const SHEET_OVERLAP = 28;
const PULL_THRESHOLD = 90;

const NAMES: Record<CategoryId, string> = {
  wash: 'Car & Bike Wash',
  garage: 'Garage Service',
  accessories: 'Accessories',
  denting: 'Denting & Painting',
  ac: 'AC Service',
  tyres: 'Tyres & Wheels',
  batteries: 'Batteries',
  challan: 'Clear Challan',
  insurance: 'Insurance',
  fastag: 'FASTag',
  qr: 'Connect QR',
  roadside: 'Roadside Help',
  ev: 'EV Charging',
  'used-cars': 'Used Cars',
  dealers: 'Car Dealers',
};

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { selectedCar, location, setLocation } = useAppStore();
  const toast = useToast();
  const bottomSpace = useTabBarSpace();

  // Banner + header take ~45% of a typical phone screen, leaving the services in view.
  const bannerHeight = Math.round(width * 0.92);
  const contentWidth = width - SIDE * 2;

  // Status bar: light over the banner, dark once the sheet reaches the top.
  const scrollY = useAnimatedValue(0);
  const darkBarRef = useRef(false);
  const switchAt = bannerHeight - SHEET_OVERLAP - insets.top;

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle(darkBarRef.current ? 'dark' : 'light');
      return () => setStatusBarStyle('dark');
    }, []),
  );

  // iOS: a light tick when the pull passes the point where letting go will refresh.
  const armedRef = useRef(false);

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      const armed = value <= -PULL_THRESHOLD;
      if (Platform.OS === 'ios' && armed !== armedRef.current) {
        armedRef.current = armed;
        if (armed) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      const dark = value > switchAt - 8;
      if (dark !== darkBarRef.current) {
        darkBarRef.current = dark;
        setStatusBarStyle(dark ? 'dark' : 'light');
      }
    });
    return () => scrollY.removeListener(id);
  }, [scrollY, switchAt]);

  // Content stays in place at both edges: on iOS the scroll view still bounces (needed for
  // pull-to-refresh), but we move the content back by the overscroll so nothing stretches.
  const [contentH, setContentH] = useState(0);
  const [layoutH, setLayoutH] = useState(0);
  const maxScroll = contentH > layoutH ? contentH - layoutH : 10000;
  const pinY =
    Platform.OS === 'ios'
      ? scrollY.interpolate({
          inputRange: [-1000, 0, maxScroll, maxScroll + 1000],
          outputRange: [-1000, 0, 0, 1000],
        })
      : 0;

  const [vehiclesOpen, setVehiclesOpen] = useState(false);

  // Pull to refresh: spinner for ~2 s while the sections show a shimmer skeleton.
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    const wait = new Promise((r) => setTimeout(r, 2000));
    if (location?.detected) {
      const result = await detectAddress();
      if (result.ok) setLocation(result.location);
    }
    await wait;
    setRefreshing(false);
  };

  const topCoverOpacity = scrollY.interpolate({
    inputRange: [switchAt - 24, switchAt],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const open = (id: CategoryId) => {
    if (id === 'wash') {
      router.push('/wash');
      return;
    }
    toast.show(`${NAMES[id]} — coming soon`);
  };

  const onBanner = (target: BannerTarget) => open(target);

  const refreshLocation = async () => {
    toast.show('Finding your address…');
    const result = await detectAddress();
    if (result.ok) {
      setLocation(result.location);
      toast.show('Address updated');
    } else {
      toast.show(result.reason === 'denied' ? 'Allow location for Hoora in Settings' : 'Couldn’t find your address');
    }
  };

  return (
    <View style={styles.screen}>
      <Animated.ScrollView
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        // Android: the native swipe-to-refresh (starts on release), white bubble with a yellow ring.
        refreshControl={
          Platform.OS === 'android' ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[ink.yellowDeep]}
              progressBackgroundColor="#FFFFFF"
              progressViewOffset={insets.top + 28}
            />
          ) : undefined
        }
        // iOS: our own spinner. Refresh starts only when the finger lets go past the threshold,
        // not while still pulling (UIRefreshControl fires mid-pull).
        alwaysBounceVertical
        onScrollEndDrag={(e) => {
          if (Platform.OS === 'ios' && !refreshing && e.nativeEvent.contentOffset.y <= -PULL_THRESHOLD) {
            void onRefresh();
          }
        }}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        onLayout={(e) => setLayoutH(e.nativeEvent.layout.height)}
        onContentSizeChange={(_, h) => setContentH(h)}
        contentContainerStyle={{ paddingBottom: bottomSpace }}
      >
        <Animated.View style={{ transform: [{ translateY: pinY }] }}>
        <View>
          <HeroBanner
            width={width}
            height={bannerHeight}
            topFadeHeight={insets.top + 120}
            dotsBottom={SHEET_OVERLAP + 14}
            onPress={onBanner}
          />
          <View pointerEvents="box-none" style={[styles.headerOverlay, { paddingTop: insets.top }]}>
            <HomeHeader
              addressLabel={location?.label ?? 'Set your location'}
              address={location?.address ?? 'Tap to detect your address'}
              vehicle={selectedCar}
              onLocationPress={refreshLocation}
              onVehiclePress={() => setVehiclesOpen(true)}
            />
          </View>
        </View>

        <View style={styles.sheet}>
          {refreshing ? (
            <HomeSkeleton width={contentWidth} />
          ) : (
            <>
              <FadeIn>
                <MainCategories width={contentWidth} onPress={open} />
              </FadeIn>

              <FadeIn delay={120}>
                <AllServices width={contentWidth} onPress={open} />
              </FadeIn>

              <FadeIn delay={220}>
                <ChallanBanner plate={selectedCar?.plate} onPress={() => open('challan')} />
              </FadeIn>
            </>
          )}

          <BrandFooter />
        </View>
        </Animated.View>
      </Animated.ScrollView>

      {Platform.OS === 'ios' && (
        <PullSpinner scrollY={scrollY} refreshing={refreshing} top={insets.top + 34} threshold={PULL_THRESHOLD} />
      )}

      {/* Solid strip behind the status bar once content scrolls under it */}
      <Animated.View
        pointerEvents="none"
        style={[styles.topCover, { height: insets.top, opacity: topCoverOpacity }]}
      />

      <VehicleSheet visible={vehiclesOpen} onClose={() => setVehiclesOpen(false)} />

      <Toast toast={toast} bottom={bottomSpace} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: ink.surface,
  },
  headerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  sheet: {
    marginTop: -SHEET_OVERLAP,
    backgroundColor: ink.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: SIDE,
    paddingTop: 18,
    // Same step between every block on Home (cards, service boxes, alert).
    gap: SPACE,
  },
  topCover: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: 'rgba(245,245,247,0.97)',
  },
});
