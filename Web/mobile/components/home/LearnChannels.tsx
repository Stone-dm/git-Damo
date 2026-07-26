/**
 * 【流程图节点：多元自主学习】
 * 2×2 矩形卡片四宫格
 */
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LiftCard } from '@/components/home/LiftCard';
import type { LearnChannel } from '@/src/mock/learningLoop';
import { colors } from '@/src/theme';

export function LearnChannels({
  channels,
  doneMap,
  onPress,
}: {
  channels: LearnChannel[];
  doneMap: Record<string, boolean>;
  onPress: (c: LearnChannel) => void;
}) {
  const { width } = useWindowDimensions();
  // 左右 padding 16*2 + 中间间距 10
  const cardWidth = (width - 32 - 10) / 2;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>多元自主学习</Text>
      <Text style={styles.sub}>
        流程图 · 四条并行学习路径（完成后进入统一测验）
      </Text>
      <View style={styles.grid}>
        {channels.map((c) => (
          <LiftCard
            key={c.id}
            onPress={() => onPress(c)}
            style={[styles.item, { width: cardWidth }]}
          >
            <View style={styles.row}>
              <View style={styles.icon}>
                <Text style={styles.iconText}>{c.icon}</Text>
              </View>
              <View style={styles.body}>
                <Text style={styles.itemTitle} numberOfLines={2}>
                  {c.title}
                </Text>
                <Text style={styles.itemSub} numberOfLines={1}>
                  {c.subtitle}
                </Text>
              </View>
            </View>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  { width: `${Math.round(c.progress * 100)}%` },
                ]}
              />
            </View>
            <View style={styles.foot}>
              <Text style={styles.pct}>{Math.round(c.progress * 100)}%</Text>
              <Text style={styles.points}>+{c.points}积分</Text>
            </View>
            {doneMap[c.id] ? (
              <Text style={styles.done}>已学 · 可去测验</Text>
            ) : null}
          </LiftCard>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, marginTop: 8 },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  sub: { color: colors.muted, fontSize: 11, marginTop: 4, marginBottom: 10 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  item: {
    minHeight: 108,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { color: colors.primary, fontWeight: '800', fontSize: 13 },
  body: { flex: 1, minWidth: 0 },
  itemTitle: { fontWeight: '700', color: colors.text, fontSize: 13, lineHeight: 18 },
  itemSub: { color: colors.muted, fontSize: 11, marginTop: 2 },
  track: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primarySoft,
    marginTop: 10,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.primary },
  foot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  pct: { fontSize: 11, color: colors.muted },
  points: { fontSize: 11, color: colors.gold, fontWeight: '700' },
  done: { marginTop: 4, fontSize: 10, color: colors.primary, fontWeight: '600' },
});
