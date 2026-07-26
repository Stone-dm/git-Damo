import { Stack } from 'expo-router';
import { HeaderBackButton } from '@/components/navigation/HeaderBackButton';
import { colors } from '@/src/theme';

export default function TaskLayout() {
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
      <Stack.Screen name="[id]" options={{ title: '任务详情' }} />
    </Stack>
  );
}
