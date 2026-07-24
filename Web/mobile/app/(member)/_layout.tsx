import { Redirect, Tabs } from 'expo-router';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  type ColorValue,
} from 'react-native';
import { useAuth } from '@/src/auth/AuthContext';
import { colors } from '@/src/theme';

function TabLabel({ label, color }: { label: string; color: ColorValue }) {
  return <Text style={{ color, fontSize: 12 }}>{label}</Text>;
}

export default function MemberLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { color: colors.text, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="learning"
        options={{
          title: '学习',
          tabBarLabel: ({ color }) => <TabLabel label="学习" color={color} />,
        }}
      />
      <Tabs.Screen
        name="recommend"
        options={{
          title: '推荐',
          tabBarLabel: ({ color }) => <TabLabel label="推荐" color={color} />,
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: '助手',
          tabBarLabel: ({ color }) => <TabLabel label="助手" color={color} />,
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: '我的',
          tabBarLabel: ({ color }) => <TabLabel label="我的" color={color} />,
        }}
      />
    </Tabs>
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
