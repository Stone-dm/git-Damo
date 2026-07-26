/**
 * 【流程图节点：接收学习任务】
 * 今日学习任务区 — 支部推送必学专题、截止时间、完成进度
 */
import { StyleSheet, Text, View } from 'react-native';
import { LiftCard } from '@/components/home/LiftCard';
import type { MockTask } from '@/src/mock/learningLoop';
import { colors } from '@/src/theme';

export function TodayTasks({
  tasks,
  onPressTask,
}: {
  tasks: MockTask[];
  onPressTask: (task: MockTask) => void;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>今日学习任务</Text>
      <Text style={styles.sub}>流程图 · 接收支部下发学习任务 / 专题党课</Text>
      {tasks.map((t) => (
        <LiftCard key={t.id} onPress={() => onPressTask(t)} style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.tag}>{t.required ? '必学' : '拓展'}</Text>
            <Text style={styles.deadline}>
              截止 {new Date(t.deadline).toLocaleString()}
            </Text>
          </View>
          <Text style={styles.taskTitle}>{t.title}</Text>
          <View style={styles.progressRow}>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  { width: `${Math.round(t.progress * 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.pct}>{Math.round(t.progress * 100)}%</Text>
          </View>
        </LiftCard>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, marginTop: 16 },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  sub: { color: colors.muted, fontSize: 11, marginTop: 4, marginBottom: 10 },
  card: { marginBottom: 10 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  tag: {
    color: colors.primary,
    backgroundColor: colors.primarySoft,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: '700',
  },
  deadline: { color: colors.muted, fontSize: 11 },
  taskTitle: { fontWeight: '700', color: colors.text, fontSize: 15 },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  track: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primarySoft,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  pct: { width: 36, fontSize: 12, color: colors.muted },
});
