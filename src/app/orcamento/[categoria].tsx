// Definir, alterar ou remover o limite mensal de uma categoria de despesa.
//   /orcamento/alimentacao  -> orçamento da categoria "Alimentação"

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button } from '@/components/Button';
import { CategoryIcon } from '@/components/CategoryIcon';
import { EmptyState } from '@/components/EmptyState';
import { TextField } from '@/components/TextField';
import { findCategory } from '@/constants/categories';
import { colors, radius, spacing } from '@/constants/theme';
import { useSelectedMonth } from '@/context/MonthContext';
import { deleteBudget, getBudget, saveBudget } from '@/database/budgets';
import { getExpensesByCategory } from '@/database/transactions';
import { monthLabel } from '@/utils/date';
import { centsToInput, formatMoney } from '@/utils/money';
import { validateBudget } from '@/utils/validation';

export default function BudgetFormScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { month } = useSelectedMonth();
  const { categoria } = useLocalSearchParams<{ categoria: string }>();

  // Só categorias de despesa podem ter orçamento.
  const found = findCategory(categoria);
  const category = found?.type === 'expense' ? found : undefined;

  const [limit, setLimit] = useState('');
  const [hasBudget, setHasBudget] = useState(false);
  const [spentCents, setSpentCents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!category) return;
    let active = true;
    Promise.all([getBudget(db, category.id), getExpensesByCategory(db, month)])
      .then(([budget, spending]) => {
        if (!active) return;
        if (budget) {
          setLimit(centsToInput(budget.limitCents));
          setHasBudget(true);
        }
        setSpentCents(spending.find((s) => s.category === category.id)?.totalCents ?? 0);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [db, month, category]);

  if (!category) {
    return (
      <>
        <Stack.Screen options={{ title: 'Orçamento' }} />
        <EmptyState icon="alert-circle" title="Categoria inválida" message="Volte e escolha outra categoria." />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: category.name }} />
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      </>
    );
  }

  const validation = validateBudget(limit);
  const error = submitted && !validation.ok ? validation.errors.limit : undefined;

  async function handleSave() {
    setSubmitted(true);
    if (!validation.ok || !category) return;
    setSaving(true);
    try {
      await saveBudget(db, category.id, validation.value);
      router.back();
    } catch {
      setSaving(false);
      Alert.alert('Erro', 'Não foi possível salvar o orçamento.');
    }
  }

  function handleRemove() {
    if (!category) return;
    Alert.alert('Remover limite', `Remover o limite mensal de ${category.name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBudget(db, category.id);
            router.back();
          } catch {
            Alert.alert('Erro', 'Não foi possível remover o orçamento.');
          }
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: category.name }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <CategoryIcon category={category} size={64} />
          <Text style={styles.name}>{category.name}</Text>
          <View style={styles.spentBox}>
            <Text style={styles.spentLabel}>Gasto em {monthLabel(month).toLowerCase()}</Text>
            <Text style={styles.spentValue}>{formatMoney(spentCents)}</Text>
          </View>
        </View>

        <TextField
          label="Limite mensal"
          prefix="R$"
          value={limit}
          onChangeText={setLimit}
          placeholder="0,00"
          keyboardType="decimal-pad"
          error={error}
          hint="O app avisa no Resumo quando você atingir 80% do limite."
          autoFocus={!hasBudget}
        />

        <View style={styles.actions}>
          <Button
            title={hasBudget ? 'Salvar limite' : 'Definir limite'}
            icon="checkmark"
            onPress={handleSave}
            loading={saving}
          />
          {hasBudget && (
            <Button title="Remover limite" icon="trash-outline" variant="danger" onPress={handleRemove} />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  loading: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.xl,
  },
  header: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  spentBox: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  spentLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  spentValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  actions: {
    gap: spacing.md,
  },
});
