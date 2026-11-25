// Tela "Transações": lista os lançamentos do mês agrupados por dia,
// com busca pela descrição e filtro por tipo (receita/despesa).

import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { Fab } from '@/components/Fab';
import { MonthSelector } from '@/components/MonthSelector';
import { SegmentedControl, type SegmentOption } from '@/components/SegmentedControl';
import { TransactionItem } from '@/components/TransactionItem';
import { colors, radius, spacing } from '@/constants/theme';
import { useSelectedMonth } from '@/context/MonthContext';
import { listTransactions, type Transaction } from '@/database/transactions';
import { useFocusData } from '@/hooks/useFocusData';
import { dayLabel } from '@/utils/date';
import { formatMoney } from '@/utils/money';

type Filter = 'all' | 'income' | 'expense';

const FILTER_OPTIONS: SegmentOption<Filter>[] = [
  { value: 'all', label: 'Todas' },
  { value: 'income', label: 'Receitas', color: colors.income },
  { value: 'expense', label: 'Despesas', color: colors.expense },
];

interface DaySection {
  date: string;
  title: string;
  data: Transaction[];
}

/** Agrupa a lista (já ordenada por data) em seções, uma por dia. */
function groupByDay(transactions: Transaction[]): DaySection[] {
  const sections: DaySection[] = [];
  for (const t of transactions) {
    const last = sections[sections.length - 1];
    if (last && last.date === t.date) {
      last.data.push(t);
    } else {
      sections.push({ date: t.date, title: dayLabel(t.date), data: [t] });
    }
  }
  return sections;
}

export default function TransactionsScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { month } = useSelectedMonth();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const load = useCallback(
    () => listTransactions(db, month, { search, type: filter === 'all' ? undefined : filter }),
    [db, month, search, filter],
  );
  const { data, error } = useFocusData(load);

  const transactions = useMemo(() => data ?? [], [data]);
  const sections = useMemo(() => groupByDay(transactions), [transactions]);
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of transactions) {
      if (t.type === 'income') income += t.amountCents;
      else expense += t.amountCents;
    }
    return { income, expense };
  }, [transactions]);

  const hasFilters = search.trim() !== '' || filter !== 'all';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MonthSelector />

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar pela descrição"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
            accessibilityLabel="Buscar transações pela descrição"
          />
          {search !== '' && (
            <Pressable onPress={() => setSearch('')} hitSlop={10} accessibilityLabel="Limpar busca">
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        <SegmentedControl options={FILTER_OPTIONS} value={filter} onChange={setFilter} />

        {transactions.length > 0 && (
          <Text style={styles.totals}>
            {transactions.length} {transactions.length === 1 ? 'lançamento' : 'lançamentos'} ·{' '}
            <Text style={{ color: colors.income }}>+ {formatMoney(totals.income)}</Text> ·{' '}
            <Text style={{ color: colors.expense }}>- {formatMoney(totals.expense)}</Text>
          </Text>
        )}
      </View>

      {error ? (
        <EmptyState icon="alert-circle" title="Erro ao carregar" message={error.message} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => <Text style={styles.sectionTitle}>{section.title}</Text>}
          renderItem={({ item, index, section }) => (
            <View
              style={[
                styles.itemCard,
                index === 0 && styles.itemFirst,
                index === section.data.length - 1 && styles.itemLast,
                index > 0 && styles.itemDivider,
              ]}
            >
              <TransactionItem
                transaction={item}
                onPress={() => router.push({ pathname: '/transacao', params: { id: String(item.id) } })}
              />
            </View>
          )}
          ListEmptyComponent={
            data === null ? undefined : hasFilters ? (
              <EmptyState
                icon="search"
                title="Nenhum resultado"
                message="Tente outro termo de busca ou mude o filtro."
              />
            ) : (
              <EmptyState
                icon="document-text-outline"
                title="Nenhum lançamento neste mês"
                message="Toque no botão + para registrar uma receita ou despesa."
              />
            )
          }
        />
      )}

      <Fab label="Nova transação" onPress={() => router.push('/transacao')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: spacing.md,
    color: colors.text,
  },
  totals: {
    fontSize: 13,
    color: colors.textMuted,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100, // espaço para o botão flutuante
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  itemCard: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
  },
  itemFirst: {
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
  },
  itemLast: {
    borderBottomLeftRadius: radius.md,
    borderBottomRightRadius: radius.md,
  },
  itemDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
