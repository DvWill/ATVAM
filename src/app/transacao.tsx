// Formulário de transação.
//   /transacao          -> cadastra uma nova transação
//   /transacao?id=12    -> edita (ou exclui) a transação 12

import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button } from '@/components/Button';
import { CategoryPicker } from '@/components/CategoryPicker';
import { EmptyState } from '@/components/EmptyState';
import { SegmentedControl, type SegmentOption } from '@/components/SegmentedControl';
import { TextField } from '@/components/TextField';
import { getCategories, type TransactionType } from '@/constants/categories';
import { colors, radius, spacing } from '@/constants/theme';
import {
  createTransaction,
  deleteTransaction,
  getTransaction,
  updateTransaction,
} from '@/database/transactions';
import { isoToBR, maskDateInput, todayISO, yesterdayISO } from '@/utils/date';
import { centsToInput } from '@/utils/money';
import {
  DESCRIPTION_MAX,
  NOTES_MAX,
  validateTransaction,
  type TransactionFormValues,
} from '@/utils/validation';

const TYPE_OPTIONS: SegmentOption<TransactionType>[] = [
  { value: 'expense', label: 'Despesa', color: colors.expense },
  { value: 'income', label: 'Receita', color: colors.income },
];

/** Valores iniciais de uma transação nova (a data padrão é hoje). */
function emptyForm(): TransactionFormValues {
  return { type: 'expense', amount: '', description: '', category: null, date: isoToBR(todayISO()), notes: '' };
}

export default function TransactionFormScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();

  // O id vem da URL como texto; só aceitamos números inteiros positivos.
  const transactionId = params.id && /^\d+$/.test(params.id) ? Number(params.id) : null;
  const isEditing = params.id !== undefined;

  const [values, setValues] = useState<TransactionFormValues>(emptyForm);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [notFound, setNotFound] = useState(isEditing && transactionId === null);
  const [saving, setSaving] = useState(false);

  // No modo edição, carrega os dados da transação do banco.
  useEffect(() => {
    if (transactionId === null) return;
    let active = true;
    getTransaction(db, transactionId)
      .then((t) => {
        if (!active) return;
        if (!t) {
          setNotFound(true);
        } else {
          setValues({
            type: t.type,
            amount: centsToInput(t.amountCents),
            description: t.description,
            category: t.category,
            date: isoToBR(t.date),
            notes: t.notes ?? '',
          });
        }
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          setNotFound(true);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [db, transactionId]);

  // A validação roda a cada alteração, mas os erros só aparecem depois da
  // primeira tentativa de salvar (para não "brigar" com o usuário enquanto digita).
  const validation = useMemo(() => validateTransaction(values), [values]);
  const errors = submitted && !validation.ok ? validation.errors : {};

  function setField<K extends keyof TransactionFormValues>(field: K, value: TransactionFormValues[K]) {
    setValues((prev) => {
      const next = { ...prev, [field]: value };
      // Receitas e despesas têm categorias diferentes: ao trocar o tipo, limpa a categoria.
      if (field === 'type' && value !== prev.type) next.category = null;
      return next;
    });
  }

  async function handleSave() {
    setSubmitted(true);
    if (!validation.ok) return;

    setSaving(true);
    try {
      if (transactionId !== null) {
        await updateTransaction(db, transactionId, validation.value);
      } else {
        await createTransaction(db, validation.value);
      }
      router.back();
    } catch {
      setSaving(false);
      Alert.alert('Erro', 'Não foi possível salvar a transação. Tente novamente.');
    }
  }

  function handleDelete() {
    if (transactionId === null) return;
    Alert.alert('Excluir transação', 'Tem certeza? Essa ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTransaction(db, transactionId);
            router.back();
          } catch {
            Alert.alert('Erro', 'Não foi possível excluir a transação.');
          }
        },
      },
    ]);
  }

  const title = isEditing ? 'Editar transação' : 'Nova transação';

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title }} />
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      </>
    );
  }

  if (notFound) {
    return (
      <>
        <Stack.Screen options={{ title }} />
        <EmptyState
          icon="alert-circle"
          title="Transação não encontrada"
          message="Ela pode ter sido excluída. Volte e tente novamente."
        />
      </>
    );
  }

  const today = isoToBR(todayISO());
  const yesterday = isoToBR(yesterdayISO());

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {submitted && !validation.ok && (
          <View style={styles.errorBanner} accessibilityLiveRegion="polite">
            <Ionicons name="alert-circle" size={18} color={colors.expense} />
            <Text style={styles.errorBannerText}>Corrija os campos destacados para salvar.</Text>
          </View>
        )}

        <SegmentedControl options={TYPE_OPTIONS} value={values.type} onChange={(v) => setField('type', v)} />

        <TextField
          label="Valor"
          prefix="R$"
          value={values.amount}
          onChangeText={(text) => setField('amount', text)}
          placeholder="0,00"
          keyboardType="decimal-pad"
          error={errors.amount}
        />

        <TextField
          label="Descrição"
          value={values.description}
          onChangeText={(text) => setField('description', text)}
          placeholder={values.type === 'expense' ? 'Ex.: Almoço no restaurante' : 'Ex.: Salário de novembro'}
          maxLength={DESCRIPTION_MAX}
          autoCapitalize="sentences"
          error={errors.description}
          hint={`${values.description.length}/${DESCRIPTION_MAX}`}
        />

        <CategoryPicker
          categories={getCategories(values.type)}
          value={values.category}
          onChange={(id) => setField('category', id)}
          error={errors.category}
        />

        <TextField
          label="Data"
          value={values.date}
          onChangeText={(text) => setField('date', maskDateInput(text))}
          placeholder="dd/mm/aaaa"
          keyboardType="number-pad"
          maxLength={10}
          error={errors.date}
          footer={
            <View style={styles.quickDates}>
              {[
                { label: 'Hoje', value: today },
                { label: 'Ontem', value: yesterday },
              ].map((option) => {
                const selected = values.date === option.value;
                return (
                  <Pressable
                    key={option.label}
                    onPress={() => setField('date', option.value)}
                    style={[styles.quickDate, selected && styles.quickDateSelected]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text style={[styles.quickDateText, selected && styles.quickDateTextSelected]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          }
        />

        <TextField
          label="Observação (opcional)"
          value={values.notes}
          onChangeText={(text) => setField('notes', text)}
          placeholder="Algum detalhe que queira lembrar"
          multiline
          maxLength={NOTES_MAX}
          style={styles.notes}
          error={errors.notes}
          hint={`${values.notes.length}/${NOTES_MAX}`}
        />

        <View style={styles.actions}>
          <Button
            title={isEditing ? 'Salvar alterações' : 'Adicionar transação'}
            icon="checkmark"
            onPress={handleSave}
            loading={saving}
          />
          {isEditing && <Button title="Excluir" icon="trash-outline" variant="danger" onPress={handleDelete} />}
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
    paddingBottom: 40,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.expenseLight,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorBannerText: {
    flex: 1,
    color: colors.expense,
    fontWeight: '600',
  },
  quickDates: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  quickDate: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  quickDateSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  quickDateText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  quickDateTextSelected: {
    color: colors.primary,
  },
  notes: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actions: {
    gap: spacing.md,
  },
});
