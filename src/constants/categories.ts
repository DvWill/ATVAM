import type Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

export type IconName = ComponentProps<typeof Ionicons>['name'];

/** Tipo de lançamento: receita (entrada) ou despesa (saída). */
export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  icon: IconName;
  color: string;
  type: TransactionType;
}

export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'alimentacao', name: 'Alimentação', icon: 'restaurant', color: '#F97316', type: 'expense' },
  { id: 'transporte', name: 'Transporte', icon: 'car', color: '#3B82F6', type: 'expense' },
  { id: 'moradia', name: 'Moradia', icon: 'home', color: '#8B5CF6', type: 'expense' },
  { id: 'saude', name: 'Saúde', icon: 'medkit', color: '#EF4444', type: 'expense' },
  { id: 'educacao', name: 'Educação', icon: 'school', color: '#0EA5E9', type: 'expense' },
  { id: 'lazer', name: 'Lazer', icon: 'game-controller', color: '#EC4899', type: 'expense' },
  { id: 'compras', name: 'Compras', icon: 'bag-handle', color: '#14B8A6', type: 'expense' },
  { id: 'contas', name: 'Contas', icon: 'receipt', color: '#64748B', type: 'expense' },
  { id: 'outros', name: 'Outros', icon: 'ellipsis-horizontal-circle', color: '#9CA3AF', type: 'expense' },
];

export const INCOME_CATEGORIES: Category[] = [
  { id: 'salario', name: 'Salário', icon: 'cash', color: '#16A34A', type: 'income' },
  { id: 'freelance', name: 'Freelance', icon: 'briefcase', color: '#0D9488', type: 'income' },
  { id: 'investimentos', name: 'Investimentos', icon: 'trending-up', color: '#2563EB', type: 'income' },
  { id: 'presente', name: 'Presente', icon: 'gift', color: '#DB2777', type: 'income' },
  { id: 'outras_receitas', name: 'Outras receitas', icon: 'add-circle', color: '#6B7280', type: 'income' },
];

const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

/** Categoria usada quando um id salvo não existe mais na lista acima. */
const UNKNOWN_CATEGORY: Category = {
  id: 'desconhecida',
  name: 'Sem categoria',
  icon: 'help-circle',
  color: '#9CA3AF',
  type: 'expense',
};

export function getCategories(type: TransactionType): Category[] {
  return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

export function findCategory(id: string): Category | undefined {
  return ALL_CATEGORIES.find((c) => c.id === id);
}

export function getCategory(id: string): Category {
  return findCategory(id) ?? UNKNOWN_CATEGORY;
}

/** Verifica se a categoria existe e pertence ao tipo informado. */
export function isValidCategory(id: string, type: TransactionType): boolean {
  return getCategories(type).some((c) => c.id === id);
}
