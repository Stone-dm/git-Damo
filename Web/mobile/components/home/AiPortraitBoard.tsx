/**
 * 【流程图节点：AI 专注度 / 学习画像 / 思想动态】
 * 使用纯 View 绘制折线柱状示意（避免 react-native-chart-kit 破损依赖）
 */
import { StyleSheet, Text, View } from 'react-native';
import type { AiPortrait } from '@/src/mock/learningLoop';
import { colors } from '@/src/theme';

const WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

function FocusBars({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <View style={styles.chartRow}>
      {values.map((v, i) => (
        <View key={WEEK_LABELS[i]} style={styles.chartCol}>
          <View style={styles.barTrack}>
            <View
              style={[styles.barFill, { height: Math.max(6, (v / max) * 90) }]}
            />
          </View>
          <Text style={styles.chartLabel}>{WEEK_LABELS[i]}</Text>
          <Text style={styles.chartVal}>{v}</Text>
        </View>
      ))}
    </View>
  );
}

function WeakBars({
  items,
}: {
  items: { name: string; rate: number }[];
}) {
  return (
    <View style={{ gap: 10 }}>
      {items.map((w) => (
        <View key={w.name}>
          <View style={styles.weakHead}>
            <Text style={styles.weakName}>{w.name}</Text>
            <Text style={styles.weakPct}>{Math.round(w.rate * 100)}%</Text>
          </View>
          <View style={styles.weakTrack}>
            <View
              style={[
                styles.weakFill,
                { width: `${Math.round(w.rate * 100)}%` },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

export function AiPortraitBoard({
  portrait,
  onOpenDetail,
}: {
  portrait: AiPortrait;
  onOpenDetail: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.title}>AI 学习画像看板</Text>
        <Text style={styles.link} onPress={onOpenDetail}>
          查看报告
        </Text>
      </View>
      <Text style={styles.sub}>
        流程图 · AI 识别播放行为 → 专注度指标 + 思想动态分析
      </Text>

      <View style={styles.card}>
        <Text style={styles.focus}>
          专注度指标{' '}
          <Text style={styles.focusNum}>{portrait.focusScore}</Text>
        </Text>
        <Text style={styles.section}>近一周专注度趋势</Text>
        <FocusBars values={portrait.weeklyFocus} />
        <Text style={styles.section}>高频薄弱知识点</Text>
        <WeakBars items={portrait.weakPoints} />
        <Text style={styles.section}>思想动态简要</Text>
        <Text style={styles.brief}>{portrait.ideologyBrief}</Text>
        {portrait.suggestions.map((s) => (
          <Text key={s} style={styles.tip}>
            · {s}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, marginTop: 8 },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  link: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  sub: { color: colors.muted, fontSize: 11, marginTop: 4, marginBottom: 10 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  focus: { color: colors.muted, marginBottom: 4 },
  focusNum: { color: colors.primary, fontWeight: '800', fontSize: 22 },
  section: {
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    height: 130,
  },
  chartCol: { flex: 1, alignItems: 'center' },
  barTrack: {
    height: 90,
    width: '70%',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    backgroundColor: colors.primary,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  chartLabel: { fontSize: 10, color: colors.muted, marginTop: 4 },
  chartVal: { fontSize: 9, color: colors.gold, fontWeight: '700' },
  weakHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  weakName: { color: colors.text, fontSize: 13, fontWeight: '600' },
  weakPct: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  weakTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primarySoft,
    overflow: 'hidden',
  },
  weakFill: { height: '100%', backgroundColor: colors.gold, borderRadius: 4 },
  brief: { color: colors.text, lineHeight: 20, fontSize: 13 },
  tip: { color: colors.muted, marginTop: 4, fontSize: 12, lineHeight: 18 },
});
