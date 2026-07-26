/**
 * 首页 — 对齐设计稿：红头搜索、用户卡、五入口、横幅、学习任务
 */
import { useRouter } from 'expo-router';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/src/auth/AuthContext';
import { useLearningLocalState } from '@/src/hooks/useLearningLocalState';
import { colors } from '@/src/theme';

const HERO_BG = require('../../../assets/images/home-hero.png');

const QUICK = [
  { key: 'multi', title: '多元自主学习', icon: '学', route: '/(member)/multi' },
  { key: 'ai', title: 'AI学习助手', icon: 'AI', route: '/(member)/assistant' },
  { key: 'vr', title: 'VR红色实景', icon: 'VR', route: '/(member)/loop/vr' },
  { key: 'march', title: '重走长征路', icon: '路', route: '/(member)/loop/march' },
  { key: 'crowd', title: '党课众筹', icon: '创', route: '/(member)/loop/crowdfund' },
] as const;

const TASKS = [
  { id: '1', title: '学习党的二十大精神专题', status: 'done' as const },
  { id: '2', title: '观看党史纪录片《长征》', status: 'doing' as const },
  { id: '3', title: '完成党章总纲随堂测验', status: 'todo' as const },
  { id: '4', title: '提交本周学习心得', status: 'todo' as const },
  { id: '5', title: '参与支部微党课投票', status: 'done' as const },
];

const STATUS_MAP = {
  done: { label: '已完成', color: '#16a34a', bg: '#dcfce7' },
  doing: { label: '进行中', color: colors.primary, bg: colors.primarySoft },
  todo: { label: '待开始', color: colors.muted, bg: '#f3f4f6' },
};

