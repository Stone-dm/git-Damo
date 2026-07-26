/**
 * 学习 Tab — 承接上级（书记/管理员）下发的任务与考试
 */
import { useRouter } from 'expo-router';
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
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

/** 后端无数据时的演示任务，便于本地预览 */
const FALLBACK_TASKS: TaskView[] = [
  {
    id: 9001,
    title: '支部必学：党的二十大精神专题',
    description: '由支部书记下发的本周必学任务，请按时完成学习与测验。',
    type: 'LEARNING',
    status: 'ACTIVE',
    targetType: 'BRANCH',
    targetBranchIds: [1],
    referenceId: null,
    dueDate: '2026-07-30T18:00:00',
    createdAt: '2026-07-26T09:00:00',
  },
  {
    id: 9002,
    title: '专题党课：新时代党的建设总要求',
    description: '观看专题党课并提交学习记录。',
    type: 'LEARNING',
    status: 'ACTIVE',
    targetType: 'BRANCH',
    targetBranchIds: [1],
    referenceId: null,
    dueDate: '2026-08-02T20:00:00',
    createdAt: '2026-07-25T10:00:00',
  },
];

const FALLBACK_EXAMS: ExamView[] = [
  {
    id: 9101,
    title: '党章党规基础知识测验',
    status: 'OPEN',
    branchId: 1,
  },
];

export default function StudyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [segment, setSegment] = useState<Segment>('tasks');
  const [tasks, setTasks] = useState<TaskView[]>([]);
  const [exams, setExams] = useState<ExamView[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [taskList, examList] = await Promise.all([
        listTasks().catch(() => [] as TaskView[]),
        listExams().catch(() => [] as ExamView[]),
      ]);
      const visibleTasks = taskList.filter((t) => t.status !== 'DRAFT');
      if (visibleTasks.length === 0 && examList.length === 0) {
        setTasks(FALLBACK_TASKS);
        setExams(FALLBACK_EXAMS);
        setUsingFallback(true);
      } else {
        setTasks(visibleTasks);
        setExams(examList);
        setUsingFallback(false);
      }
    } catch (err) {
      setError(errMsg(err));
      setTasks(FALLBACK_TASKS);
      setExams(FALLBACK_EXAMS);
      setUsingFallback(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <Text style={styles.headerTitle}>学习</Text>
        <Text style={styles.headerSub}>
          承接支部 / 上级下发的学习任务与考试
        </Text>
      </LinearGradient>

      <View style={styles.segments}>
        {(
          [
            ['tasks', '下发任务'],
            ['exams', '考试安排'],
          ] as const
        ).map(([key, label]) => (
          <Pressable
            key={key}
            style={[styles.segBtn, segment === key && styles.segBtnActive]}
            onPress={() => setSegment(key)}
          >
            <Text
              style={[styles.segText, segment === key && styles.segTextActive]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {usingFallback ? (
        <Text style={styles.tip}>
          当前为演示数据。书记在 Web 端派发任务 / 考试后将自动同步到此处。
        </Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading && !refreshing ? (
        <ActivityIndicator
          color={colors.primary}
          style={{ marginTop: 32 }}
          size="large"
        />
      ) : segment === 'tasks' ? (
        <FlatList
          data={tasks}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load(true)}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>暂无上级下发的学习任务</Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() =>
                item.id >= 9000
                  ? router.push('/(member)/loop/theory' as never)
                  : router.push(`/(member)/task/${item.id}` as never)
              }
            >
              <View style={styles.cardTop}>
                <Text style={styles.type}>
                  {item.type === 'LEARNING' ? '学习任务' : '考试任务'}
                </Text>
                <Text style={styles.status}>
                  {TASK_STATUS[item.status] ?? item.status}
                </Text>
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.desc} numberOfLines={2}>
                {item.description || '暂无说明'}
              </Text>
              <Text style={styles.meta}>
                {item.dueDate
                  ? `截止 ${new Date(item.dueDate).toLocaleString()}`
                  : '暂无截止日期'}
              </Text>
            </Pressable>
          )}
        />
      ) : (
        <FlatList
          data={exams}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load(true)}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>暂无考试安排</Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => router.push('/(member)/loop/quiz' as never)}
            >
              <View style={styles.cardTop}>
                <Text style={styles.type}>考试</Text>
                <Text style={styles.status}>
                  {EXAM_STATUS[item.status] ?? item.status}
                </Text>
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.meta}>
                支部：{item.branchId ?? '全局'} · 点击进入作答
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  headerSub: { color: '#fecaca', marginTop: 6, fontSize: 12 },
  segments: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  segBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  segText: { color: colors.muted, fontWeight: '700' },
  segTextActive: { color: '#fff' },
  tip: {
    marginHorizontal: 16,
    marginBottom: 8,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  error: {
    marginHorizontal: 16,
    color: colors.error,
    backgroundColor: colors.errorBg,
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  type: {
    color: colors.primary,
    backgroundColor: colors.primarySoft,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: '700',
  },
  status: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  title: { fontWeight: '800', color: colors.text, fontSize: 15 },
  desc: { color: colors.muted, marginTop: 6, lineHeight: 20, fontSize: 13 },
  meta: { color: colors.gold, marginTop: 10, fontSize: 12, fontWeight: '600' },
});
