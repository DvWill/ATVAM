// Acesso à tabela `transactions` (receitas e despesas).
// Todas as consultas usam parâmetros (?) em vez de concatenar texto,
// o que evita erros e injeção de SQL.

import type { SQLiteDatabase } from 'expo-sqlite';

import type { TransactionType } from '@/constants/categories';
import { monthRange, type YearMonth } from '@/utils/date';
import type { ValidTransaction } from '@/utils/validation';

export interface Transaction {
  id: number;
  type: TransactionType;
  description: string;
  amountCents: number;
  category: string;
  date: string; // AAAA-MM-DD
  notes: string | null;
}

interface TransactionRow {
  id: number;
  type: TransactionType;
  description: string;
  amount_cents: number;
  category: string;
  date: string;
  notes: string | null;
}

const COLUMNS = 'id, type, description, amount_cents, category, date, notes';

function fromRow(row: TransactionRow): Transaction {
  return {
    id: row.id,
    type: row.type,
    description: row.description,
    amountCents: row.amount_cents,
    category: row.category,
    date: row.date,
    notes: row.notes,
  };
}

export interface TransactionFilters {
  type?: TransactionType;
  search?: string;
  limit?: number;
}

/** Escapa % e _ para que sejam tratados como texto comum no LIKE. */
function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/** Lista os lançamentos de um mês, do mais recente para o mais antigo. */
export async function listTransactions(
  db: SQLiteDatabase,
  month: YearMonth,
  filters: TransactionFilters = {},
): Promise<Transaction[]> {
  const { start, end } = monthRange(month);
  const where = ['date >= ?', 'date < ?'];
  const params: (string | number)[] = [start, end];

  if (filters.type) {
    where.push('type = ?');
    params.push(filters.type);
  }

  const search = filters.search?.trim();
  if (search) {
    where.push("description LIKE ? ESCAPE '\\'");
    params.push(`%${escapeLike(search)}%`);
  }

  let sql = `SELECT ${COLUMNS} FROM transactions WHERE ${where.join(' AND ')} ORDER BY date DESC, id DESC`;
  if (filters.limit) {
    sql += ' LIMIT ?';
    params.push(filters.limit);
  }

  const rows = await db.getAllAsync<TransactionRow>(sql, params);
  return rows.map(fromRow);
}

export async function getTransaction(db: SQLiteDatabase, id: number): Promise<Transaction | null> {
  const row = await db.getFirstAsync<TransactionRow>(
    `SELECT ${COLUMNS} FROM transactions WHERE id = ?`,
    [id],
  );
  return row ? fromRow(row) : null;
}

export async function createTransaction(db: SQLiteDatabase, data: ValidTransaction): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO transactions (type, description, amount_cents, category, date, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [data.type, data.description, data.amountCents, data.category, data.date, data.notes],
  );
  return result.lastInsertRowId;
}

export async function updateTransaction(
  db: SQLiteDatabase,
  id: number,
  data: ValidTransaction,
): Promise<void> {
  await db.runAsync(
    `UPDATE transactions
        SET type = ?, description = ?, amount_cents = ?, category = ?, date = ?, notes = ?
      WHERE id = ?`,
    [data.type, data.description, data.amountCents, data.category, data.date, data.notes, id],
  );
}

export async function deleteTransaction(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
}

export interface MonthSummary {
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  /** Saldo acumulado de todos os lançamentos até o fim do mês. */
  accumulatedCents: number;
}

export async function getMonthSummary(db: SQLiteDatabase, month: YearMonth): Promise<MonthSummary> {
  const { start, end } = monthRange(month);
  const row = await db.getFirstAsync<{ income: number; expense: number; accumulated: number }>(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'income'  AND date >= ? THEN amount_cents END), 0) AS income,
       COALESCE(SUM(CASE WHEN type = 'expense' AND date >= ? THEN amount_cents END), 0) AS expense,
       COALESCE(SUM(CASE WHEN type = 'income' THEN amount_cents ELSE -amount_cents END), 0) AS accumulated
     FROM transactions
     WHERE date < ?`,
    [start, start, end],
  );
  const income = row?.income ?? 0;
  const expense = row?.expense ?? 0;
  return {
    incomeCents: income,
    expenseCents: expense,
    balanceCents: income - expense,
    accumulatedCents: row?.accumulated ?? 0,
  };
}

export interface CategoryTotal {
  category: string;
  totalCents: number;
}

/** Soma das despesas do mês agrupadas por categoria (maior para menor). */
export async function getExpensesByCategory(
  db: SQLiteDatabase,
  month: YearMonth,
): Promise<CategoryTotal[]> {
  const { start, end } = monthRange(month);
  return db.getAllAsync<CategoryTotal>(
    `SELECT category, SUM(amount_cents) AS totalCents
       FROM transactions
      WHERE type = 'expense' AND date >= ? AND date < ?
      GROUP BY category
      ORDER BY totalCents DESC`,
    [start, end],
  );
}
