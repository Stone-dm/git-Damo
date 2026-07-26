/**
 * 导航栏左侧「返回」按钮（从哪来回哪去）
 */
import { Pressable, StyleSheet, Text } from 'react-native';
import { useSmartBack } from '@/src/navigation/useSmartBack';
import { colors } from '@/src/theme';

export function HeaderBackButton({ fallback }: { fallback?: string }) {
  const goBack = useSmartBack(fallback);

  return (
    <Pressable onPress={goBack} hitSlop={12} style={styles.btn}>
      <Text style={styles.text}>‹ 返回</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { paddingHorizontal: 4, paddingVertical: 4 },
  text: { color: colors.primary, fontSize: 16, fontWeight: '600' },
});
