/**
 * VR 红色实景研学 — 对齐设计稿第三屏
 */
import { useRouter } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLearningLocalState } from '@/src/hooks/useLearningLocalState';
import { colors } from '@/src/theme';

const FEATURES = [
  { title: '全景漫游', icon: '景' },
  { title: '场景解说', icon: '解' },
  { title: '知识问答', icon: '问' },
  { title: '研学档案', icon: '档' },
];

const HOT = [
  { id: '1', title: '遵义会议会址' },
  { id: '2', title: '井冈山革命根据地' },
  { id: '3', title: '瑞金中央革命根据地' },
];

export default function VrScreen() {
  const router = useRouter();
  const { markChannelDone } = useLearningLocalState();

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>沉浸体验红色场景</Text>
        <Text style={styles.bannerSub}>传承革命精神 · VR 实景研学</Text>
        <Pressable
          style={styles.bannerBtn}
          onPress={async () => {
            await markChannelDone('vr');
            router.push('/(member)/loop/quiz' as never);
          }}
        >
          <Text style={styles.bannerBtnText}>开始探索 ›</Text>
        </Pressable>
      </View>

      <View style={styles.featRow}>
        {FEATURES.map((f) => (
          <View key={f.title} style={styles.featItem}>
            <View style={styles.featIcon}>
              <Text style={styles.featIconText}>{f.icon}</Text>
            </View>
            <Text style={styles.featTitle}>{f.title}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.section}>热门场景</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {HOT.map((h) => (
          <View key={h.id} style={styles.hotCard}>
            <View style={styles.hotImg}>
              <Text style={styles.hotImgText}>{h.title.slice(0, 2)}</Text>
              <View style={styles.vrTag}>
                <Text style={styles.vrTagText}>VR</Text>
              </View>
            </View>
            <Text style={styles.hotTitle}>{h.title}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.marchBox}>
        <Text style={styles.marchTitle}>重走长征路 · 运动地图闯关</Text>
        <View style={styles.marchStats}>
          <Text style={styles.stat}>里程 2450 km</Text>
          <Text style={styles.stat}>积分 860</Text>
          <Text style={styles.stat}>第 6 关</Text>
        </View>
        <View style={styles.path}>
          {['瑞金', '遵义', '泸定', '延安'].map((p, i) => (
            <View key={p} style={styles.pathNode}>
              <View style={[styles.dot, i < 3 && styles.dotOn]} />
              <Text style={styles.pathText}>{p}</Text>
            </View>
          ))}
        </View>
        <Pressable
          style={styles.continueBtn}
          onPress={() => router.push('/(member)/loop/march' as never)}
        >
          <Text style={styles.continueText}>继续闯关</Text>
        </Pressable>
      </View>

      <Text style={[styles.section, { marginTop: 8 }]}>学习排行榜</Text>
      <View style={styles.rankBox}>
        {['李娜 · 920', '张伟 · 880', '王芳 · 850'].map((line, i) => (
          <Text key={line} style={styles.rankLine}>
            {i + 1}. {line}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  banner: {
    margin: 16,
    borderRadius: 16,
    backgroundColor: colors.primaryDark,
    padding: 18,
    minHeight: 140,
    justifyContent: 'flex-end',
  },
  bannerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  bannerSub: { color: '#fecaca', marginTop: 6, fontSize: 12 },
  bannerBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  bannerBtnText: { color: '#7a5a00', fontWeight: '800', fontSize: 12 },
  featRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  featItem: { alignItems: 'center', width: '22%' },
  featIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  featIconText: { color: colors.primary, fontWeight: '800' },
  featTitle: { fontSize: 11, color: colors.text, fontWeight: '600' },
  section: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  hotCard: { width: 150, marginRight: 10 },
  hotImg: {
    height: 96,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotImgText: { color: colors.primary, fontWeight: '800', fontSize: 22 },
  vrTag: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: colors.primary,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  vrTagText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  hotTitle: { marginTop: 6, fontWeight: '600', color: colors.text, fontSize: 12 },
  marchBox: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  marchTitle: { fontWeight: '800', color: colors.text },
  marchStats: { flexDirection: 'row', gap: 12, marginTop: 8 },
  stat: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  path: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  pathNode: { alignItems: 'center', flex: 1 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
    marginBottom: 4,
  },
  dotOn: { backgroundColor: colors.primary },
  pathText: { fontSize: 11, color: colors.muted },
  continueBtn: {
    marginTop: 14,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  continueText: { color: '#fff', fontWeight: '800' },
  rankBox: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rankLine: { color: colors.text, lineHeight: 26, fontWeight: '600' },
});
