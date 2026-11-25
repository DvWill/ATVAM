// Tela "Resumo": saldo do mês, alertas de orçamento, despesas por
// categoria e os últimos lançamentos.

import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { CategoryIcon } from '@/components/CategoryIcon';
import { EmptyState } from '@/components/EmptyState';
import { Fab } from '@/components/Fab';
import { MonthSelector } from '@/components/MonthSelector';
import { ProgressBar } from '@/components/ProgressBar';
import { TransactionItem } from '@/components/TransactionItem';
import { getCategory, type Category } from '@/constants/categories';
import { colors, radius, spacing } from '@/constants/theme';
import { useSelectedMonth } from '@/context/MonthContext';
import { listBudgets } from '@/database/budgets';
import { getExpensesByCategory, getMonthSummary, listTransactions } from '@/database/transactions';
import { useFocusData } from '@/hooks/useFocusData';
import { formatMoney } from '@/utils/money';

interface BudgetAlert {
  category: Category;
  progress: number;
  overCents: number;
}

export default function DashboardScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { month } = useSelectedMonth();

  const load = useCallback(async () => {
    const [summary, byCategory, recent, budgets] = await Promise.all([
      getMonthSummary(db, month),
      getExpensesByCategory(db, month),
      listTransactions(db, month, { limit: 5 }),
      listBudgets(db),
    ]);

    // Alerta quando o gasto atinge 80% ou mais do limite definido.
    const alerts: BudgetAlert[] = budgets
      .map((budget) => {
        const spent = byCategory.find((c) => c.category === budget.category)?.totalCents ?? 0;
        return {
          category: getCategory(budget.category),
          progress: spent / budget.limitCents,
          overCents: spent - budget.limitCents,
        };
      })
      .filter((a) => a.progress >= 0.8)
      .sort((a, b) => b.progress - a.progress);

    return { summary, byCategory, recent, alerts };
  }, [db, month]);

  const { data, error } = useFocusData(load);

  if (error) {
    return <EmptyState icon="alert-circle" title="Erro ao carregar os dados" message={error.message} />;
  }
  if (!data) {
    return <ActivityIndicator style={styles.loading} color={colors.primary} />;
  }

  const { summary, byCategory, recent, alerts } = data;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <MonthSelector />

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo do mês</Text>
          <Text style={styles.balanceValue}>{formatMoney(summary.balanceCents)}</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balancePill}>
              <Ionicons name="arrow-up-circle" size={22} color="#BBF7D0" />
              <View>
                <Text style={styles.pillLabel}>Receitas</Text>
                <Text style={styles.pillValue}>{formatMoney(summary.incomeCents)}</Text>
              </View>
            </View>
            <View style={styles.balancePill}>
              <Ionicons name="arrow-down-circle" size={22} color="#FECACA" />
              <View>
                <Text style={styles.pillLabel}>Despesas</Text>
                <Text style={styles.pillValue}>{formatMoney(summary.expenseCents)}</Text>
              </View>
            </View>
          </View>
          <Text style={styles.accumulated}>
            Saldo acumulado até este mês: {formatMoney(summary.accumulatedCents)}
          </Text>
        </View>

        {alerts.length > 0 && (
          <Card title="Atenção aos orçamentos">
            <View style={styles.list}>
              {alerts.map((alert) => {
                const exceeded = alert.progress > 1;
                return (
                  <View key={alert.category.id} style={styles.alertRow}>
                    <Ionicons
                      name="warning"
                      size={18}
                      color={exceeded ? colors.expense : colors.warning}
                    />
                    <Text style={styles.alertText}>
                      <Text style={styles.bold}>{alert.category.name}: </Text>
                      {exceeded
                        ? `limite excedido em ${formatMoney(alert.overCents)}`
                        : `${Math.round(alert.progress * 100)}% do limite usado`}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Card>
        )}

        <Card title="Despesas por categoria">
          {byCategory.length === 0 ? (
            <EmptyState icon="pie-chart-outline" title="Nenhuma despesa neste mês" />
          ) : (
            <View style={styles.list}>
              {byCategory.map((item) => {
                const category = getCategory(item.category);
                const share = summary.expenseCents > 0 ? item.totalCents / summary.expenseCents : 0;
                return (
                  <View key={item.category} style={styles.categoryRow}>
                    <CategoryIcon category={category} size={32} />
                    <View style={styles.categoryInfo}>
                      <View style={styles.categoryHeader}>
                        <Text style={styles.categoryName}>{category.name}</Text>
                        <Text style={styles.categoryValue}>
                          {formatMoney(item.totalCents)}{' '}
                          <Text style={styles.muted}>({Math.round(share * 100)}%)</Text>
                        </Text>
                      </View>
                      <ProgressBar progress={share} color={category.color} height={6} />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </Card>

        <Card
          title="Últimas transações"
          right={
            recent.length > 0 ? (
              <Link href="/transacoes" style={styles.link}>
                Ver todas
              </Link>
            ) : undefined
          }
        >
          {recent.length === 0 ? (
            <EmptyState
              icon="document-text-outline"
              title="Nenhum lançamento neste mês"
              message="Toque no botão + para registrar uma receita ou despesa."
            />
          ) : (
            recent.map((t) => (
              <TransactionItem
                key={t.id}
                transaction={t}
                showDate
                onPress={() => router.push({ pathname: '/transacao', params: { id: String(t.id) } })}
              />
            ))
          )}
        </Card>
      </ScrollView>

      <Fab label="Nova transação" onPress={() => router.push('/transacao')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: 100, // espaço para o botão flutuante
  },
  balanceCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  balanceLabel: {
    color: colors.primaryLight,
    fontSize: 14,
  },
  balanceValue: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '800',
  },
  balanceRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  balancePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  pillLabel: {
    color: colors.primaryLight,
    fontSize: 12,
  },
  pillValue: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  accumulated: {
    color: colors.primaryLight,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  list: {
    gap: spacing.md,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  bold: {
    fontWeight: '700',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  categoryInfo: {
    flex: 1,
    gap: 6,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  categoryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  muted: {
    color: colors.textMuted,
    fontWeight: '400',
  },
  link: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});
