/** 【流程图：依据报告优化下一阶段学习计划 → 闭环】 */
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MOCK_NEXT_PLAN } from '@/src/mock/learningLoop';
import { colors } from '@/src/theme';

export default function PlanScreen() {
  const router = useRouter();
  return (
    <View style={styles.page}>
      <Text style={styles.hint}>
        流程图 · 根据成长报告智能优化下一阶段定制计划，形成完整闭环
      </Text>
      {MOCK_NEXT_PLAN.map((p) => (
        <View key={p.id} style={styles.card}>
          <Text style={styles.priority}>{p.priority}优先级</Text>
          <Text style={styles.title}>{p.title}</Text>
        </View>
      ))}
      <Pressable
        style={styles.btn}
        onPress={() => {
          if (router.canGoBack()) router.back();
          else router.replace('/(member)/home' as never);
        }}
      >
        <Text style={styles.btnText}>返回上一页</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  hint: { color: colors.muted, marginBottom: 12, lineHeight: 20 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  priority: { color: colors.gold, fontWeight: '700', fontSize: 12 },
  title: { color: colors.text, fontWeight: '700', marginTop: 4 },
  btn: {
    marginTop: 12,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700' },
});
