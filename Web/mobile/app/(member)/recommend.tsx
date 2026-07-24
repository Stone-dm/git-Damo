import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { recommend } from '@/src/api/agent';
import { ApiError } from '@/src/api/client';
import type { RecommendItem } from '@/src/api/types';
import { colors } from '@/src/theme';

function errMsg(err: unknown): string {
  return err instanceof ApiError ? err.message : '请求失败';
}

export default function RecommendScreen() {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<RecommendItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  async function onSubmit() {
    setLoading(true);
    setError(null);
    try {
      const res = await recommend({
        query: query.trim() || undefined,
      });
      setItems(res.items ?? []);
      setFetched(true);
    } catch (err) {
      setError(errMsg(err));
      setItems([]);
      setFetched(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.page}>
      <Text style={styles.desc}>基于双知识库检索生成个性化学习推荐。</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="例如：二十大报告学习要点"
          placeholderTextColor={colors.muted}
        />
        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={onSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.primaryText} />
          ) : (
            <Text style={styles.buttonText}>获取推荐</Text>
          )}
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item, idx) => `${item.document_id}-${idx}`}
        ListHeaderComponent={
          <Text style={styles.section}>推荐结果</Text>
        }
        ListEmptyComponent={
          <Text style={styles.muted}>
            {!fetched && !loading
              ? '点击「获取推荐」开始。'
              : loading
                ? '加载中…'
                : '暂无推荐结果'}
          </Text>
        }
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.muted}>{item.reason}</Text>
            <Text style={styles.meta}>
              文档 ID：{item.document_id || '—'}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  desc: { color: colors.muted, marginBottom: 12 },
  form: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    gap: 10,
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
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: colors.primaryText, fontWeight: '600' },
  section: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  list: { paddingBottom: 24 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  muted: { color: colors.muted, lineHeight: 20 },
  meta: { color: colors.muted, fontSize: 12, marginTop: 8 },
  error: {
    color: colors.error,
    backgroundColor: colors.errorBg,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
});
