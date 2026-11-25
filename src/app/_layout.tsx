// Layout raiz: abre o banco SQLite (rodando as migrações na primeira vez),
// disponibiliza o mês selecionado para todas as telas e define a pilha
// de navegação (abas + telas de formulário).

import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';

import { colors } from '@/constants/theme';
import { MonthProvider } from '@/context/MonthContext';
import { DATABASE_NAME, migrateDbIfNeeded } from '@/database/schema';

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDbIfNeeded}>
      <MonthProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.primary,
            headerTitleStyle: { color: colors.text, fontWeight: '700' },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.background },
            headerBackTitle: 'Voltar',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="transacao" options={{ title: 'Transação' }} />
          <Stack.Screen name="orcamento/[categoria]" options={{ title: 'Orçamento' }} />
        </Stack>
      </MonthProvider>
    </SQLiteProvider>
  );
}
