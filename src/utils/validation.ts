// Regras de validação dos formulários. Ficam separadas das telas para que
// possam ser reaproveitadas e testadas sem depender da interface.

import { isValidCategory, type TransactionType } from '@/constants/categories';
import { brToISO, hasBRDateFormat, todayISO } from '@/utils/date';
import { parseMoney } from '@/utils/money';

export const DESCRIPTION_MIN = 3;
export const DESCRIPTION_MAX = 60;
export const NOTES_MAX = 200;
export const MAX_AMOUNT_CENTS = 100_000_000; // R$ 1.000.000,00
const MIN_DATE = '2000-01-01';

/** Valores exatamente como vieram dos campos do formulário (texto). */
export interface TransactionFormValues {
  type: TransactionType;
  amount: string;
  description: string;
  category: string | null;
  date: string; // dd/mm/aaaa
  notes: string;
}

/** Dados já validados e convertidos, prontos para gravar no banco. */
export interface ValidTransaction {
  type: TransactionType;
  amountCents: number;
  description: string;
  category: string;
  date: string; // AAAA-MM-DD
  notes: string | null;
}

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

export type ValidationResult<T, K extends string> =
  | { ok: true; value: T }
  | { ok: false; errors: FieldErrors<K> };

/** Valida um valor em dinheiro digitado. Retorna a mensagem de erro ou os centavos. */
export function validateAmount(text: string): { error: string } | { cents: number } {
  if (text.trim() === '') return { error: 'Informe o valor.' };
  const cents = parseMoney(text);
  if (cents === null) return { error: 'Valor inválido. Use o formato 1.234,56.' };
  if (cents <= 0) return { error: 'O valor deve ser maior que zero.' };
  if (cents > MAX_AMOUNT_CENTS) return { error: 'O valor máximo é R$ 1.000.000,00.' };
  return { cents };
}

export function validateTransaction(
  values: TransactionFormValues,
  today: string = todayISO(),
): ValidationResult<ValidTransaction, keyof TransactionFormValues> {
  const errors: FieldErrors<keyof TransactionFormValues> = {};

  // Valor
  const amount = validateAmount(values.amount);
  if ('error' in amount) errors.amount = amount.error;

  // Descrição
  const description = values.description.trim().replace(/\s+/g, ' ');
  if (description === '') {
    errors.description = 'Informe uma descrição.';
  } else if (description.length < DESCRIPTION_MIN) {
    errors.description = `A descrição deve ter pelo menos ${DESCRIPTION_MIN} caracteres.`;
  } else if (description.length > DESCRIPTION_MAX) {
    errors.description = `A descrição pode ter no máximo ${DESCRIPTION_MAX} caracteres.`;
  } else if (!/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(description)) {
    errors.description = 'A descrição deve conter pelo menos uma letra.';
  }

  // Categoria (precisa combinar com o tipo: receita ou despesa)
  if (!values.category || !isValidCategory(values.category, values.type)) {
    errors.category = 'Selecione uma categoria.';
  }

  // Data
  const dateText = values.date.trim();
  const isoDate = brToISO(dateText);
  if (dateText === '') {
    errors.date = 'Informe a data.';
  } else if (!hasBRDateFormat(dateText)) {
    errors.date = 'Use o formato dd/mm/aaaa.';
  } else if (isoDate === null) {
    errors.date = 'Essa data não existe.';
  } else if (isoDate < MIN_DATE) {
    errors.date = 'A data deve ser a partir de 01/01/2000.';
  } else if (isoDate > today) {
    errors.date = 'A data não pode estar no futuro.';
  }

  // Observação (opcional)
  const notes = values.notes.trim();
  if (notes.length > NOTES_MAX) {
    errors.notes = `A observação pode ter no máximo ${NOTES_MAX} caracteres.`;
  }

  if (Object.keys(errors).length > 0 || 'error' in amount || isoDate === null || !values.category) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      type: values.type,
      amountCents: amount.cents,
      description,
      category: values.category,
      date: isoDate,
      notes: notes === '' ? null : notes,
    },
  };
}

export function validateBudget(limitText: string): ValidationResult<number, 'limit'> {
  const result = validateAmount(limitText);
  if ('error' in result) return { ok: false, errors: { limit: result.error } };
  return { ok: true, value: result.cents };
}
