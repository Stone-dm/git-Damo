/**
 * 【流程图节点：接收学习任务 / 专题党课推送】
 * 顶部红金渐变 Banner + 党员信息 + 待接收任务通知栏
 */
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RingProgress } from '@/components/home/RingProgress';
import type { MockAnnouncement } from '@/src/mock/learningLoop';
import { colors } from '@/src/theme';

export function HomeHeader({
  name,
  branchName,
  points,
  weekProgress,
  announcements,
  onCheckIn,
  checkedIn,
  topInset,
}: {
  name: string;
  branchName: string;
  points: number;
  weekProgress: number;
  announcements: MockAnnouncement[];
  onCheckIn: () => void;
  checkedIn: boolean;
  topInset: number;
}) {
  const notice = announcements[0];

  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.banner, { paddingTop: topInset + 10 }]}
    >
      {/* 鎏金点缀条 */}
      <View style={styles.goldLine} />

      <View style={styles.brandRow}>
        <View style={styles.emblem}>
          <Text style={styles.emblemText}>党</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.brandTitle}>党员个性化学习中心</Text>
          <Text style={styles.branch}>当前支部 · {branchName}</Text>
        </View>
      </View>

      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name.slice(0, 1)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.points}>
            学习积分 <Text style={styles.pointsNum}>{points}</Text>
          </Text>
        </View>
        <RingProgress progress={weekProgress} label="本周进度" />
        <Pressable
          style={[styles.checkBtn, checkedIn && styles.checkDone]}
          onPress={onCheckIn}
        >
          <Text style={styles.checkText}>{checkedIn ? '已打卡' : '打卡'}</Text>
        </Pressable>
      </View>

      {/* 待接收专题任务通知栏 */}
      {notice ? (
        <View style={styles.notice}>
          <Text style={styles.noticeTag}>专题推送</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.noticeTitle} numberOfLines={1}>
              {notice.title}
            </Text>
            <Text style={styles.noticeBody} numberOfLines={1}>
              {notice.body}
            </Text>
          </View>
        </View>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  goldLine: {
    height: 3,
    backgroundColor: colors.gold,
    borderRadius: 2,
    marginBottom: 12,
    opacity: 0.9,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  emblem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#f3e6b0',
  },
  emblemText: { color: colors.primaryDark, fontWeight: '800', fontSize: 18 },
  brandTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  branch: { color: '#f8d7da', marginTop: 4, fontSize: 12 },
  profile: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.gold,
  },
  avatarText: { color: colors.primary, fontWeight: '700', fontSize: 16 },
  name: { fontWeight: '700', color: colors.text, fontSize: 15 },
  points: { color: colors.muted, marginTop: 2, fontSize: 12 },
  pointsNum: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  checkBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  checkDone: { backgroundColor: colors.muted },
  checkText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  notice: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.45)',
  },
  noticeTag: {
    color: colors.primaryDark,
    backgroundColor: colors.gold,
    overflow: 'hidden',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: '700',
  },
  noticeTitle: { color: '#fff', fontWeight: '700', fontSize: 12 },
  noticeBody: { color: '#f8d7da', fontSize: 11, marginTop: 2 },
});
