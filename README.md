# Meu Bolso: controle financeiro pessoal

Aplicativo mobile para registrar **receitas e despesas**, acompanhar o **saldo de cada mês**, ver **para onde vai o dinheiro** (gastos por categoria) e definir **limites mensais de gasto** por categoria, com alertas quando o limite está perto de estourar.

Desenvolvido em **React Native com Expo (SDK 58)** e **TypeScript**. Os dados ficam salvos no próprio celular, em um banco **SQLite** local.

> **Documentação técnica:** a arquitetura, a navegação, o banco de dados, a validação e as decisões do projeto estão explicadas em detalhe na pasta [`docs/`](docs/README.md).

---

## Como executar

**Pré-requisitos**
- Node.js 20 ou superior
- Celular com o app **Expo Go** (Android ou iOS) na mesma rede Wi-Fi do computador
  *(ou um emulador Android configurado pelo Android Studio)*

```bash
git clone https://github.com/DvWill/ATVAM.git
cd ATVAM
npm install
npx expo start
```

Depois, escaneie o QR Code exibido no terminal:
- **Android:** pelo próprio app Expo Go
- **iOS:** pela câmera do iPhone

> O app foi feito para Android e iOS. A versão web não é suportada (o SQLite na web exige configuração extra).

**Outros comandos**

| Comando | O que faz |
|---|---|
| `npm run typecheck` | Verifica os tipos TypeScript |
| `npm run lint` | Analisa o código com ESLint |
| `npx expo start --clear` | Inicia limpando o cache (útil se algo "travar") |

---

## Requisitos da atividade e onde foram atendidos

| Requisito | Como foi atendido |
|---|---|
| **Interface gráfica** | 5 telas com layout pensado para celular: cartões, ícones por categoria, barras de progresso, botão flutuante (+), estados vazios e de carregamento. Componentes reutilizáveis em `src/components/` e paleta centralizada em `src/constants/theme.ts`. |
| **Navegação** | **Expo Router**: uma pilha (*Stack*) em `src/app/_layout.tsx` contendo um grupo de **abas inferiores** (`src/app/(tabs)/_layout.tsx`) e as telas de formulário. Há navegação com parâmetros (`/transacao?id=12`, `/orcamento/alimentacao`) e o botão voltar. |
| **Funcionalidades (mín. 3)** | 1. Cadastro, edição e exclusão de receitas/despesas · 2. Listagem com busca, filtro e agrupamento por dia · 3. Resumo mensal com saldo e gastos por categoria · 4. Orçamentos mensais por categoria com alertas |
| **Validação** | Regras em `src/utils/validation.ts`, com mensagens exibidas abaixo de cada campo (ver tabela abaixo). O banco também tem restrições `CHECK` como segunda camada de proteção. |
| **Persistência local** | **SQLite** via `expo-sqlite` (`src/database/`). Tabelas criadas por um sistema de migração com `PRAGMA user_version`. |

---

## Funcionalidades

### 1. Cadastro de transações (CRUD completo)
- Escolha entre **Despesa** ou **Receita**: cada tipo tem suas próprias categorias.
- Campos: valor, descrição, categoria, data (com atalhos "Hoje" e "Ontem") e observação opcional.
- Tocar em qualquer transação abre a edição; lá também é possível **excluir** (com confirmação).

### 2. Lista de transações
- Lançamentos do mês agrupados por dia ("Hoje", "Ontem", "Segunda, 23 de novembro"...).
- **Busca** pela descrição e **filtro** Todas / Receitas / Despesas.
- Totais de entradas e saídas do resultado filtrado.

### 3. Resumo do mês
- **Saldo do mês**, total de receitas e despesas, e saldo acumulado.
- **Despesas por categoria** com barras proporcionais e percentuais.
- Últimas 5 transações.
- Seletor de mês compartilhado entre todas as abas.

### 4. Orçamentos por categoria
- Defina um **limite mensal** para cada categoria de despesa.
- Barra de progresso colorida: verde (até 80%), laranja (80–100%) e vermelho (estourado).
- **Alertas no Resumo** quando uma categoria atinge 80% do limite ou o ultrapassa.

---

## Regras de validação

| Campo | Regras |
|---|---|
| **Valor** | Obrigatório · formato numérico (aceita `1.234,56`, `1234,56` ou `1234.56`) · maior que zero · máximo de R$ 1.000.000,00 |
| **Descrição** | Obrigatória · de 3 a 60 caracteres · precisa conter pelo menos uma letra · espaços extras são removidos |
| **Categoria** | Obrigatória · precisa pertencer ao tipo escolhido (receita ou despesa) |
| **Data** | Obrigatória · formato `dd/mm/aaaa` (máscara automática) · a data precisa existir (rejeita 31/02, por exemplo) · não pode ser futura · a partir de 01/01/2000 |
| **Observação** | Opcional · máximo de 200 caracteres |
| **Limite do orçamento** | Mesmas regras do campo Valor |

Os erros só aparecem depois da primeira tentativa de salvar e, a partir daí, são atualizados enquanto o usuário corrige os campos.

---

## Banco de dados

Os valores em dinheiro são guardados em **centavos (inteiros)**, para evitar erros de arredondamento. As datas ficam no formato `AAAA-MM-DD`, que pode ser ordenado e comparado como texto.

```sql
CREATE TABLE transactions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  type         TEXT    NOT NULL CHECK (type IN ('income', 'expense')),
  description  TEXT    NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  category     TEXT    NOT NULL,
  date         TEXT    NOT NULL,          -- AAAA-MM-DD
  notes        TEXT,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE budgets (
  category    TEXT    PRIMARY KEY NOT NULL,
  limit_cents INTEGER NOT NULL CHECK (limit_cents > 0)
);
```

---

## Estrutura do projeto

```
src/
├── app/                        # Telas (cada arquivo é uma rota do Expo Router)
│   ├── _layout.tsx             # Layout raiz: banco SQLite + pilha de navegação
│   ├── (tabs)/
│   │   ├── _layout.tsx         # Abas inferiores
│   │   ├── index.tsx           # Resumo
│   │   ├── transacoes.tsx      # Lista de transações
│   │   └── orcamentos.tsx      # Orçamentos
│   ├── transacao.tsx           # Formulário de nova/editar transação
│   └── orcamento/[categoria].tsx  # Formulário de limite por categoria
├── components/                 # Componentes visuais reutilizáveis
├── constants/                  # Cores, espaçamentos e categorias
├── context/MonthContext.tsx    # Mês selecionado, compartilhado entre as abas
├── database/                   # Esquema/migração e consultas SQL
├── hooks/useFocusData.ts       # Recarrega os dados quando a tela ganha foco
└── utils/                      # Formatação de dinheiro/data e validações
```

## Tecnologias

- [Expo SDK 58](https://docs.expo.dev/) · React Native 0.88 · React 19
- TypeScript
- [Expo Router](https://docs.expo.dev/router/introduction/) (navegação por arquivos)
- [expo-sqlite](https://docs.expo.dev/versions/v58.0.0/sdk/sqlite/) (banco de dados local)
- @expo/vector-icons (Ionicons)
