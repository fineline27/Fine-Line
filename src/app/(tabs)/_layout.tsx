import { Tabs } from 'expo-router';

import { formatColors } from '../../content/overallFormats';
import { colors } from '../../theme/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.headerGradientStart,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'My picks' }} />
      <Tabs.Screen
        name="classic-leaderboard"
        options={{
          title: 'Classic',
          tabBarActiveTintColor: formatColors.classic,
        }}
      />
      <Tabs.Screen
        name="stakes-leaderboard"
        options={{
          title: 'Stakes',
          tabBarActiveTintColor: formatColors.stakes,
        }}
      />
      <Tabs.Screen name="leagues" options={{ title: 'Leagues' }} />
    </Tabs>
  );
}