export default function HomeScreen() {
  const { user } = useAuth();
  const { state } = useLearningLocalState();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const name = user?.name ?? '张晓明';
  const doneCount = TASKS.filter((t) => t.status === 'done').length;
  const progress = doneCount / TASKS.length;

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 28 + insets.bottom }}
      >
        {/* 红色顶区 + 搜索 */}
        <ImageBackground
          source={HERO_BG}
          style={[styles.hero, { paddingTop: insets.top + 8 }]}
          resizeMode="cover"
        >
          <View style={styles.brandBlock}>
            <Text style={styles.brandTitle}>党校党建学习平台</Text>
            <Text style={styles.brandSlogan}>学思想 · 强党性 · 重实践 · 建新功</Text>
          </View>

          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>⌕</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="搜索学习内容"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View style={styles.bellBtn}>
              <Text style={styles.bellText}>🔔</Text>
            </View>
          </View>

          {/* 用户信息卡 */}
          <View style={styles.userCard}>
            <View style={styles.userTop}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{name.slice(0, 1)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>{name}</Text>
                <Text style={styles.userRole}>党员</Text>
              </View>
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsBadgeText}>积分 {state.points}</Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statVal}>45</Text>
                <Text style={styles.statLabel}>今日学习(分)</Text>
              </View>
              <View style={styles.statDiv} />
              <View style={styles.statItem}>
                <Text style={styles.statVal}>7</Text>
                <Text style={styles.statLabel}>连续打卡(天)</Text>
              </View>
              <View style={styles.statDiv} />
              <View style={styles.statItem}>
                <Text style={styles.statVal}>{state.points}</Text>
                <Text style={styles.statLabel}>累计积分</Text>
              </View>
            </View>
          </View>
        </ImageBackground>

        {/* 五入口 */}
        <View style={styles.quickRow}>
          {QUICK.map((q) => (
            <Pressable
              key={q.key}
              style={styles.quickItem}
              onPress={() => router.push(q.route as never)}
            >
              <View style={styles.quickIcon}>
                <Text style={styles.quickIconText}>{q.icon}</Text>
              </View>
              <Text style={styles.quickTitle}>{q.title}</Text>
            </Pressable>
          ))}
        </View>

        {/* 宣传横幅 */}
        <Pressable
          style={styles.banner}
          onPress={() => router.push('/(member)/multi' as never)}
        >
          <LinearGradient
            colors={['#b91c1c', '#7f1d1d']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bannerInner}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerSlogan}>不忘初心 牢记使命</Text>
              <Text style={styles.bannerSub}>开启本周专题学习之旅</Text>
              <View style={styles.bannerBtn}>
                <Text style={styles.bannerBtnText}>开始学习 ›</Text>
              </View>
            </View>
            <Text style={styles.bannerArt}>长城</Text>
          </LinearGradient>
        </Pressable>

        {/* 学习任务 */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>学习任务</Text>
            <Text style={styles.sectionExtra}>本周任务</Text>
          </View>
          <View style={styles.progressCard}>
            <View style={styles.progressHead}>
              <Text style={styles.progressLabel}>本周完成进度</Text>
              <Text style={styles.progressPct}>
                {Math.round(progress * 100)}%（{doneCount}/{TASKS.length}）
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.round(progress * 100)}%` },
                ]}
              />
            </View>
          </View>
          {TASKS.map((t) => {
            const s = STATUS_MAP[t.status];
            return (
              <Pressable
                key={t.id}
                style={styles.taskCard}
                onPress={() => router.push('/(member)/study' as never)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.taskTitle}>{t.title}</Text>
                </View>
                <View style={[styles.taskBadge, { backgroundColor: s.bg }]}>
                  <Text style={[styles.taskBadgeText, { color: s.color }]}>
                    {s.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hero: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  brandBlock: {
    marginBottom: 12,
    paddingRight: 100,
  },
  brandTitle: {
    color: colors.gold,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  brandSlogan: {
    color: '#fff',
    fontSize: 12,
    marginTop: 6,
    letterSpacing: 1,
    opacity: 0.95,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 22,
    paddingHorizontal: 14,
    height: 40,
  },
  searchIcon: { color: '#9ca3af', fontSize: 16, marginRight: 6 },
  searchInput: { flex: 1, color: colors.text, fontSize: 14, padding: 0 },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellText: { fontSize: 16 },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  userTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.gold,
  },
  avatarText: { color: colors.primary, fontWeight: '800', fontSize: 18 },
  userName: { fontSize: 17, fontWeight: '700', color: colors.text },
  userRole: { color: colors.muted, fontSize: 12, marginTop: 2 },
  pointsBadge: {
    backgroundColor: colors.gold,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  pointsBadgeText: { color: '#7a5a00', fontWeight: '800', fontSize: 12 },
  statsRow: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '800', color: colors.primary },
  statLabel: { fontSize: 11, color: colors.muted, marginTop: 2 },
  statDiv: { width: 1, backgroundColor: colors.border },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: 16,
  },
  quickItem: { width: '19%', alignItems: 'center' },
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f5c6cb',
    marginBottom: 6,
  },
  quickIconText: { color: colors.primary, fontWeight: '800', fontSize: 13 },
  quickTitle: {
    fontSize: 10,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 14,
    fontWeight: '600',
  },
  banner: { marginHorizontal: 16, marginTop: 16, borderRadius: 16, overflow: 'hidden' },
  bannerInner: {
    minHeight: 110,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerSlogan: { color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: 1 },
  bannerSub: { color: '#fecaca', marginTop: 6, fontSize: 12 },
  bannerBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  bannerBtnText: { color: '#7a5a00', fontWeight: '800', fontSize: 12 },
  bannerArt: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 28,
    fontWeight: '800',
    marginLeft: 8,
  },
  section: { paddingHorizontal: 16, marginTop: 18 },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  sectionExtra: { fontSize: 12, color: colors.muted },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: { color: colors.text, fontWeight: '600', fontSize: 13 },
  progressPct: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primarySoft,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.primary },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  taskTitle: { color: colors.text, fontWeight: '600', fontSize: 14 },
  taskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  taskBadgeText: { fontSize: 11, fontWeight: '700' },
});
