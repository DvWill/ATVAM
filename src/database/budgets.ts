// Acesso à tabela `budgets`: limite mensal de gastos por categoria de despesa.
// O mesmo limite vale para todos os meses.

import type { SQLiteDatabase } from 'expo-sqlite';

export interface Budget {
  category: string;
  limitCents: number;
}

export async function listBudgets(db: SQLiteDatabase): Promise<Budget[]> {
  return db.getAllAsync<Budget>(
    'SELECT category, limit_cents AS limitCents FROM budgets ORDER BY category',
  );
}

export async function getBudget(db: SQLiteDatabase, category: string): Promise<Budget | null> {
  return db.getFirstAsync<Budget>(
    'SELECT category, limit_cents AS limitCents FROM budgets WHERE category = ?',
    [category],
  );
}

/** Cria o orçamento ou, se a categoria já tiver um, atualiza o limite. */
export async function saveBudget(db: SQLiteDatabase, category: string, limitCents: number): Promise<void> {
  await db.runAsync(
    `INSERT INTO budgets (category, limit_cents) VALUES (?, ?)
     ON CONFLICT (category) DO UPDATE SET limit_cents = excluded.limit_cents`,
    [category, limitCents],
  );
}

export async function deleteBudget(db: SQLiteDatabase, category: string): Promise<void> {
  await db.runAsync('DELETE FROM budgets WHERE category = ?', [category]);
}
