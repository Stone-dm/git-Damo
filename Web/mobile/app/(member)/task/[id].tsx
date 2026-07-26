import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ApiError } from '@/src/api/client';
import { getTask } from '@/src/api/tasks';
import type { TaskView } from '@/src/api/types';
import { colors } from '@/src/theme';

const TYPE_LABEL: Record<string, string> = {
  LEARNING: '学习任务',
  EXAM: '考试任务',
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: '草稿',
  ACTIVE: '进行中',
  CLOSED: '已关闭',
};

function errMsg(err: unknown): string {
  return err instanceof ApiError ? err.message : '请求失败';
}

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [task, setTask] = useState<TaskView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const num = Number(id);
    if (!Number.isFinite(num)) {
      setError('无效任务');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setTask(await getTask(num));
    } catch (err) {
      setError(errMsg(err));
      setTask(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !task) {
    return (
      <View style={styles.page}>
        <Text style={styles.error}>{error ?? '任务不存在'}</Text>
        <Pressable
          style={styles.btn}
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/(member)/home' as never);
          }}
        >
          <Text style={styles.btnText}>返回</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.badgeRow}>
        <Text style={styles.badge}>{TYPE_LABEL[task.type] ?? task.type}</Text>
        <Text style={[styles.badge, styles.badgeStatus]}>
          {STATUS_LABEL[task.status] ?? task.status}
        </Text>
      </View>
      <Text style={styles.title}>{task.title}</Text>
      <Text style={styles.meta}>
        截止：
        {task.dueDate
          ? new Date(task.dueDate).toLocaleString()
          : '暂无截止日期'}
      </Text>
      <Text style={styles.meta}>
        下发范围：
        {task.targetType === 'ALL'
          ? '全平台'
          : `指定支部 ${(task.targetBranchIds ?? []).join('、') || '—'}`}
      </Text>

      <View style={styles.card}>
        <Text style={styles.section}>任务说明</Text>
        <Text style={styles.body}>{task.description || '暂无详细说明'}</Text>
      </View>

      {task.type === 'LEARNING' ? (
        <Pressable
          style={styles.btn}
          onPress={() =>
            task.referenceId
              ? router.push(`/(member)/learning/${task.referenceId}` as never)
              : router.push('/(member)/learning' as never)
          }
        >
          <Text style={styles.btnText}>
            {task.referenceId ? '进入关联学习内容' : '前往学习中心'}
          </Text>
        </Pressable>
      ) : (
        <Pressable
          style={styles.btn}
          onPress={() => router.push('/(member)/duty' as never)}
        >
          <Text style={styles.btnText}>前往考试列表</Text>
        </Pressable>
      )}
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
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  badge: {
    backgroundColor: colors.primarySoft,
    color: colors.primary,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: '700',
  },
  badgeStatus: {
    backgroundColor: colors.goldSoft,
    color: '#8a6d1a',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  meta: { color: colors.muted, marginBottom: 4, lineHeight: 20 },
  card: {
    marginTop: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  section: { fontWeight: '700', color: colors.text, marginBottom: 8 },
  body: { color: colors.text, lineHeight: 22 },
  btn: {
    marginTop: 20,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: { color: colors.primaryText, fontWeight: '700', fontSize: 15 },
  error: {
    color: colors.error,
    backgroundColor: colors.errorBg,
    padding: 12,
    borderRadius: 8,
    margin: 16,
  },
});
