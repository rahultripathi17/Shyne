import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Fragment, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConfirmSheet, HELP } from '../../../components/help/HelpKit';
import { fonts } from '../../../components/theme';
import { TopBar } from '../../../components/TopBar';
import { T } from '../../../components/tracking/trackTheme';
import { type Message, sendMessage, setTicketStatus, useTickets } from '../../../data/support';
import { fs, sz } from '../../../components/responsive';

// A ticket's conversation (Dev File → "My Ticket"): the topic on top, messages by day, your
// messages with a ME badge, Hoora support in yellow. Close / reopen from the header, with the
// ticket confirm sheet. A closed ticket shows its state and a way back into the chat.

const dayLabel = (ms: number) =>
  new Date(ms).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
const timeLabel = (ms: number) => new Date(ms).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
const initials = (name = 'Hoora Support') =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

function Bubble({ m }: { m: Message }) {
  if (m.from === 'system') {
    return (
      <View style={styles.system}>
        <Text style={styles.systemText}>{m.text}</Text>
      </View>
    );
  }
  const me = m.from === 'me';
  const body = m.image ? (
    <Image source={{ uri: m.image }} style={styles.image} />
  ) : (
    <Text style={styles.msgText}>{m.text}</Text>
  );
  return (
    <View style={[styles.msgRow, me && styles.msgRowMe]}>
      {!me && (
        <View style={[styles.avatar, styles.avatarAgent]}>
          <Text style={styles.avatarText}>{initials(m.name)}</Text>
        </View>
      )}
      <View style={[styles.msgCol, me && { alignItems: 'flex-end' }]}>
        <Text style={styles.who}>{me ? 'You' : m.name}</Text>
        <View style={[styles.bubble, me ? styles.bubbleMe : styles.bubbleAgent, m.image && styles.bubbleImage]}>
          {body}
        </View>
        <Text style={styles.time}>{timeLabel(m.at)}</Text>
      </View>
      {me && (
        <View style={[styles.avatar, styles.avatarMe]}>
          <Text style={styles.avatarText}>ME</Text>
        </View>
      )}
    </View>
  );
}

