import React, { useEffect, useRef, useState } from 'react';
import {
  Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Screen from '../../components/ui/Screen';
import Avatar from '../../components/ui/Avatar';
import {
  getArtisan, getConversations, getMessages, markConversationRead, sendMessage
} from '../../services/api';
import { useLive } from '../../hooks/useLive';
import { colors, g, radius } from '../../theme';

/**
 * Chat realtime simulata: bolle me/loro, messaggi di sistema centrati,
 * indicatori "online / sta scrivendo / visto".
 * PROVIDER REALE: WebSocket (Socket.io) verso il backend NestJS.
 */
export default function ChatRoom() {
  const { t } = useTranslation();
  const nav = useNavigation<any>();
  const { params } = useRoute<any>();
  useLive();

  const conv = getConversations().find((c) => c.id === params.conversationId);
  const artisan = conv ? getArtisan(conv.artisanId) : null;
  const messages = getMessages(params.conversationId);

  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const lastCount = useRef(messages.length);

  useEffect(() => {
    markConversationRead(params.conversationId);
  }, [params.conversationId, messages.length]);

  // Indicatore "sta scrivendo" mock prima della risposta automatica
  useEffect(() => {
    if (messages.length > lastCount.current) {
      const last = messages[messages.length - 1];
      if (last.from === 'me') {
        setTyping(true);
      } else {
        setTyping(false);
      }
    }
    lastCount.current = messages.length;
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
  }, [messages.length]);

  const send = async () => {
    const value = text.trim();
    if (!value) return;
    setText('');
    await sendMessage(params.conversationId, value);
  };

  if (!conv || !artisan) return <Screen><View /></Screen>;

  const lastMine = [...messages].reverse().find((m) => m.from === 'me');

  return (
    <Screen pad={false}>
      {/* Header con stato online */}
      <View style={styles.top}>
        <Pressable onPress={() => nav.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </Pressable>
        <Pressable style={[g.row, { gap: 10, flex: 1, marginStart: 10 }]}
          onPress={() => nav.navigate('ArtisanProfile', { artisanId: artisan.id })}>
          <Avatar name={artisan.name} color={artisan.color} size={40} />
          <View>
            <Text style={[g.h2, { fontSize: 16 }]}>{artisan.name}</Text>
            <Text style={[g.small, { color: typing ? colors.primary : colors.success }]}>
              {typing ? t('chat.typing') : t('chat.online')}
            </Text>
          </View>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={10}>
        <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 16, paddingBottom: 20 }}>
          {messages.map((m) => {
            if (m.from === 'system') {
              return (
                <View key={m.id} style={styles.system}>
                  <Ionicons name="information-circle" size={14} color={colors.sub} />
                  <Text style={[g.small, { flexShrink: 1 }]}>{m.text}</Text>
                </View>
              );
            }
            const mine = m.from === 'me';
            return (
              <View key={m.id} style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                {m.image && <Image source={{ uri: m.image }} style={styles.img} />}
                {!!m.text && (
                  <Text style={[g.body, mine && { color: '#fff' }]}>{m.text}</Text>
                )}
              </View>
            );
          })}
          {/* "Visto" sotto l'ultimo mio messaggio */}
          {lastMine?.status === 'seen' && !typing && (
            <Text style={[g.small, { alignSelf: 'flex-end', marginTop: 2 }]}>{t('chat.seen')}</Text>
          )}
          {typing && (
            <View style={[styles.bubble, styles.theirs]}>
              <Text style={[g.body, { color: colors.sub }]}>…</Text>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputBar}>
          <TextInput style={styles.input} value={text} onChangeText={setText}
            placeholder={t('chat.placeholder')} placeholderTextColor="#A8A29E"
            onSubmitEditing={send} returnKeyType="send" />
          <Pressable style={styles.sendBtn} onPress={send}>
            <Ionicons name="send" size={18} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border
  },
  system: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center',
    backgroundColor: colors.card, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6, marginVertical: 8,
    maxWidth: '90%'
  },
  bubble: { maxWidth: '78%', borderRadius: radius.md, padding: 12, marginBottom: 8 },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomEndRadius: 4 },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.card, borderBottomStartRadius: 4 },
  img: { width: 180, height: 130, borderRadius: radius.sm, marginBottom: 6 },
  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, backgroundColor: colors.bg
  },
  input: {
    flex: 1, backgroundColor: colors.card, borderRadius: 99, paddingHorizontal: 16, paddingVertical: 11,
    fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center'
  }
});
