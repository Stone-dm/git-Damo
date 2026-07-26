/**
 * 发现 Tab — 热门场景 / 排行等入口
 */
import { useRouter } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/src/theme';

const SCENES = [
  { id: '1', title: '遵义会议会址', tag: 'VR' },
  { id: '2', title: '井冈山革命根据地', tag: 'VR' },
  { id: '3', title: '延安革命纪念馆', tag: 'VR' },
];

const RANK = [
  { name: '李娜', score: 920 },
  { name: '张伟', score: 880 },
  { name: '王芳', score: 850 },
  { name: '赵强', score: 810 },
];

export default function DiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <Text style={styles.headerTitle}>发现</Text>
        <Text style={styles.headerSub}>红色场景 · 闯关动态 · 学习排行</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 + insets.bottom }}
      >
        <Text style={styles.section}>热门场景</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {SCENES.map((s) => (
            <Pressable
              key={s.id}
              style={styles.scene}
              onPress={() => router.push('/(member)/loop/vr' as never)}
            >
              <View style={styles.sceneImg}>
                <Text style={styles.sceneImgText}>{s.title.slice(0, 2)}</Text>
                <View style={styles.vrTag}>
                  <Text style={styles.vrTagText}>{s.tag}</Text>
                </View>
              </View>
              <Text style={styles.sceneTitle}>{s.title}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Pressable
          style={styles.marchCard}
          onPress={() => router.push('/(member)/loop/march' as never)}
        >
          <Text style={styles.marchTitle}>重走长征路 · 运动地图闯关</Text>
          <View style={styles.marchStats}>
            <Text style={styles.marchStat}>里程 2450km</Text>
            <Text style={styles.marchStat}>积分 860</Text>
            <Text style={styles.marchStat}>第 6 关</Text>
          </View>
          <View style={styles.marchBtn}>
            <Text style={styles.marchBtnText}>继续闯关</Text>
          </View>
        </Pressable>

        <Text style={[styles.section, { marginTop: 18 }]}>学习排行榜</Text>
        <View style={styles.rankCard}>
          {RANK.map((r, i) => (
            <View key={r.name} style={styles.rankRow}>
              <Text style={[styles.rankIdx, i < 3 && styles.rankTop]}>
                {i + 1}
              </Text>
              <Text style={styles.rankName}>{r.name}</Text>
              <Text style={styles.rankScore}>{r.score}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  headerSub: { color: '#fecaca', marginTop: 6, fontSize: 12 },
  section: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
  },
  scene: { width: 140, marginRight: 10 },
  sceneImg: {
    height: 90,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sceneImgText: { color: colors.primary, fontWeight: '800', fontSize: 22 },
  vrTag: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  vrTagText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  sceneTitle: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  marchCard: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  marchTitle: { fontWeight: '800', color: colors.text, fontSize: 15 },
  marchStats: { flexDirection: 'row', gap: 12, marginTop: 10 },
  marchStat: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  marchBtn: {
    marginTop: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  marchBtnText: { color: '#fff', fontWeight: '800' },
  rankCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rankIdx: { width: 28, fontWeight: '800', color: colors.muted },
  rankTop: { color: colors.gold },
  rankName: { flex: 1, color: colors.text, fontWeight: '600' },
  rankScore: { color: colors.primary, fontWeight: '800' },
});
