/** 【流程图：查看 AI 学习画像、思想动态分析报告】 */
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MOCK_AI_PORTRAIT } from '@/src/mock/learningLoop';
import { colors } from '@/src/theme';

export default function PortraitScreen() {
  const p = MOCK_AI_PORTRAIT;
  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.hint}>
        流程图 · AI 识别播放行为与错题数据，生成专注度指标与个性化建议
      </Text>
      <View style={styles.card}>
        <Text style={styles.title}>专注度 {p.focusScore}</Text>
        <Text style={styles.body}>{p.ideologyBrief}</Text>
        <Text style={styles.section}>学习建议</Text>
        {p.suggestions.map((s) => (
          <Text key={s} style={styles.tip}>
            · {s}
          </Text>
        ))}
        <Text style={styles.section}>薄弱点</Text>
        {p.weakPoints.map((w) => (
          <Text key={w.name} style={styles.tip}>
            {w.name} · 错题占比 {Math.round(w.rate * 100)}%
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  hint: { color: colors.muted, marginBottom: 12, lineHeight: 20 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.primary },
  body: { color: colors.text, marginTop: 10, lineHeight: 22 },
  section: { marginTop: 14, fontWeight: '700', color: colors.text },
  tip: { color: colors.muted, marginTop: 6, lineHeight: 20 },
});
