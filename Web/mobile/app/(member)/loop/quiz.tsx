/**
 * 【流程图：完成线上答题测验】
 * 专项题库模拟作答 → 进入错题闯关
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLearningLocalState } from '@/src/hooks/useLearningLocalState';
import { colors } from '@/src/theme';

const QUESTIONS = [
  {
    q: '党的根本组织原则是？',
    options: ['民主集中制', '少数服从多数', '集体领导', '个人负责'],
    answer: 0,
  },
  {
    q: '中国共产党的最高理想和最终目标是？',
    options: ['共同富裕', '实现共产主义', '民族复兴', '现代化强国'],
    answer: 1,
  },
  {
    q: '党员必须履行的义务不包括？',
    options: ['学习党的理论', '参加党的组织生活', '缴纳党费', '从事营利活动优先'],
    answer: 3,
  },
];

export default function QuizScreen() {
  const router = useRouter();
  const { finishQuiz } = useLearningLocalState();
  const [index, setIndex] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [done, setDone] = useState(false);
  const [score, setScore] = useState(0);

  const cur = QUESTIONS[index];

  async function choose(i: number) {
    const isWrong = i !== cur.answer;
    const nextWrong = wrong + (isWrong ? 1 : 0);
    if (index < QUESTIONS.length - 1) {
      setWrong(nextWrong);
      setIndex(index + 1);
      return;
    }
    const correct = QUESTIONS.length - nextWrong;
    const s = Math.round((correct / QUESTIONS.length) * 100);
    setWrong(nextWrong);
    setScore(s);
    setDone(true);
    await finishQuiz(s, nextWrong);
  }

  if (done) {
    return (
      <View style={styles.page}>
        <Text style={styles.title}>测验完成</Text>
        <Text style={styles.body}>得分 {score} 分 · 错题 {wrong} 道</Text>
        <Pressable
          style={styles.btn}
          onPress={() => router.push('/(member)/loop/review' as never)}
        >
          <Text style={styles.btnText}>进入错题闯关温习</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <Text style={styles.hint}>
        流程图 · 任意自主学习完成后进入本模块（知识点专项题库）
      </Text>
      <Text style={styles.progress}>
        第 {index + 1} / {QUESTIONS.length} 题
      </Text>
      <Text style={styles.title}>{cur.q}</Text>
      {cur.options.map((opt, i) => (
        <Pressable key={opt} style={styles.opt} onPress={() => void choose(i)}>
          <Text style={styles.optText}>{opt}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  hint: { color: colors.muted, marginBottom: 12, lineHeight: 20 },
  progress: { color: colors.gold, fontWeight: '700', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 },
  body: { color: colors.muted, marginBottom: 16, fontSize: 15 },
  opt: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  optText: { color: colors.text, fontSize: 15 },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700' },
});
