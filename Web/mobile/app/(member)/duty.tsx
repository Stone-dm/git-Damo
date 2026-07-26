import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ApiError } from '@/src/api/client';
import { listExams } from '@/src/api/exams';
import { listTasks } from '@/src/api/tasks';
import type { ExamView, TaskView } from '@/src/api/types';
import { colors } from '@/src/theme';

type Segment = 'tasks' | 'exams';

function errMsg(err: unknown): string {
  return err instanceof ApiError ? err.message : '请求失败';
}

const TASK_STATUS: Record<string, string> = {
  DRAFT: '草稿',
  ACTIVE: '进行中',
  CLOSED: '已关闭',
};

const EXAM_STATUS: Record<string, string> = {
  DRAFT: '草稿',
  OPEN: '开放',
};

export default function DutyScreen() {
  const [segment, setSegment] = useState<Segment>('tasks');
  const [tasks, setTasks] = useState<TaskView[]>([]);
  const [exams, setExams] = useState<ExamView[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [taskList, examList] = await Promise.all([
        listTasks().catch(() => [] as TaskView[]),
        listExams().catch(() => [] as ExamView[]),
      ]);
      setTasks(taskList.filter((t) => t.status !== 'DRAFT'));
      setExams(examList);
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
      <View style={styles.segments}>
        {(
          [
            ['tasks', '任务'],
            ['exams', '考试'],
          ] as const
        ).map(([key, label]) => (
          <Pressable
            key={key}
            style={[styles.segBtn, segment === key && styles.segBtnActive]}
            onPress={() => setSegment(key)}
          >
            <Text
              style={[
                styles.segText,
                segment === key && styles.segTextActive,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.hint}>
        当前为只读查看。完成任务与在线答题将在后续版本开放。
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading && !refreshing ? (
        <ActivityIndicator
          style={{ marginTop: 24 }}
          color={colors.primary}
          size="large"
        />
      ) : segment === 'tasks' ? (
        <FlatList
          data={tasks}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load(true)}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <Text style={styles.muted}>暂无可见任务</Text>
          }
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.muted} numberOfLines={3}>
                {item.description || '暂无说明'}
              </Text>
              <Text style={styles.meta}>
                {item.type === 'LEARNING' ? '学习任务' : '考试任务'} ·{' '}
                {TASK_STATUS[item.status] ?? item.status}
                {item.dueDate
                  ? ` · 截止 ${new Date(item.dueDate).toLocaleDateString()}`
                  : ''}
              </Text>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={exams}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load(true)}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <Text style={styles.muted}>暂无考试</Text>
          }
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.meta}>
                {EXAM_STATUS[item.status] ?? item.status} · 支部：
                {item.branchId ?? '全局'}
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
  segments: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  segBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  segBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  segText: { color: colors.muted, fontWeight: '600' },
  segTextActive: { color: colors.primaryText },
  hint: { color: colors.muted, marginBottom: 12, lineHeight: 20 },
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
