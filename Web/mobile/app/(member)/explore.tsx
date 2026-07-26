import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/src/theme';

const MODULES = [
  {
    title: 'AI 综合报告',
    blurb: '汇总学习、任务与考试表现，生成阶段性分析。',
  },
  {
    title: '趣味温习 · 错题闯关',
    blurb: '基于错题本的闯关练习，巩固薄弱知识点。',
  },
  {
    title: 'VR 红色实景研学',
    blurb: '沉浸式红色场景研学，后续版本开放。',
  },
  {
    title: '重走长征路',
    blurb: '运动地图闯关，边走边学长征精神。',
  },
  {
    title: '党课众筹共创',
    blurb: '党员共创党课选题与规划，集思广益。',
  },
] as const;

export default function ExploreScreen() {
  return (
    <View style={styles.page}>
      <Text style={styles.desc}>
        探索更多党员端能力。以下模块即将开放，敬请期待。
      </Text>
      <View style={styles.grid}>
        {MODULES.map((mod) => (
          <Pressable key={mod.title} style={styles.card} disabled>
            <Text style={styles.cardTitle}>{mod.title}</Text>
            <Text style={styles.blurb}>{mod.blurb}</Text>
            <Text style={styles.badge}>即将开放</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  desc: { color: colors.muted, marginBottom: 14, lineHeight: 20 },
  grid: { gap: 12 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  blurb: { color: colors.muted, lineHeight: 20, marginBottom: 10 },
  badge: {
    alignSelf: 'flex-start',
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
});
