import type { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_NAME = 'meubolso.db';

// Sempre que o esquema mudar, aumente a versão e adicione um novo bloco
// de migração em `migrateDbIfNeeded`. O SQLite guarda a versão atual em
// `PRAGMA user_version`, então cada migração roda uma única vez.
const DATABASE_VERSION = 1;

export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let currentVersion = result?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) return;

  if (currentVersion === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';

      CREATE TABLE IF NOT EXISTS transactions (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        type         TEXT    NOT NULL CHECK (type IN ('income', 'expense')),
        description  TEXT    NOT NULL,
        amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
        category     TEXT    NOT NULL,
        date         TEXT    NOT NULL, -- AAAA-MM-DD
        notes        TEXT,
        created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (date);

      CREATE TABLE IF NOT EXISTS budgets (
        category    TEXT    PRIMARY KEY NOT NULL,
        limit_cents INTEGER NOT NULL CHECK (limit_cents > 0)
      );
    `);
    currentVersion = 1;
  }

  // Exemplo de migração futura:
  // if (currentVersion === 1) {
  //   await db.execAsync('ALTER TABLE transactions ADD COLUMN ...');
  //   currentVersion = 2;
  // }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
