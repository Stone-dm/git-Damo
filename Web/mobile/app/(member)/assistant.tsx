import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { chat } from '@/src/api/agent';
import { ApiError } from '@/src/api/client';
import type { ChatHistoryItem } from '@/src/api/types';
import { colors } from '@/src/theme';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function errMsg(err: unknown): string {
  return err instanceof ApiError ? err.message : '请求失败';
}

export default function AssistantScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [extraText, setExtraText] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList<Message>>(null);

  async function onSend() {
    const message = input.trim();
    if (!message || sending) return;

    setError(null);
    setSending(true);
    setInput('');

    const history: ChatHistoryItem[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setMessages((prev) => [...prev, { role: 'user', content: message }]);

    try {
      const parsedDoc =
        documentId.trim() === '' ? null : Number(documentId.trim());
      const res = await chat({
        message,
        text: extraText.trim() || null,
        documentId: Number.isFinite(parsedDoc as number) ? parsedDoc : null,
        history,
      });
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.reply },
      ]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    } catch (err) {
      setError(errMsg(err));
      setMessages((prev) => prev.slice(0, -1));
      setInput(message);
    } finally {
      setSending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      <Text style={styles.desc}>
        聊天对话；可附加文本用于总结整理，也可指定知识库文档 ID。
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        ref={listRef}
        style={styles.list}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        ListEmptyComponent={
          <Text style={styles.muted}>
            开始提问，例如：「帮我总结这段材料的要点」
          </Text>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.role === 'user' ? styles.userBubble : styles.assistantBubble,
            ]}
          >
            <Text style={styles.role}>
              {item.role === 'user' ? '我' : '助手'}
            </Text>
            <Text style={styles.content}>{item.content}</Text>
          </View>
        )}
      />

      <View style={styles.composer}>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={extraText}
          onChangeText={setExtraText}
          placeholder="附加文本（可选，用于总结）"
          placeholderTextColor={colors.muted}
          multiline
        />
        <TextInput
          style={styles.input}
          value={documentId}
          onChangeText={setDocumentId}
          placeholder="文档 ID（可选）"
          placeholderTextColor={colors.muted}
          keyboardType="number-pad"
        />
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.grow]}
            value={input}
            onChangeText={setInput}
            placeholder="输入问题或指令…"
            placeholderTextColor={colors.muted}
          />
          <Pressable
            style={[styles.button, sending && styles.buttonDisabled]}
            onPress={onSend}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color={colors.primaryText} />
            ) : (
              <Text style={styles.buttonText}>发送</Text>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  desc: { color: colors.muted, marginBottom: 8 },
  list: { flex: 1, marginBottom: 8 },
  bubble: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userBubble: { backgroundColor: '#fff7ed', alignSelf: 'flex-end', maxWidth: '92%' },
  assistantBubble: {
    backgroundColor: colors.card,
    alignSelf: 'flex-start',
    maxWidth: '92%',
  },
  role: { fontSize: 12, color: colors.muted, marginBottom: 4 },
  content: { color: colors.text, lineHeight: 20 },
  composer: {
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    backgroundColor: '#fff',
  },
  textarea: { minHeight: 64, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  grow: { flex: 1 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 72,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: colors.primaryText, fontWeight: '600' },
  muted: { color: colors.muted, lineHeight: 20, marginTop: 8 },
  error: {
    color: colors.error,
    backgroundColor: colors.errorBg,
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
});
