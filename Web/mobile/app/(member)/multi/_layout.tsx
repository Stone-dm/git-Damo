import { Stack } from 'expo-router';
import { HeaderBackButton } from '@/components/navigation/HeaderBackButton';
import { colors } from '@/src/theme';

/** 多元自主学习独立页（非底部「学习」Tab） */
export default function MultiLayout() {
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
      <Stack.Screen
        name="index"
        options={{ title: '多元自主学习', headerShown: false }}
      />
    </Stack>
  );
}