export default function TicketScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const ticket = useTickets().find((t) => t.id === id);
  const [text, setText] = useState('');
  const [confirm, setConfirm] = useState<'close' | 'reopen'>();
  const scroll = useRef<ScrollView>(null);

  if (!ticket) {
    return (
      <View style={styles.screen}>
        <TopBar title="Ticket" topInset={insets.top} arrow onBack={() => router.back()} />
        <Text style={styles.missing}>This ticket isn’t available.</Text>
      </View>
    );
  }
  const open = ticket.status === 'Open';
  const send = () => {
    const t = text.trim();
    if (!t) return;
    sendMessage(ticket.id, { text: t });
    setText('');
  };
  const sendImage = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!r.canceled && r.assets[0]) sendMessage(ticket.id, { image: r.assets[0].uri });
  };

  return (
    <View style={styles.screen}>
      <TopBar
        title={`Ticket #${ticket.id}`}
        topInset={insets.top}
        arrow
        onBack={() => router.back()}
        right={
          <Pressable
            onPress={() => setConfirm(open ? 'close' : 'reopen')}
            hitSlop={6}
            style={({ pressed }) => [styles.headerBtn, pressed && { backgroundColor: '#F4F5F7' }]}
            accessibilityRole="button"
          >
            <Text style={styles.headerBtnText}>{open ? 'Close Ticket' : 'Reopen'}</Text>
          </Pressable>
        }
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scroll}
          contentContainerStyle={styles.thread}
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topic}>
            <Text style={styles.topicText}>
              {ticket.category} · {ticket.reason}
            </Text>
            {ticket.booking && (
              <Text style={styles.topicSub}>
                {ticket.booking.title} · {ticket.booking.ref}
              </Text>
            )}
          </View>
          {ticket.messages.map((m, i) => {
            const prev = ticket.messages[i - 1];
            const newDay = !prev || dayLabel(prev.at) !== dayLabel(m.at);
            return (
              <Fragment key={m.id}>
                {newDay && (
                  <View style={styles.day}>
                    <Text style={styles.dayText}>{dayLabel(m.at)}</Text>
                  </View>
                )}
                <Bubble m={m} />
              </Fragment>
            );
          })}
        </ScrollView>

        {open ? (
          <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            <Pressable
              onPress={() => void sendImage()}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel="Send a picture"
            >
              <Ionicons name="image-outline" size={20} color={T.text} />
            </Pressable>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Type your message..."
              placeholderTextColor={T.faint}
              style={styles.input}
              multiline
              maxLength={1000}
            />
            <Pressable
              onPress={send}
              disabled={!text.trim()}
              style={[styles.sendWrap, !text.trim() && { opacity: 0.5 }]}
              accessibilityRole="button"
              accessibilityLabel="Send"
            >
              <LinearGradient colors={T.yellow} style={styles.send}>
                <Ionicons name="send" size={17} color={T.ink} />
              </LinearGradient>
            </Pressable>
          </View>
        ) : (
          <View style={[styles.closed, { paddingBottom: Math.max(insets.bottom, 14) }]}>
            <Text style={styles.closedTitle}>This conversation is marked as {ticket.status}</Text>
            <Text style={styles.closedSub}>
              Still have an issue?{' '}
              <Text style={styles.closedLink} onPress={() => setConfirm('reopen')} accessibilityRole="link">
                Chat with us
              </Text>
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>

      <ConfirmSheet
        visible={!!confirm}
        title={
          confirm === 'close'
            ? 'Are you sure you want to close the Ticket?'
            : 'Are you sure you want to reopen the Ticket?'
        }
        confirm={confirm === 'close' ? 'Yes, Close the Ticket' : 'Yes, Reopen the Ticket'}
        onClose={() => setConfirm(undefined)}
        onConfirm={() => {
          setTicketStatus(ticket.id, confirm === 'close' ? 'Closed' : 'Open');
          setConfirm(undefined);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  missing: {
    margin: sz(24),
    textAlign: 'center',
    fontFamily: fonts.medium,
    fontSize: fs(14),
    color: T.muted,
  },
  headerBtn: {
    height: sz(30),
    paddingHorizontal: sz(12),
    borderRadius: sz(15),
    borderWidth: 1,
    borderColor: '#E3E5E9',
    justifyContent: 'center',
  },
  headerBtnText: {
    fontFamily: fonts.medium,
    fontSize: fs(12),
    color: T.text,
  },
  thread: {
    paddingHorizontal: sz(16),
    paddingVertical: sz(16),
    gap: sz(14),
  },
  topic: {
    alignSelf: 'center',
    maxWidth: '90%',
    paddingHorizontal: sz(14),
    paddingVertical: sz(8),
    borderRadius: sz(10),
    backgroundColor: '#EEF1F5',
    alignItems: 'center',
  },
  topicText: {
    textAlign: 'center',
    fontFamily: fonts.medium,
    fontSize: fs(12),
    color: T.text,
  },
  topicSub: {
    marginTop: sz(2),
    fontFamily: fonts.regular,
    fontSize: fs(11.5),
    color: HELP.sub,
  },
  day: {
    alignSelf: 'center',
    paddingHorizontal: sz(12),
    paddingVertical: sz(4),
    borderRadius: sz(12),
    backgroundColor: '#F1F2F4',
  },
  dayText: {
    fontFamily: fonts.regular,
    fontSize: fs(11.5),
    color: HELP.time,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: sz(8),
  },
  msgRowMe: {
    justifyContent: 'flex-end',
  },
  msgCol: {
    maxWidth: '76%',
    gap: sz(4),
  },
  who: {
    fontFamily: fonts.regular,
    fontSize: fs(11.5),
    color: HELP.sub,
  },
  bubble: {
    paddingHorizontal: sz(14),
    paddingVertical: sz(10),
    borderRadius: sz(14),
  },
  bubbleMe: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    borderTopRightRadius: sz(4),
  },
  bubbleAgent: {
    backgroundColor: '#FCF0C8',
    borderTopLeftRadius: sz(4),
  },
  bubbleImage: {
    padding: sz(4),
  },
  msgText: {
    fontFamily: fonts.regular,
    fontSize: fs(14),
    lineHeight: fs(20),
    color: '#101828',
  },
  image: {
    width: sz(180),
    height: sz(130),
    borderRadius: sz(10),
    backgroundColor: '#ECEDF0',
  },
  time: {
    fontFamily: fonts.regular,
    fontSize: fs(11),
    color: HELP.time,
  },
  avatar: {
    width: sz(32),
    height: sz(32),
    marginTop: sz(16),
    borderRadius: sz(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMe: {
    backgroundColor: '#FFEEEE',
  },
  avatarAgent: {
    backgroundColor: '#FFF8E1',
  },
  avatarText: {
    fontFamily: fonts.semiBold,
    fontSize: fs(11.5),
    color: '#3A3E44',
  },
  system: {
    alignSelf: 'center',
    paddingHorizontal: sz(14),
    paddingVertical: sz(7),
    borderRadius: sz(10),
    backgroundColor: '#FFEEEE',
  },
  systemText: {
    fontFamily: fonts.medium,
    fontSize: fs(12.5),
    color: '#101828',
  },
  composer: {
    paddingHorizontal: sz(12),
    paddingTop: sz(10),
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: sz(8),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HELP.line,
    backgroundColor: '#FFFFFF',
  },
  iconBtn: {
    width: sz(42),
    height: sz(42),
    borderRadius: sz(21),
    backgroundColor: '#F4F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: sz(42),
    maxHeight: sz(110),
    paddingHorizontal: sz(16),
    paddingTop: sz(11),
    paddingBottom: sz(11),
    borderRadius: sz(21),
    backgroundColor: '#F4F5F7',
    fontFamily: fonts.regular,
    fontSize: fs(14),
    color: T.text,
  },
  sendWrap: {
    borderRadius: sz(21),
  },
  send: {
    width: sz(42),
    height: sz(42),
    borderRadius: sz(21),
    alignItems: 'center',
    justifyContent: 'center',
  },
  closed: {
    paddingHorizontal: sz(16),
    paddingTop: sz(14),
    alignItems: 'center',
    gap: sz(4),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HELP.line,
    backgroundColor: '#FFFFFF',
  },
  closedTitle: {
    fontFamily: fonts.medium,
    fontSize: fs(13.5),
    color: T.text,
  },
  closedSub: {
    fontFamily: fonts.regular,
    fontSize: fs(13),
    color: HELP.sub,
  },
  closedLink: {
    fontFamily: fonts.semiBold,
    color: '#B8860B',
  },
});
