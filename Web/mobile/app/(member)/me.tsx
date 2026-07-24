import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getApiBaseUrl } from '@/src/api/client';
import { useAuth } from '@/src/auth/AuthContext';
import { colors } from '@/src/theme';

const ROLE_LABEL: Record<string, string> = {
  ADMIN: '系统管理员',
  SECRETARY: '支部书记',
  MEMBER: '党员',
};

export default function MeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const isManager = user.role === 'ADMIN' || user.role === 'SECRETARY';

  async function onLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <View style={styles.page}>
      <View style={styles.card}>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.meta}>用户名：{user.username}</Text>
        <Text style={styles.meta}>
          角色：{ROLE_LABEL[user.role] ?? user.role}
        </Text>
        <Text style={styles.meta}>
          支部 ID：{user.branchId ?? '无（全局）'}
        </Text>
        <Text style={styles.meta}>API：{getApiBaseUrl()}</Text>
      </View>

      {isManager ? (
        <View style={styles.tip}>
          <Text style={styles.tipTitle}>管理功能请使用 Web 端</Text>
          <Text style={styles.tipBody}>
            管理员 / 书记的用户管理、支部管理、知识库等功能请在 Web
            管理端操作。移动端可使用「助手」等党员主路径能力。
          </Text>
        </View>
      ) : (
        <View style={styles.tip}>
          <Text style={styles.tipBody}>
            可在「学习 / 推荐 / 助手」完成党员主路径；考试等能力后续版本开放。
          </Text>
        </View>
      )}

      <Pressable style={styles.button} onPress={onLogout}>
        <Text style={styles.buttonText}>退出登录</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg, padding: 16, gap: 12 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  meta: { color: colors.muted, marginBottom: 6, lineHeight: 20 },
  tip: {
    backgroundColor: '#fff7ed',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  tipTitle: {
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  tipBody: { color: colors.muted, lineHeight: 20 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: colors.primaryText, fontWeight: '600', fontSize: 16 },
});
