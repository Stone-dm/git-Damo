import { Stack } from 'expo-router';
import { HeaderBackButton } from '@/components/navigation/HeaderBackButton';
import { colors } from '@/src/theme';

/**
 * 学习闭环子路由（按钮进入）— 每页导航栏带返回
 */
export default function LoopLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { color: colors.text, fontWeight: '600' },
        headerTintColor: colors.primary,
        headerLeft: () => <HeaderBackButton />,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="theory" options={{ title: '图文/视频理论学习' }} />
      <Stack.Screen
        name="vr"
        options={{ title: 'VR 红色实景研学', headerShown: false }}
      />
      <Stack.Screen name="march" options={{ title: '重走长征路' }} />
      <Stack.Screen name="crowdfund" options={{ title: '党课众筹共创' }} />
      <Stack.Screen name="quiz" options={{ title: '线上答题测验' }} />
      <Stack.Screen name="review" options={{ title: '错题闯关温习' }} />
      <Stack.Screen name="portrait" options={{ title: 'AI 学习画像' }} />
      <Stack.Screen name="report" options={{ title: '综合成长报告' }} />
      <Stack.Screen name="plan" options={{ title: '下一阶段计划' }} />
    </Stack>
  );
}
