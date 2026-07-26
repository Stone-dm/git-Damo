/**
 * 【流程图节点：AI 薄弱点专项推送】
 */
import { StyleSheet, Text, View } from 'react-native';
import { LiftCard } from '@/components/home/LiftCard';
import type { RecommendResource } from '@/src/mock/learningLoop';
import { colors } from '@/src/theme';

export function AiRecommend({
  items,
  onPress,
}: {
  items: RecommendResource[];
  onPress: (item: RecommendResource) => void;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>AI 个性化推荐</Text>
      <Text style={styles.sub}>流程图 · 根据画像自动推送薄弱知识点专项资源</Text>
      {items.map((item) => (
        <LiftCard key={item.id} onPress={() => onPress(item)} style={styles.card}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.reason}>{item.reason}</Text>
          <Text style={styles.points}>+{item.points} 积分</Text>
        </LiftCard>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, marginTop: 8 },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  sub: { color: colors.muted, fontSize: 11, marginTop: 4, marginBottom: 10 },
  card: { marginBottom: 8 },
  itemTitle: { fontWeight: '700', color: colors.text },
  reason: { color: colors.muted, marginTop: 6, lineHeight: 18, fontSize: 12 },
  points: { marginTop: 8, color: colors.gold, fontWeight: '700', fontSize: 12 },
});
