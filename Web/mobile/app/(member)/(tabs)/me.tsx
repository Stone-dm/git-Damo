/**
 * 我的 — 设计稿风格个人中心
 */
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/src/auth/AuthContext';
import { useLearningLocalState } from '@/src/hooks/useLearningLocalState';
import { colors } from '@/src/theme';

export default function MeScreen() {
  const { user, logout } = useAuth();
  const { state } = useLearningLocalState();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  if (!user) return null;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.row}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.name.slice(0, 1)}</Text>
          </View>
          <View>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.role}>普通党员</Text>
          </View>
        </View>
        <View style={styles.points}>
          <Text style={styles.pointsText}>积分 {state.points}</Text>
        </View>
      </LinearGradient>

      <View style={styles.menu}>
        {[
          { t: '个人综合成长报告', r: '/(member)/loop/report' },
          { t: '下一阶段学习计划', r: '/(member)/loop/plan' },
          { t: 'AI 学习画像', r: '/(member)/loop/portrait' },
          { t: '错题闯关温习', r: '/(member)/loop/review' },
        ].map((item) => (
          <Pressable
            key={item.t}
            style={styles.item}
            onPress={() => router.push(item.r as never)}
          >
            <Text style={styles.itemText}>{item.t}</Text>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={styles.logout}
        onPress={async () => {
          await logout();
          router.replace('/login');
        }}
      >
        <Text style={styles.logoutText}>退出登录</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.gold,
  },
  avatarText: { color: colors.primary, fontWeight: '800', fontSize: 20 },
  name: { color: '#fff', fontSize: 20, fontWeight: '800' },
  role: { color: '#fecaca', marginTop: 4 },
  points: {
    backgroundColor: colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  pointsText: { color: '#7a5a00', fontWeight: '800' },
  menu: { margin: 16, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden' },
  item: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemText: { color: colors.text, fontWeight: '600', fontSize: 15 },
  arrow: { color: colors.muted, fontSize: 18 },
  logout: {
    marginHorizontal: 16,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
