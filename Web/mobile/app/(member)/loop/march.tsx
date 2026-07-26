/** 【流程图：重走长征路 · 运动地图闯关】 */
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLearningLocalState } from '@/src/hooks/useLearningLocalState';
import { colors } from '@/src/theme';

const GATES = [
  { name: '瑞金出发', km: 2.0, done: true },
  { name: '遵义转折', km: 3.5, done: true },
  { name: '飞夺泸定', km: 2.8, done: false },
];

export default function MarchScreen() {
  const router = useRouter();
  const { markChannelDone } = useLearningLocalState();

  return (
    <View style={styles.page}>
      <Text style={styles.hint}>互动地图打卡、里程闯关（本地模拟关卡）。</Text>
      {GATES.map((g) => (
        <View key={g.name} style={styles.card}>
          <Text style={styles.title}>{g.name}</Text>
          <Text style={styles.meta}>
            目标 {g.km} km · {g.done ? '已点亮' : '待闯关'}
          </Text>
        </View>
      ))}
      <Pressable
        style={styles.btn}
        onPress={async () => {
          await markChannelDone('march');
          router.push('/(member)/loop/quiz' as never);
        }}
      >
        <Text style={styles.btnText}>完成本关学习，去测验</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  hint: { color: colors.muted, marginBottom: 12 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  title: { fontWeight: '700', color: colors.text },
  meta: { color: colors.muted, marginTop: 4, fontSize: 12 },
  btn: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700' },
});
