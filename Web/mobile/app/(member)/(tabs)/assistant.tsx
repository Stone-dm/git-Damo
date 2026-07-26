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
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { chat } from '@/src/api/agent';
import { ApiError } from '@/src/api/client';
import type { ChatHistoryItem } from '@/src/api/types';
import { colors } from '@/src/theme';

type Mode = 'qa' | 'parse' | 'note';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function errMsg(err: unknown): string {
  return err instanceof ApiError ? err.message : '请求失败';
}

const MODE_META: Record<
  Mode,
  { label: string; desc: string; placeholder: string }
> = {
  qa: {
    label: '党建问答',
    desc: '围绕党章党规、方针政策与支部学习提问。',
    placeholder: '例如：党的二十大报告有哪些核心要义？',
  },
  parse: {
    label: '文档解析',
    desc: '粘贴材料文本，让助手提炼要点、结构或对照学习。',
    placeholder: '例如：请总结这段材料的核心观点',
  },
  note: {
    label: '心得辅助',
    desc: '输入主题或要点，生成心得提纲或完善表述。',
    placeholder: '例如：主题「支部主题党日」，帮我写一份心得提纲',
  },
};

function buildMessage(mode: Mode, input: string): string {
  const trimmed = input.trim();
  if (mode === 'qa') {
    return `【党建知识问答】${trimmed}`;
  }
  if (mode === 'parse') {
    return `【文档解析】请基于所附文本进行解析与总结。用户指令：${trimmed}`;
  }
  return `【心得辅助】请根据以下需求，帮助完善学习心得或提纲：${trimmed}`;
}

export default function AssistantScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('qa');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [extraText, setExtraText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList<Message>>(null);

  async function onSend() {
    const raw = input.trim();
    if (!raw || sending) return;
    if (mode === 'parse' && !extraText.trim()) {
      setError('文档解析模式请先粘贴需要解析的文本');
      return;
    }

    setError(null);
    setSending(true);
    setInput('');

    const message = buildMessage(mode, raw);
    const history: ChatHistoryItem[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setMessages((prev) => [...prev, { role: 'user', content: raw }]);

    try {
      const res = await chat({
        message,
        text: mode === 'parse' ? extraText.trim() : null,
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
      setInput(raw);
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
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={{ paddingTop: insets.top + 8, paddingBottom: 12, paddingHorizontal: 16 }}
      >
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>
          AI 学习助手
        </Text>
        <Text style={{ color: '#fecaca', marginTop: 4, fontSize: 12 }}>
          党建问答 · 文档解析 · 心得辅助
        </Text>
      </LinearGradient>
      <View style={styles.modes}>
        {(Object.keys(MODE_META) as Mode[]).map((key) => (
          <Pressable
            key={key}
            style={[styles.modeBtn, mode === key && styles.modeBtnActive]}
            onPress={() => setMode(key)}
          >
            <Text
              style={[
                styles.modeText,
                mode === key && styles.modeTextActive,
              ]}
            >
              {MODE_META[key].label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.desc, { paddingHorizontal: 16 }]}>{MODE_META[mode].desc}</Text>
      {error ? <Text style={[styles.error, { marginHorizontal: 16 }]}>{error}</Text> : null}

      <FlatList
        ref={listRef}
        style={[styles.list, { paddingHorizontal: 16 }]}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        ListEmptyComponent={
          <Text style={styles.muted}>开始对话，助手会结合知识库作答。</Text>
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
        {mode === 'parse' ? (
          <TextInput
            style={[styles.input, styles.textarea]}
            value={extraText}
            onChangeText={setExtraText}
            placeholder="粘贴待解析的文档全文…"
            placeholderTextColor={colors.muted}
            multiline
          />
        ) : null}
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.grow]}
            value={input}
            onChangeText={setInput}
            placeholder={MODE_META[mode].placeholder}
            placeholderTextColor={colors.muted}
          />
          <Pressable
            style={[styles.button, sending && styles.buttonDisabled]}
            onPress={() => void onSend()}
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
  page: { flex: 1, backgroundColor: colors.bg },
  modes: { flexDirection: 'row', gap: 8, marginBottom: 8, paddingHorizontal: 16, paddingTop: 12 },
  modeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modeText: { color: colors.muted, fontWeight: '600', fontSize: 12 },
  modeTextActive: { color: colors.primaryText },
  desc: { color: colors.muted, marginBottom: 8, lineHeight: 18 },
  list: { flex: 1, marginBottom: 8 },
  bubble: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userBubble: {
    backgroundColor: '#fff7ed',
    alignSelf: 'flex-end',
    maxWidth: '92%',
  },
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
    marginHorizontal: 16,
    marginBottom: 12,
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
  textarea: { minHeight: 72, textAlignVertical: 'top' },
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
