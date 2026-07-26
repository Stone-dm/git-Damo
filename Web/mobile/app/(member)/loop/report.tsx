/** 【流程图：生成个人综合成长报告】 */
import { StyleSheet, Text, View } from 'react-native';
import { MOCK_GROWTH_REPORT } from '@/src/mock/learningLoop';
import { colors } from '@/src/theme';

export default function ReportScreen() {
  const r = MOCK_GROWTH_REPORT;
  return (
    <View style={styles.page}>
      <Text style={styles.hint}>
        流程图 · 汇总学习、答题、VR、闯关数据生成综合成长报告
      </Text>
      <View style={styles.card}>
        <Text style={styles.row}>学习时长：{r.studyHours} 小时</Text>
        <Text style={styles.row}>
          测验达标率：{Math.round(r.quizPassRate * 100)}%
        </Text>
        <Text style={styles.row}>VR 研学次数：{r.vrSessions}</Text>
        <Text style={styles.row}>长征路里程：{r.marchKm} km</Text>
        <Text style={styles.summary}>{r.summary}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  hint: { color: colors.muted, marginBottom: 12, lineHeight: 20 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { color: colors.text, lineHeight: 28, fontWeight: '600' },
  summary: { color: colors.muted, marginTop: 12, lineHeight: 22 },
});
