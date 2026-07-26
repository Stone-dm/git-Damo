/**
 * 多元自主学习 — 按学习类型分类筛选
 * 从首页等入口进入，不占用底部「学习」Tab
 */
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '@/src/theme';

type LearnType =
  | 'all'
  | 'theory'
  | 'vr'
  | 'march'
  | 'crowdfund'
  | 'ai'
  | 'quiz';

const TYPE_TABS: { key: LearnType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'theory', label: '理论学习' },
  { key: 'vr', label: 'VR研学' },
  { key: 'march', label: '长征闯关' },
  { key: 'crowdfund', label: '党课共创' },
  { key: 'ai', label: 'AI能力' },
  { key: 'quiz', label: '测验温习' },
];

const MODULES: {
  id: string;
  type: LearnType;
  title: string;
  desc: string;
  icon: string;
  action: string;
  route: string;
  color: string;
}[] = [
  {
    id: 'theory',
    type: 'theory',
    title: '图文 / 视频理论学习',
    desc: '党史党章、政策解读图文视频课程',
    icon: '书',
    action: '去学习',
    route: '/(member)/loop/theory',
    color: colors.primary,
  },
  {
    id: 'vr',
    type: 'vr',
    title: 'VR 红色实景研学',
    desc: '纪念馆与革命旧址沉浸漫游',
    icon: 'VR',
    action: '进入VR',
    route: '/(member)/loop/vr',
    color: '#7c3aed',
  },
  {
    id: 'march',
    type: 'march',
    title: '重走长征路 · 地图闯关',
    desc: '运动里程打卡，关卡式趣味学习',
    icon: '路',
    action: '去闯关',
    route: '/(member)/loop/march',
    color: '#b45309',
  },
  {
    id: 'crowd',
    type: 'crowdfund',
    title: '党课众筹共创',
    desc: '自制微党课投稿与优秀课投票',
    icon: '创',
    action: '去参与',
    route: '/(member)/loop/crowdfund',
    color: '#be123c',
  },
  {
    id: 'ai',
    type: 'ai',
    title: 'AI 学习助手',
    desc: '党建问答、文档解析、心得辅助',
    icon: '智',
    action: '去提问',
    route: '/(member)/assistant',
    color: '#2563eb',
  },
  {
    id: 'report',
    type: 'ai',
    title: 'AI 综合研判报告',
    desc: '学习画像、思想动态与成长复盘',
    icon: '报',
    action: '看报告',
    route: '/(member)/loop/report',
    color: '#0891b2',
  },
  {
    id: 'quiz',
    type: 'quiz',
    title: '线上答题测验',
    desc: '自主学习后知识点专项题库作答',
    icon: '测',
    action: '去测验',
    route: '/(member)/loop/quiz',
    color: colors.primary,
  },
  {
    id: 'review',
    type: 'quiz',
    title: '错题闯关温习',
    desc: '针对错题反复练习直至达标',
    icon: '闯',
    action: '去闯关',
    route: '/(member)/loop/review',
    color: colors.gold,
  },
];

export default function MultiLearnScreen() {
  const router = useRouter();
  const [type, setType] = useState<LearnType>('all');

  const list = useMemo(
    () =>
      type === 'all' ? MODULES : MODULES.filter((m) => m.type === type),
    [type],
  );

  return (
    <View style={styles.root}>
      <Text style={styles.hint}>
        按学习类型筛选渠道。完成任一路径后可进入统一测验。
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cats}
      >
        {TYPE_TABS.map((t) => (
          <Pressable
            key={t.key}
            style={[styles.cat, type === t.key && styles.catOn]}
            onPress={() => setType(t.key)}
          >
            <Text style={[styles.catText, type === t.key && styles.catTextOn]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {list.map((m) => (
          <View key={m.id} style={styles.card}>
            <View style={[styles.icon, { backgroundColor: `${m.color}22` }]}>
              <Text style={[styles.iconText, { color: m.color }]}>{m.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{m.title}</Text>
              <Text style={styles.desc}>{m.desc}</Text>
            </View>
            <Pressable
              style={[styles.btn, { backgroundColor: m.color }]}
              onPress={() => router.push(m.route as never)}
            >
              <Text style={styles.btnText}>{m.action}</Text>
            </Pressable>
          </View>
        ))}
        {list.length === 0 ? (
          <Text style={styles.empty}>该类型暂无学习入口</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  cats: { paddingHorizontal: 12, paddingVertical: 12, gap: 8 },
  cat: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  catOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  catText: { color: colors.muted, fontWeight: '600', fontSize: 12 },
  catTextOn: { color: '#fff' },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontWeight: '800', fontSize: 16 },
  title: { fontWeight: '800', color: colors.text, fontSize: 15 },
  desc: { color: colors.muted, fontSize: 12, marginTop: 4, lineHeight: 17 },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 24 },
});
