import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/src/theme';

const ITEMS = [
  {
    title: '学习任务待完成',
    level: '重要',
    body: '「今日支部必学」课程尚未完成，完成后可获得积分奖励。',
  },
  {
    title: '考试开放提醒',
    level: '通知',
    body: '本支部学习考核窗口即将开放，请提前复习党规党纪要点。',
  },
  {
    title: '系统维护公告',
    level: '公告',
    body: '周末晚间可能进行短时维护，请提前保存学习进度。',
  },
] as const;

export default function NoticesScreen() {
  return (
    <View style={styles.page}>
      <Text style={styles.desc}>个人学习与支部相关通知（演示数据）。</Text>
      {ITEMS.map((item) => (
        <View key={item.title} style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.badge}>{item.level}</Text>
          </View>
          <Text style={styles.body}>{item.body}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  desc: { color: colors.muted, marginBottom: 12, lineHeight: 20 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  title: { flex: 1, fontWeight: '700', color: colors.text, fontSize: 15 },
  badge: {
    color: colors.primary,
    backgroundColor: colors.primarySoft,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    fontSize: 11,
    fontWeight: '600',
  },
  body: { color: colors.muted, lineHeight: 20 },
});
