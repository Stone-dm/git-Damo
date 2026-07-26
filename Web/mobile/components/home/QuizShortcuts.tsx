/**
 * 【流程图节点：线上答题测验 / 错题闯关温习】
 * 近期测验 & 错题快捷入口
 */
import { StyleSheet, Text, View } from 'react-native';
import { LiftCard } from '@/components/home/LiftCard';
import { colors } from '@/src/theme';

export function QuizShortcuts({
  wrongCount,
  lastScore,
  onQuiz,
  onReview,
}: {
  wrongCount: number;
  lastScore: number | null;
  onQuiz: () => void;
  onReview: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>统一考核与薄弱巩固</Text>
      <Text style={styles.sub}>流程图 · 自主学习后测验 → 错题闯关直至达标</Text>
      <View style={styles.row}>
        <LiftCard onPress={onQuiz} style={styles.half}>
          <Text style={styles.cardTitle}>线上答题测验</Text>
          <Text style={styles.cardBody}>
            {lastScore == null
              ? '完成任一学习渠道后进入专项题库'
              : `最近得分 ${lastScore} 分`}
          </Text>
        </LiftCard>
        <LiftCard onPress={onReview} style={styles.half}>
          <Text style={styles.cardTitle}>错题闯关温习</Text>
          <Text style={styles.cardBody}>待巩固错题 {wrongCount} 道</Text>
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
