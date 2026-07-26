/**
 * 环形进度（本周学习进度）
 * 简易 CSS 圆环，带动画感的百分比展示
 */
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/src/theme';

export function RingProgress({
  progress,
  size = 56,
  label,
}: {
  progress: number;
  size?: number;
  label?: string;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const pct = Math.max(0, Math.min(1, progress));

  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [anim, pct]);

  return (
    <View style={{ width: size, alignItems: 'center' }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 5,
          borderColor: colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: size / 2,
              borderWidth: 5,
              borderColor: 'transparent',
              borderTopColor: colors.primary,
              borderRightColor: pct > 0.25 ? colors.primary : 'transparent',
              borderBottomColor: pct > 0.5 ? colors.primary : 'transparent',
              borderLeftColor: pct > 0.75 ? colors.primary : 'transparent',
              transform: [{ rotate: '-45deg' }],
            },
          ]}
        />
        <Text style={styles.pct}>{Math.round(pct * 100)}%</Text>
      </View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pct: { fontSize: 11, fontWeight: '700', color: colors.primary },
  label: { marginTop: 4, fontSize: 10, color: colors.muted },
});
