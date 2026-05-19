import { COLORS, Colors } from "@/constants/theme";
import { Tabs } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import React from "react";
import { Text, View } from "react-native";
import { useColorScheme } from "@/hooks/use-color-scheme";

function TabIcon({
  icon,
  label,
  focused,
}: {
  icon: string;
  label: string;
  focused: boolean;
}) {
  return (
    <View style={{ alignItems: "center", gap: 4, minHeight: 48, justifyContent: "center" }}>
      <IconSymbol
        name={icon as any}
        size={24}
        color={focused ? COLORS.primary : COLORS.gray400}
      />
      <Text
        style={{
          fontSize: 10,
          fontWeight: focused ? "700" : "500",
          width: 68,
          textAlign: "center",
          color: focused ? COLORS.primary : COLORS.gray400,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const scheme = useColorScheme() ?? "light";
  const colors = Colors[scheme];
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 72,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: COLORS.primary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="house" label="Accueil" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="historique"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="list.bullet" label="Opérations" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="rapports"
        options={{
          href: "/stock",
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="package" label="Stock" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="parametres"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="person" label="Profil" focused={focused} />
          ),
        }}
      />
      
    </Tabs>
    
  );
}
