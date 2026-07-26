import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ApiError } from '@/src/api/client';
import { listLearning } from '@/src/api/learning';
import type { LearningView } from '@/src/api/types';
import { colors } from '@/src/theme';

function errMsg(err: unknown): string {
  return err instanceof ApiError ? err.message : '请求失败';
}

export default function LearningDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<LearningView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const list = await listLearning();
        const found = list.find((x) => String(x.id) === String(id)) ?? null;
        if (!cancelled) {
          setItem(found);
          if (!found) setError('未找到该学习内容');
        }
      } catch (err) {
        if (!cancelled) setError(errMsg(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !item) {
    return (
      <View style={styles.page}>
        <Text style={styles.error}>{error ?? '未找到该学习内容'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.meta}>
        支部：{item.branchId ?? '全局'} ·{' '}
        {new Date(item.createdAt).toLocaleString()}
      </Text>
      <View style={styles.card}>
        <Text style={styles.section}>摘要</Text>
        <Text style={styles.body}>{item.summary || '暂无摘要'}</Text>
      </View>
      <Text style={styles.hint}>
        完整正文将在后续版本开放。可前往「推荐」获取个性化学习建议，或在「助手」中结合材料提问。
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  meta: { color: colors.muted, marginBottom: 16, fontSize: 13 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  section: {
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  body: { color: colors.text, lineHeight: 22 },
  hint: { color: colors.muted, lineHeight: 20, fontSize: 13 },
  error: {
    color: colors.error,
    backgroundColor: colors.errorBg,
    padding: 12,
    borderRadius: 8,
    margin: 16,
  },
});
