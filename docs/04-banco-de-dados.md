# 4. Banco de dados

[← Navegação](03-navegacao.md) · [Índice](README.md) · [Próximo: Estado e fluxo de dados →](05-estado-e-fluxo-de-dados.md)

Tudo fica num arquivo `meubolso.db` guardado no próprio celular, acessado pelo `expo-sqlite`. Não tem servidor nem API: o app conversa direto com o banco usando SQL.

## Passo 1: o banco abre junto com o app

No `src/app/_layout.tsx`, o `SQLiteProvider` abre o arquivo (ou cria, se não existir) e roda a função `migrateDbIfNeeded` **antes** de mostrar qualquer tela:

```tsx
<SQLiteProvider databaseName="meubolso.db" onInit={migrateDbIfNeeded}>
```

Depois disso, qualquer tela pega a conexão com uma linha:

```tsx
const db = useSQLiteContext();
```

## Passo 2: as tabelas

```sql
CREATE TABLE transactions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  type         TEXT    NOT NULL CHECK (type IN ('income', 'expense')),
  description  TEXT    NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  category     TEXT    NOT NULL,
  date         TEXT    NOT NULL,  -- AAAA-MM-DD
  notes        TEXT,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_transactions_date ON transactions (date);

CREATE TABLE budgets (
  category    TEXT    PRIMARY KEY NOT NULL,
  limit_cents INTEGER NOT NULL CHECK (limit_cents > 0)
);
```

### Cada detalhe aí foi uma decisão

- **Dinheiro em centavos, como inteiro.** R$ 25,90 vira `2590`. Com número decimal rola o clássico `0.1 + 0.2 = 0.30000000000000004`, e em app de dinheiro isso não dá. A conversão pra reais só acontece na hora de mostrar na tela (`formatMoney` em `src/utils/money.ts`).
- **Data como texto `AAAA-MM-DD`.** Nesse formato a ordem alfabética é a ordem cronológica. Filtrar um mês vira `date >= '2026-11-01' AND date < '2026-12-01'`, e o índice em `date` deixa isso rápido.
- **`CHECK` nas colunas.** Se algum bug passar pela validação da tela, o banco recusa o dado do mesmo jeito. É a última barreira (ver [Validação](06-validacao.md)).
- **`category` guarda só o id da categoria** (`'alimentacao'`, `'salario'`...). Nome, ícone e cor ficam em `src/constants/categories.ts`. Por isso dá pra mudar o nome ou a cor de uma categoria sem mexer no banco.
- **`budgets` não tem coluna de mês.** A categoria é a chave primária, então cada categoria tem um limite só, que vale pra todos os meses.

### Relação entre as tabelas

As duas tabelas se ligam pela categoria (`transactions.category` ↔ `budgets.category`), mas **não tem chave estrangeira**: as categorias não estão numa tabela, estão no código. O gasto de uma categoria no mês é calculado na hora, somando as transações (`getExpensesByCategory`).

## Passo 3: migração com `PRAGMA user_version`

O SQLite guarda um número de versão dentro do próprio arquivo do banco. O `src/database/schema.ts` usa esse número pra saber o que já rodou:

```ts
const DATABASE_VERSION = 1;

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let currentVersion = result?.user_version ?? 0;
  if (currentVersion >= DATABASE_VERSION) return; // já tá atualizado

  if (currentVersion === 0) {
    await db.execAsync(`PRAGMA journal_mode = 'wal'; CREATE TABLE ...`); // primeira vez: cria tudo
    currentVersion = 1;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
```

