// Navegação por abas na parte inferior: Resumo, Transações e Orçamentos.

import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router/js-tabs';

import type { IconName } from '@/constants/categories';
import { colors } from '@/constants/theme';

/** Ícone da aba: versão preenchida quando a aba está ativa, contorno quando não está. */
function TabIcon({ focused, size, icon, iconOutline }: {
  focused: boolean;
  size: number;
  icon: IconName;
  iconOutline: IconName;
}) {
  return (
    <Ionicons
      name={focused ? icon : iconOutline}
      size={size}
      color={focused ? colors.primary : colors.textMuted}
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Resumo',
          headerTitle: 'Meu Bolso',
          tabBarIcon: ({ focused, size }) => (
            <TabIcon focused={focused} size={size} icon="pie-chart" iconOutline="pie-chart-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="transacoes"
        options={{
          title: 'Transações',
          tabBarIcon: ({ focused, size }) => (
            <TabIcon focused={focused} size={size} icon="list" iconOutline="list-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="orcamentos"
        options={{
          title: 'Orçamentos',
          tabBarIcon: ({ focused, size }) => (
            <TabIcon focused={focused} size={size} icon="wallet" iconOutline="wallet-outline" />
          ),
        }}
      />
    </Tabs>
  );
}
