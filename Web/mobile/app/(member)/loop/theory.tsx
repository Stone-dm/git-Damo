/**
 * 【流程图：图文/视频理论学习】
 * 学完后可跳转统一测验
 */
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLearningLocalState } from '@/src/hooks/useLearningLocalState';
import { colors } from '@/src/theme';

const COURSES = [
  { id: 'c1', title: '党史专题：遵义会议的历史意义', minutes: 18 },
  { id: 'c2', title: '党章精读：总纲要点图解', minutes: 12 },
  { id: 'c3', title: '政策解读：新时代党的建设总要求', minutes: 22 },
];

export default function TheoryScreen() {
  const router = useRouter();
  const { markChannelDone } = useLearningLocalState();

  async function completeAndQuiz() {
    await markChannelDone('theory');
    router.push('/(member)/loop/quiz' as never);
  }

  return (
    <View style={styles.page}>
      <Text style={styles.hint}>
        对应流程图节点：图文 / 视频理论学习。完成学习后进入「线上答题测验」。
      </Text>
      {COURSES.map((c) => (
        <View key={c.id} style={styles.card}>
          <Text style={styles.title}>{c.title}</Text>
          <Text style={styles.meta}>约 {c.minutes} 分钟 · 模拟课程</Text>
        </View>
      ))}
      <Pressable style={styles.btn} onPress={() => void completeAndQuiz()}>
        <Text style={styles.btnText}>完成本渠道学习，去测验</Text>
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
    marginBottom: 10,
  },
  title: { fontWeight: '700', color: colors.text },
  meta: { color: colors.muted, marginTop: 6, fontSize: 12 },
  btn: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700' },
});
