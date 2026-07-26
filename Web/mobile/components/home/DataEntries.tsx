/**
 * 【流程图节点：个人综合成长报告 / 优化下一阶段计划】
 */
import { StyleSheet, Text, View } from 'react-native';
import { LiftCard } from '@/components/home/LiftCard';
import { colors } from '@/src/theme';

export function DataEntries({
  onReport,
  onPlan,
}: {
  onReport: () => void;
  onPlan: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>数据复盘闭环</Text>
      <Text style={styles.sub}>
        流程图 · 汇总学习数据生成成长报告 → 优化下一阶段计划
      </Text>
      <View style={styles.row}>
        <LiftCard onPress={onReport} style={styles.half}>
          <Text style={styles.cardTitle}>个人综合成长报告</Text>
          <Text style={styles.cardBody}>学习 · 答题 · VR · 闯关汇总</Text>
        </LiftCard>
        <LiftCard onPress={onPlan} style={styles.half}>
          <Text style={styles.cardTitle}>下一阶段学习计划</Text>
          <Text style={styles.cardBody}>依据报告智能定制</Text>
        </LiftCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, marginTop: 8 },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  sub: { color: colors.muted, fontSize: 11, marginTop: 4, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  cardTitle: { fontWeight: '700', color: colors.text, fontSize: 14 },
  cardBody: { color: colors.muted, marginTop: 6, fontSize: 12, lineHeight: 18 },
});
