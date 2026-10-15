import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

import { fonts, useAnimatedValue } from './theme';

/** A short message that fades in above the tab bar and goes away on its own. */
export function useToast() {
  const opacity = useAnimatedValue(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!message) return;
    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setMessage(''));
    }, 1800);
    return () => clearTimeout(timer);
  }, [message, opacity]);

  return { message, opacity, show: setMessage };
}

export function Toast({ toast, bottom }: { toast: ReturnType<typeof useToast>; bottom: number }) {
  if (toast.message === '') return null;
  return (
    <Animated.View pointerEvents="none" style={[styles.toast, { bottom, opacity: toast.opacity }]}>
      <Text style={styles.text}>{toast.message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(21,22,26,0.94)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  text: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: '#FFFFFF',
  },
});
