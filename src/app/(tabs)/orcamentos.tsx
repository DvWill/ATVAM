// Tela "Orçamentos": mostra, para cada categoria de despesa, quanto foi
// gasto no mês e quanto resta do limite mensal definido pelo usuário.

import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { CategoryIcon } from '@/components/CategoryIcon';
import { EmptyState } from '@/components/EmptyState';
import { MonthSelector } from '@/components/MonthSelector';
import { budgetColor, ProgressBar } from '@/components/ProgressBar';
import { EXPENSE_CATEGORIES, type Category } from '@/constants/categories';
import { colors, radius, spacing } from '@/constants/theme';
import { useSelectedMonth } from '@/context/MonthContext';
import { listBudgets } from '@/database/budgets';
import { getExpensesByCategory } from '@/database/transactions';
import { useFocusData } from '@/hooks/useFocusData';
import { formatMoney } from '@/utils/money';

interface BudgetRowData {
  category: Category;
  spentCents: number;
  limitCents: number | null;
}

export default function BudgetsScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { month } = useSelectedMonth();

  const load = useCallback(async (): Promise<BudgetRowData[]> => {
    const [budgets, spending] = await Promise.all([listBudgets(db), getExpensesByCategory(db, month)]);
    return EXPENSE_CATEGORIES.map((category) => ({
      category,
      spentCents: spending.find((s) => s.category === category.id)?.totalCents ?? 0,
      limitCents: budgets.find((b) => b.category === category.id)?.limitCents ?? null,
    }));
  }, [db, month]);

  const { data, error } = useFocusData(load);

  if (error) {
    return <EmptyState icon="alert-circle" title="Erro ao carregar os dados" message={error.message} />;
  }
  if (!data) {
    return <ActivityIndicator style={styles.loading} color={colors.primary} />;
  }

  const withLimit = data.filter((row) => row.limitCents !== null);
  const totalLimit = withLimit.reduce((sum, row) => sum + (row.limitCents ?? 0), 0);
  const totalSpent = withLimit.reduce((sum, row) => sum + row.spentCents, 0);
  const totalProgress = totalLimit > 0 ? totalSpent / totalLimit : 0;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <MonthSelector />

      <Card title="Visão geral">
        {withLimit.length === 0 ? (
          <Text style={styles.muted}>
            Você ainda não definiu nenhum limite. Toque em uma categoria abaixo para começar.
          </Text>
        ) : (
          <View style={styles.overview}>
            <View style={styles.overviewRow}>
              <View>
                <Text style={styles.muted}>Gasto</Text>
                <Text style={styles.overviewValue}>{formatMoney(totalSpent)}</Text>
              </View>
              <View style={styles.alignRight}>
                <Text style={styles.muted}>Orçado</Text>
                <Text style={styles.overviewValue}>{formatMoney(totalLimit)}</Text>
              </View>
            </View>
            <ProgressBar progress={totalProgress} color={budgetColor(totalProgress)} height={10} />
            <Text style={styles.muted}>
              {Math.round(totalProgress * 100)}% do total orçado em {withLimit.length}{' '}
              {withLimit.length === 1 ? 'categoria' : 'categorias'}
            </Text>
          </View>
        )}
      </Card>

      <Text style={styles.sectionTitle}>Limites por categoria</Text>

      {data.map((row) => (
        <BudgetRow
          key={row.category.id}
          row={row}
          onPress={() =>
            router.push({ pathname: '/orcamento/[categoria]', params: { categoria: row.category.id } })
          }
        />
      ))}
    </ScrollView>
  );
}

function BudgetRow({ row, onPress }: { row: BudgetRowData; onPress: () => void }) {
  const { category, spentCents, limitCents } = row;
  const progress = limitCents ? spentCents / limitCents : 0;
  const color = budgetColor(progress);

  let status: string;
  if (limitCents === null) {
    status = 'Sem limite definido';
  } else if (spentCents > limitCents) {
    status = `Excedido em ${formatMoney(spentCents - limitCents)}`;
  } else {
    status = `Restam ${formatMoney(limitCents - spentCents)}`;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${category.name}: ${status}. Toque para editar o limite.`}
    >
      <View style={styles.rowHeader}>
        <CategoryIcon category={category} size={36} />
        <View style={styles.rowInfo}>
          <Text style={styles.rowName}>{category.name}</Text>
          <Text style={[styles.rowStatus, limitCents !== null && { color }]}>{status}</Text>
        </View>
        <View style={styles.alignRight}>
          <Text style={styles.rowValue}>{formatMoney(spentCents)}</Text>
          {limitCents !== null && <Text style={styles.muted}>de {formatMoney(limitCents)}</Text>}
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </View>
      {limitCents !== null && <ProgressBar progress={progress} color={color} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  muted: {
    fontSize: 13,
    color: colors.textMuted,
  },
  overview: {
    gap: spacing.sm,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginTop: spacing.sm,
  },
  row: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.6,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  rowStatus: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  rowValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
});
