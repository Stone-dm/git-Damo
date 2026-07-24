import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
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

export default function LearningScreen() {
  const [items, setItems] = useState<LearningView[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await listLearning();
      setItems(data);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={styles.page}>
      <Text style={styles.desc}>按角色可见范围展示学习内容。</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading && !refreshing ? (
        <ActivityIndicator
          style={{ marginTop: 24 }}
          color={colors.primary}
          size="large"
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load(true)}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <Text style={styles.muted}>暂无学习资料</Text>
          }
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.muted}>{item.summary || '暂无摘要'}</Text>
              <Text style={styles.meta}>
                支部：{item.branchId ?? '全局'} ·{' '}
                {new Date(item.createdAt).toLocaleString()}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  desc: { color: colors.muted, marginBottom: 12 },
  list: { paddingBottom: 24, gap: 12 },
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
