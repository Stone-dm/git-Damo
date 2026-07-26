/**
 * 【流程图：错题闯关温习，直至知识点达标】
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLearningLocalState } from '@/src/hooks/useLearningLocalState';
import { colors } from '@/src/theme';

export default function ReviewScreen() {
  const router = useRouter();
  const { state, finishQuiz } = useLearningLocalState();
  const [left, setLeft] = useState(Math.max(1, state.wrongCount || 3));
  const [passed, setPassed] = useState(false);

  async function brush() {
    const next = Math.max(0, left - 1);
    setLeft(next);
    if (next === 0) {
      setPassed(true);
      await finishQuiz(state.lastQuizScore ?? 85, 0);
    }
  }

  return (
    <View style={styles.page}>
      <Text style={styles.hint}>
        流程图 · 测验结束后进入错题闯关，反复练习直至达标
      </Text>
      {passed ? (
        <>
          <Text style={styles.title}>知识点已达标</Text>
          <Text style={styles.body}>错题清零，可返回首页查看 AI 画像与推荐。</Text>
          <Pressable
            style={styles.btn}
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace('/(member)/home' as never);
            }}
          >
            <Text style={styles.btnText}>返回上一页</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.title}>错题闯关</Text>
          <Text style={styles.body}>剩余待巩固：{left} 题</Text>
          <View style={styles.card}>
            <Text style={styles.q}>模拟错题：党员义务相关表述判断</Text>
            <Pressable style={styles.btn} onPress={() => void brush()}>
              <Text style={styles.btnText}>答对，消除 1 题</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  hint: { color: colors.muted, marginBottom: 12, lineHeight: 20 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  body: { color: colors.muted, marginTop: 8, marginBottom: 16, lineHeight: 20 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  q: { color: colors.text, marginBottom: 14, lineHeight: 22 },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700' },
});
