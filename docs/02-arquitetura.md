# 2. Arquitetura

[← Stack e setup](01-stack-e-setup.md) · [Índice](README.md) · [Próximo: Navegação →](03-navegacao.md)

## A ideia em uma frase

**As telas nunca falam SQL.** Elas ficam no topo, montam a interface e pedem as coisas pras camadas de baixo. Cada camada tem um trabalho só, e só uma delas (`src/database/`) encosta no banco.

```text
┌─────────────────────────────────────────────────────────────────┐
│  TELAS  ·  src/app/                                             │
│  Resumo, Transações, Orçamentos e os 2 formulários              │
│  montam a interface e coordenam as outras camadas               │
└───────┬────────────────┬────────────────┬────────────────┬──────┘
        │                │                │                │
        ▼                ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ components/  │ │ context/     │ │ utils/       │ │ database/    │
│ constants/   │ │ hooks/       │ │              │ │              │
│              │ │              │ │              │ │              │
│ visual + tema│ │ estado global│ │ regras puras │ │ SQL fica aqui│
└──────────────┘ └──────────────┘ └──────────────┘ └───────┬──────┘
                                                           │ SQL com ?
                                                           ▼
                                                   ┌──────────────┐
                                                   │ SQLite       │
                                                   │ meubolso.db  │
                                                   └──────────────┘
```

Seta = "usa" (importa). Repara que **nenhuma seta aponta pra cima**: nada importa de `src/app/`.

## As camadas

| Camada | Pasta | Responsabilidade | Exemplo |
|---|---|---|---|
| **Telas** | `src/app/` | Montar a interface, guardar o estado do formulário e chamar as outras camadas | `transacao.tsx` valida o formulário e chama `createTransaction` |
| **Visual** | `src/components/` | Peças de interface reutilizáveis, sem regra de negócio | `Button`, `TextField`, `ProgressBar` |
| **Constantes** | `src/constants/` | Valores fixos: cores, espaçamentos e a lista de categorias | `colors.expense`, `EXPENSE_CATEGORIES` |
| **Estado global** | `src/context/` | O que várias telas precisam compartilhar | `MonthContext`: o mês selecionado |
| **Hooks** | `src/hooks/` | Lógica de React reaproveitável | `useFocusData`: recarrega quando a tela aparece |
| **Regras** | `src/utils/` | Funções puras: entra valor, sai resultado. Não sabem que existe tela nem banco | `validateTransaction`, `formatMoney`, `monthRange` |
| **Acesso a dados** | `src/database/` | Criar as tabelas e fazer todas as consultas SQL | `listTransactions`, `saveBudget` |

## Quem pode importar quem

Tirando as telas, que usam tudo, essas são as dependências que existem hoje no código:

| Pasta | Importa de |
|---|---|
| `src/app/` | todas as outras |
| `src/components/` | `constants/`, `utils/`, e duas exceções (abaixo) |
| `src/database/` | `constants/` e `utils/` (só tipos e a função `monthRange`) |
| `src/context/` | `utils/` |
| `src/utils/` | `constants/` |
| `src/hooks/` | nada do projeto (só `expo-router` e `react`) |
| `src/constants/` | nada |

As duas exceções em `components/`, de propósito:

- `MonthSelector` lê o mês direto do `MonthContext`. Assim ele funciona em qualquer tela sem precisar receber props.
- `TransactionItem` importa o **tipo** `Transaction` de `database/transactions.ts` (com `import type`, que some depois de compilar). Ele não faz consulta nenhuma.

**A regra que nunca quebra:** nada importa de `src/app/`. Se um dia alguma coisa precisar, é sinal de que aquele código tá no lugar errado e deveria ir pra `components/`, `hooks/` ou `utils/`.

## Estrutura de pastas

```text
ATVAM/                     # raiz do repositório
├── app.json               # nome, ícones, scheme e plugins do Expo
├── package.json           # dependências e scripts
├── tsconfig.json          # TypeScript estrito + atalho @/
├── eslint.config.js       # regras do ESLint (padrão do Expo)
├── assets/                # ícone, ícones adaptativos do Android e splash
├── docs/                  # esta documentação
└── src/
    ├── app/                       # TELAS: cada arquivo vira uma rota
    │   ├── _layout.tsx            # raiz: banco + mês + pilha de navegação
    │   ├── (tabs)/
    │   │   ├── _layout.tsx        # a barra de abas
    │   │   ├── index.tsx          # aba Resumo        ->  /
    │   │   ├── transacoes.tsx     # aba Transações    ->  /transacoes
    │   │   └── orcamentos.tsx     # aba Orçamentos    ->  /orcamentos
    │   ├── transacao.tsx          # form de transação ->  /transacao?id=12
    │   └── orcamento/
    │       └── [categoria].tsx    # form de limite    ->  /orcamento/alimentacao
    ├── components/        # 11 peças visuais reutilizáveis
    ├── constants/
    │   ├── categories.ts  # categorias de receita e despesa
    │   └── theme.ts       # cores, espaçamentos e raios de borda
    ├── context/
    │   └── MonthContext.tsx   # o mês selecionado, compartilhado entre as abas
    ├── database/
    │   ├── schema.ts          # criação das tabelas e migrações
    │   ├── transactions.ts    # consultas da tabela transactions
    │   └── budgets.ts         # consultas da tabela budgets
    ├── hooks/
    │   └── useFocusData.ts    # recarrega os dados quando a tela ganha foco
    └── utils/
        ├── date.ts            # conversão e formatação de datas
        ├── money.ts           # conversão e formatação de dinheiro
        └── validation.ts      # regras de validação dos formulários
```

**Regra de ouro: dentro de `src/app/` só entra tela.** O Expo Router transforma *qualquer* arquivo dessa pasta numa rota. Se você largar um componente lá dentro, ele vira uma tela fantasma.

## Por que separar assim?

- **Trocar uma peça não quebra o resto.** Se um dia o banco virar uma API na nuvem, só `src/database/` muda. As telas continuam chamando `listTransactions(...)` do mesmo jeito.
- **Dá pra testar sem abrir o app.** `validation.ts`, `money.ts` e `date.ts` são funções puras. Nenhuma delas importa React Native.
- **As telas ficam fáceis de ler.** Elas só juntam as peças: pegam dados de `database/`, validam com `utils/` e desenham com `components/`.
- **Tudo tem um lugar óbvio.** Mudou uma cor? `theme.ts`. Mudou uma regra? `validation.ts`. Mudou uma consulta? `database/`.
