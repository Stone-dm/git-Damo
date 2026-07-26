import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { HeaderBackButton } from '@/components/navigation/HeaderBackButton';
import { useAuth } from '@/src/auth/AuthContext';
import { LearningLocalProvider } from '@/src/hooks/useLearningLocalState';
import { colors } from '@/src/theme';

/**
 * 党员区根布局：Stack 包裹 Tab + 二级页
 * 二级页（按钮跳转）统一显示「返回」，从哪来回哪去
 */
export default function MemberLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user || user.role !== 'MEMBER') {
    return <Redirect href="/login" />;
  }

  return (
    <LearningLocalProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.card },
          headerTitleStyle: { color: colors.text, fontWeight: '600' },
          headerTintColor: colors.primary,
          headerLeft: () => <HeaderBackButton />,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="multi" options={{ headerShown: false }} />
        <Stack.Screen name="loop" options={{ headerShown: false }} />
        <Stack.Screen name="task" options={{ headerShown: false }} />
        <Stack.Screen name="learning" options={{ headerShown: false }} />
        <Stack.Screen name="explore" options={{ title: '探索' }} />
        <Stack.Screen name="duty" options={{ title: '任务与考试' }} />
        <Stack.Screen name="notices" options={{ title: '通知' }} />
      </Stack>
    </LearningLocalProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
});
