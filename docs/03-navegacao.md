# 3. Navegação com Expo Router

[← Arquitetura](02-arquitetura.md) · [Índice](README.md) · [Próximo: Banco de dados →](04-banco-de-dados.md)

## A pasta é o mapa

No Expo Router a gente não registra rota em lugar nenhum: **criou o arquivo em `src/app/`, a tela existe**. O nome do arquivo vira o endereço, igualzinho a um site.

Tem 4 convenções pra decorar:

| Convenção | Exemplo no projeto | O que significa |
|---|---|---|
| `_layout.tsx` | `src/app/_layout.tsx` | Não é tela: é o "molde" que envolve as telas da pasta e define o tipo de navegação (pilha, abas...) |
| `index.tsx` | `(tabs)/index.tsx` | A tela principal da pasta. Aqui vira `/`, a primeira coisa que abre |
| `(nome)/` | `(tabs)/` | Grupo: organiza arquivos sem aparecer no endereço. `(tabs)/transacoes.tsx` vira `/transacoes`, e não `/tabs/transacoes` |
| `[nome].tsx` | `orcamento/[categoria].tsx` | Rota dinâmica: o pedaço da URL vira parâmetro. `/orcamento/lazer` entrega `categoria = "lazer"` |

## As rotas do app

| Arquivo | Rota | Tela | Tipo |
|---|---|---|---|
| `(tabs)/index.tsx` | `/` | Resumo | Aba |
| `(tabs)/transacoes.tsx` | `/transacoes` | Lista de transações | Aba |
| `(tabs)/orcamentos.tsx` | `/orcamentos` | Orçamentos | Aba |
| `transacao.tsx` | `/transacao` ou `/transacao?id=12` | Nova transação ou edição | Empilhada |
| `orcamento/[categoria].tsx` | `/orcamento/alimentacao` | Limite de uma categoria | Empilhada |

## Como as telas se organizam

O app é uma **pilha** (Stack) com dois andares: embaixo ficam as abas, e os formulários são empilhados por cima quando abrem. Voltar = tirar o de cima da pilha.

```text
Stack  (src/app/_layout.tsx)
│
├── (tabs)  →  Tabs  (src/app/(tabs)/_layout.tsx)       ← andar de baixo
│   ├── index.tsx         Resumo
│   ├── transacoes.tsx    Transações
│   └── orcamentos.tsx    Orçamentos
│
├── transacao.tsx                 ← empilhada por cima das abas
└── orcamento/[categoria].tsx     ← empilhada por cima das abas
```

### O layout raiz monta a pilha

```tsx
// src/app/_layout.tsx (resumido)
export default function RootLayout() {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDbIfNeeded}>
      <MonthProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="transacao" options={{ title: 'Transação' }} />
          <Stack.Screen name="orcamento/[categoria]" options={{ title: 'Orçamento' }} />
        </Stack>
      </MonthProvider>
    </SQLiteProvider>
  );
}
```

Repara que o banco (`SQLiteProvider`) e o mês selecionado (`MonthProvider`) **embrulham a pilha inteira**. É isso que deixa qualquer tela usar os dois sem passar nada por props.

O grupo `(tabs)` tem `headerShown: false` porque as abas já têm o próprio cabeçalho. Sem isso apareceriam dois cabeçalhos empilhados.

### O layout das abas

```tsx
// src/app/(tabs)/_layout.tsx (resumido)
import { Tabs } from 'expo-router/js-tabs';

<Tabs>
  <Tabs.Screen name="index" options={{ title: 'Resumo', headerTitle: 'Meu Bolso' }} />
  <Tabs.Screen name="transacoes" options={{ title: 'Transações' }} />
  <Tabs.Screen name="orcamentos" options={{ title: 'Orçamentos' }} />
</Tabs>
```

O `name` é o nome do arquivo sem o `.tsx`. No código completo cada aba ganha um `tabBarIcon` com Ionicons: ícone cheio quando a aba tá ativa (`pie-chart`) e só o contorno quando não tá (`pie-chart-outline`).

## Indo de uma tela pra outra

| Quero... | Código |
|---|---|
| Abrir o formulário vazio | `router.push('/transacao')` |
| Abrir o formulário editando a transação 12 | `router.push({ pathname: '/transacao', params: { id: '12' } })` |
| Abrir o limite de uma categoria | `router.push({ pathname: '/orcamento/[categoria]', params: { categoria: 'lazer' } })` |
| Um link de texto | `<Link href="/transacoes">Ver todas</Link>` |
| Voltar | `router.back()` |

O `router` vem do hook `useRouter()`, e o `Link` é importado de `expo-router`.

## Lendo o parâmetro do outro lado

```tsx
// src/app/transacao.tsx
const params = useLocalSearchParams<{ id?: string }>();

// Parâmetro de URL é SEMPRE texto: só aceitamos número inteiro positivo
const transactionId = params.id && /^\d+$/.test(params.id) ? Number(params.id) : null;
const isEditing = params.id !== undefined;
```

**Uma tela, dois modos.** Sem `id`, o formulário cadastra. Com `id`, carrega a transação do banco e edita. Se o `id` vier zoado (tipo `?id=abc`) ou a transação não existir mais, a tela mostra "Transação não encontrada" em vez de quebrar.

Até o título do cabeçalho muda conforme o modo, com um `<Stack.Screen>` dentro da própria tela:

```tsx
const title = isEditing ? 'Editar transação' : 'Nova transação';
// ...
<Stack.Screen options={{ title }} />
```

A tela de orçamento faz a mesma coisa com o parâmetro `categoria`: se ele não for uma categoria de **despesa** que existe, mostra "Categoria inválida".
