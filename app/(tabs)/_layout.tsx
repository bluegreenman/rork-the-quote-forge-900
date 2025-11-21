import { Tabs } from "expo-router";
import { Sparkles, BookText, User, Shield, Flame, Settings, Crown } from "lucide-react-native";
import React from "react";
import { useGame } from "../../contexts/GameContext";
import { getThemeColors } from "../../constants/themes";

export default function TabLayout() {
  const { theme } = useGame();
  const colors = getThemeColors(theme);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tabIconSelected,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Forge",
          tabBarIcon: ({ color }) => <Sparkles color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="sanctum"
        options={{
          title: "Sanctum",
          tabBarIcon: ({ color }) => <Flame color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="character"
        options={{
          title: "Character",
          tabBarIcon: ({ color }) => <Shield color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="destiny"
        options={{
          title: "Destiny",
          tabBarIcon: ({ color }) => <Crown color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="ledger"
        options={{
          title: "Ledger",
          tabBarIcon: ({ color }) => <BookText color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <Settings color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
