import { Tabs } from 'expo-router';
import { StyleSheet, Text, View, type ColorValue } from 'react-native';
import { colors } from '@/src/theme';

function TabLabel({ label, color }: { label: string; color: ColorValue }) {
  return <Text style={{ color, fontSize: 10, fontWeight: '600' }}>{label}</Text>;
}

function TabIcon({
  label,
  color,
  center,
}: {
  label: string;
  color: ColorValue;
  center?: boolean;
}) {
  if (center) {
    return (
      <View style={styles.centerWrap}>
        <View style={styles.centerBtn}>
          <Text style={styles.centerText}>AI</Text>
        </View>
      </View>
    );
  }
  return (
    <Text style={{ color, fontSize: 16, fontWeight: '700' }}>{label}</Text>
  );
}

/**
 * 设计稿底部导航：首页 · 学习 · AI助手(突出) · 发现 · 我的
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#9ca3af',
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { color: colors.text, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 62,
          paddingBottom: 6,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: '首页',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabIcon label="首" color={color} />,
          tabBarLabel: ({ color }) => <TabLabel label="首页" color={color} />,
        }}
      />
      <Tabs.Screen
        name="study"
        options={{
          title: '学习',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabIcon label="学" color={color} />,
          tabBarLabel: ({ color }) => <TabLabel label="学习" color={color} />,
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: 'AI 助手',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <TabIcon label="AI" color={color} center />
          ),
          tabBarLabel: ({ color }) => <TabLabel label="AI助手" color={color} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: '发现',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabIcon label="发" color={color} />,
          tabBarLabel: ({ color }) => <TabLabel label="发现" color={color} />,
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: '我的',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabIcon label="我" color={color} />,
          tabBarLabel: ({ color }) => <TabLabel label="我的" color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerWrap: {
    top: -12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.gold,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  centerText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
