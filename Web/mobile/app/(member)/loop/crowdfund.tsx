/** 【流程图：党课投票、投稿自制微党课】 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLearningLocalState } from '@/src/hooks/useLearningLocalState';
import { colors } from '@/src/theme';

const LESSONS = [
  { id: 'm1', title: '微党课：一枚党徽的故事', votes: 36 },
  { id: 'm2', title: '微党课：支部里的青春力量', votes: 28 },
];

export default function CrowdfundScreen() {
  const router = useRouter();
  const { markChannelDone } = useLearningLocalState();
  const [votes, setVotes] = useState(LESSONS);

  return (
    <View style={styles.page}>
      <Text style={styles.hint}>上传原创微党课、参与优秀党课投票（模拟）。</Text>
      {votes.map((l) => (
        <View key={l.id} style={styles.card}>
          <Text style={styles.title}>{l.title}</Text>
          <View style={styles.row}>
            <Text style={styles.meta}>{l.votes} 票</Text>
            <Pressable
              style={styles.voteBtn}
              onPress={() =>
                setVotes((prev) =>
                  prev.map((x) =>
                    x.id === l.id ? { ...x, votes: x.votes + 1 } : x,
                  ),
                )
              }
            >
              <Text style={styles.voteText}>投票</Text>
            </Pressable>
          </View>
        </View>
      ))}
      <Pressable
        style={styles.btn}
        onPress={async () => {
          await markChannelDone('crowdfund');
          router.push('/(member)/loop/quiz' as never);
        }}
      >
        <Text style={styles.btnText}>完成本渠道，去测验</Text>
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  meta: { color: colors.muted },
  voteBtn: {
    backgroundColor: colors.goldSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  voteText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  btn: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700' },
});
