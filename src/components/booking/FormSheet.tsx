import Ionicons from '@expo/vector-icons/Ionicons';
import { type ReactNode, useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts } from '../theme';
import { T } from '../tracking/trackTheme';

/**
 * Bottom sheet for forms: title and close stay at the top, the action stays at the bottom, and only
 * the fields in between scroll (so the button is never pushed off-screen by the keyboard).
 */
export function FormSheet({
  visible,
  title,
  subtitle,
  onClose,
  footer,
  notice,
  children,
  maxHeight = '88%',
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  footer?: ReactNode;
  /** A short message shown above the footer (toasts would sit behind the sheet). */
  notice?: string;
  children: ReactNode;
  maxHeight?: `${number}%`;
}) {
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboardHeight();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      {/* The dim layer covers the whole screen (including beside the sheet's rounded corners). */}
      <Pressable style={styles.scrim} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
      {/* White behind the keyboard, so the strip the sheet rises by never shows the screen underneath. */}
      {keyboard > 0 && <View pointerEvents="none" style={[styles.keyboardBack, { height: keyboard + 40 }]} />}
      <KeyboardAvoidingView
        style={styles.stage}
        pointerEvents="box-none"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.sheet, { maxHeight }]}>
          <View style={styles.grabber} />
          <View style={styles.head}>
            <View style={styles.flex}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={styles.close}
            >
              <Ionicons name="close" size={18} color={T.text} />
            </Pressable>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={styles.body}
          >
            {children}
          </ScrollView>
          {notice ? (
            <View style={styles.notice}>
              <Ionicons name="information-circle" size={15} color="#FFFFFF" />
              <Text style={styles.noticeText}>{notice}</Text>
            </View>
          ) : null}
          {footer ? (
            <View style={[styles.footer, { paddingBottom: keyboard > 0 ? 12 : insets.bottom + 12 }]}>{footer}</View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** Height of the on-screen keyboard (0 when hidden). */
export function useKeyboardHeight() {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) =>
      setHeight(e.endCoordinates.height),
    );
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () =>
      setHeight(0),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return height;
}

/** A labelled group inside a FormSheet. */
export function FormSection({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  keyboardBack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(10,10,14,0.45)',
  },
  stage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    marginTop: 8,
    borderRadius: 2,
    backgroundColor: '#DADCE0',
  },
  head: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ECEDF0',
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 17,
    color: T.text,
  },
  subtitle: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 12.5,
    lineHeight: 17,
    color: T.muted,
  },
  close: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F2F3F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ECEDF0',
    backgroundColor: '#FFFFFF',
  },
  notice: {
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(21,22,26,0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noticeText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#FFFFFF',
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 13.5,
    color: T.text,
  },
  sectionHint: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 11.5,
    lineHeight: 16,
    color: T.muted,
  },
  sectionBody: {
    marginTop: 10,
    gap: 8,
  },
});