- **Primeira vez que o app abre:** versão 0 → cria as tabelas e marca 1.
- **Nas próximas:** já é 1 → não faz nada.
- **Quer mudar o esquema depois?** Sobe pra versão 2 e adiciona um bloco `if (currentVersion === 1)`. A receita completa tá em [Como estender](08-como-estender.md#receita-3-uma-coluna-nova-no-banco).

O `journal_mode = 'wal'` é um modo do SQLite que deixa leitura e escrita acontecerem ao mesmo tempo sem uma travar a outra. É a configuração recomendada pra app.

## Passo 4: as consultas

As telas **nunca escrevem SQL**. Elas chamam funções de `src/database/`, e todas recebem a conexão `db` como primeiro parâmetro.

### `src/database/transactions.ts`

| Função | O que faz | Retorna |
|---|---|---|
| `listTransactions(db, month, filters?)` | Lista as transações do mês, da mais recente pra mais antiga. Filtros opcionais: `type`, `search` (busca na descrição) e `limit` | `Transaction[]` |
| `getTransaction(db, id)` | Busca uma transação pelo id | `Transaction \| null` |
| `createTransaction(db, data)` | Insere uma transação já validada | o `id` novo |
| `updateTransaction(db, id, data)` | Atualiza todos os campos de uma transação | nada |
| `deleteTransaction(db, id)` | Apaga uma transação | nada |
| `getMonthSummary(db, month)` | Receitas, despesas e saldo do mês, mais o saldo acumulado até o fim do mês | `MonthSummary` |
| `getExpensesByCategory(db, month)` | Soma das despesas do mês por categoria, da maior pra menor | `CategoryTotal[]` |

### `src/database/budgets.ts`

| Função | O que faz | Retorna |
|---|---|---|
| `listBudgets(db)` | Todos os limites definidos | `Budget[]` |
| `getBudget(db, category)` | O limite de uma categoria | `Budget \| null` |
| `saveBudget(db, category, limitCents)` | Cria o limite ou atualiza, se já existir | nada |
| `deleteBudget(db, category)` | Remove o limite de uma categoria | nada |

### Os 4 métodos do `expo-sqlite`

| Método | Quando usar | Exemplo no projeto |
|---|---|---|
| `getAllAsync` | Buscar várias linhas | `listTransactions` |
| `getFirstAsync` | Buscar uma linha (ou `null`) | `getTransaction` |
| `runAsync` | `INSERT`, `UPDATE`, `DELETE` | `createTransaction` |
| `execAsync` | Vários comandos de uma vez, sem parâmetros | a migração |

## Regras e truques das consultas

**Valor do usuário entra por `?`, nunca colado na string.** Isso evita SQL injection:

```ts
await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]); // certo
await db.runAsync(`DELETE FROM transactions WHERE id = ${id}`);   // NUNCA
```

**A busca escapa os caracteres especiais do `LIKE`.** Se alguém buscar `50%`, o `%` precisa ser tratado como texto, não como coringa. A função `escapeLike` cuida disso:

```ts
where.push("description LIKE ? ESCAPE '\\'");
params.push(`%${escapeLike(search)}%`);
```

**snake_case no banco, camelCase no app.** O banco tem `amount_cents`, o TypeScript tem `amountCents`. A função `fromRow` faz a tradução em `transactions.ts`. Em `budgets.ts` a tradução é feita direto no SQL, com `limit_cents AS limitCents`.

**Criar ou atualizar num comando só (upsert).** O `saveBudget` não precisa checar se o limite já existe:

```sql
INSERT INTO budgets (category, limit_cents) VALUES (?, ?)
ON CONFLICT (category) DO UPDATE SET limit_cents = excluded.limit_cents
```

**O resumo do mês sai numa consulta só.** O `getMonthSummary` usa `SUM(CASE WHEN ...)` pra calcular receitas, despesas e saldo acumulado de uma vez, em vez de fazer três consultas:

```sql
SELECT
  COALESCE(SUM(CASE WHEN type = 'income'  AND date >= ? THEN amount_cents END), 0) AS income,
  COALESCE(SUM(CASE WHEN type = 'expense' AND date >= ? THEN amount_cents END), 0) AS expense,
  COALESCE(SUM(CASE WHEN type = 'income' THEN amount_cents ELSE -amount_cents END), 0) AS accumulated
FROM transactions
WHERE date < ?   -- fim do mês
```

O `COALESCE(..., 0)` garante que um mês sem nenhuma transação devolve `0` em vez de `NULL`.
