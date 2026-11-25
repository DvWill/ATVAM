# 5. Estado e fluxo de dados

[← Banco de dados](04-banco-de-dados.md) · [Índice](README.md) · [Próximo: Validação →](06-validacao.md)

O app não usa Redux, Zustand nem nada do tipo. São só três ideias:

1. **O banco é a fonte da verdade.** Nenhuma tela guarda cópia permanente dos dados.
2. **O mês selecionado mora num Context**, porque as três abas precisam dele.
3. **Cada tela recarrega do banco quando aparece.**

## O caminho de um "Salvar"

Olha o que acontece desde o toque em "Adicionar transação" até o Resumo mostrar o número novo:

```text
 transacao.tsx          toque em "Adicionar transação"
      │                 setSubmitted(true)
      ▼
 validation.ts          validateTransaction(values)
      │
   ok? ──── não ───▶    mostra os erros embaixo dos campos e para aqui
      │
      │ sim
      ▼
 database/              createTransaction(db, validation.value)
 transactions.ts        INSERT INTO transactions (...) VALUES (?, ?, ?, ?, ?, ?)
      │
      ▼
 expo-router            router.back()
      │                 o formulário sai do topo da pilha
      ▼
 useFocusData           a tela de baixo (ex.: Resumo) ganha foco
      │                 e roda a função load() de novo
      ▼
 Resumo                 redesenha com os números atualizados
```

**Sacada:** o formulário nunca avisa o Resumo que algo mudou. Quando a tela volta pro topo da pilha, ela mesma busca os dados de novo. Isso deixa as telas independentes: nenhuma precisa saber que a outra existe.

## O mês selecionado: `MonthContext`

O arquivo `src/context/MonthContext.tsx` cria um Context com o mês atual e as funções pra navegar entre meses. Como o `MonthProvider` embrulha o app inteiro (lá no `_layout.tsx` raiz), qualquer tela acessa assim:

```tsx
const { month, goToPreviousMonth, goToNextMonth, canGoNext } = useSelectedMonth();
```

| Valor | Tipo | O que é |
|---|---|---|
| `month` | `{ year: number; month: number }` | O mês que tá sendo visto (`month` vai de 1 a 12) |
| `goToPreviousMonth()` | função | Volta um mês |
| `goToNextMonth()` | função | Avança um mês (se puder) |
| `canGoNext` | `boolean` | `false` quando já tá no mês atual, porque não existe lançamento no futuro |

Resultado: trocou o mês numa aba, trocou em todas.

Dois detalhes do código:

- O valor do Context é montado com `useMemo`, pra não criar um objeto novo a cada render (o que faria todas as telas renderizarem de novo à toa).
- O `useSelectedMonth()` lança um erro claro se for usado fora do `MonthProvider`, em vez de devolver `undefined` e quebrar lá na frente.

## Recarregar quando a tela aparece: `useFocusData`

**O problema:** você salva no formulário e volta pro Resumo. Só que o Resumo nunca saiu da memória (ele tava embaixo na pilha), então um `useEffect` comum não roda de novo e os números ficam velhos.

**A solução** é o hook `src/hooks/useFocusData.ts`. Ele usa o `useFocusEffect` do Expo Router pra rodar a consulta **toda vez que a tela ganha foco**:

```tsx
// dentro de uma tela
const db = useSQLiteContext();
const { month } = useSelectedMonth();

const load = useCallback(
  () => listTransactions(db, month, { search, type }),
  [db, month, search, type],
);
const { data, error } = useFocusData(load);

if (error) return <EmptyState icon="alert-circle" title="Erro ao carregar" message={error.message} />;
if (!data) return <ActivityIndicator />; // ainda carregando
// ...daqui pra baixo, data tá garantido
```

O hook devolve `{ data, error }`:

| Estado | `data` | `error` | O que a tela mostra |
|---|---|---|---|
| Carregando | `null` | `null` | Um `ActivityIndicator` (a bolinha girando) |
| Deu certo | o resultado | `null` | A tela normal |
| Deu erro | o último resultado (ou `null`) | o `Error` | Um `EmptyState` com a mensagem |

Três detalhes que fazem diferença:

- **O `useCallback` é obrigatório.** Sem ele, o `load` vira uma função nova a cada render e a consulta roda em loop infinito. Tem um aviso disso no comentário do hook.
- **Trocar mês, busca ou filtro recarrega sozinho**, porque eles estão nas dependências do `useCallback`: o `load` muda, e o hook roda de novo.
- **Resposta atrasada é descartada.** O hook tem uma flag `active`: se a tela perder o foco (ou o filtro mudar) antes da consulta terminar, o resultado velho é ignorado. Isso evita, por exemplo, a busca por "mer" sobrescrever o resultado de "mercado".

## Várias consultas ao mesmo tempo

O Resumo precisa de 4 coisas do banco. Em vez de uma esperar a outra, elas rodam em paralelo com `Promise.all`:

```tsx
// src/app/(tabs)/index.tsx
const [summary, byCategory, recent, budgets] = await Promise.all([
  getMonthSummary(db, month),
  getExpensesByCategory(db, month),
  listTransactions(db, month, { limit: 5 }),
  listBudgets(db),
]);
```

Com esses dados, a própria tela calcula os alertas de orçamento: para cada limite definido, divide o gasto da categoria pelo limite e mostra um alerta quando o resultado chega a 80% (`progress >= 0.8`). Os alertas aparecem do mais estourado pro menos.

## Estado local dos formulários

Os formulários guardam o que o usuário digitou num `useState` comum, tudo como texto (`TransactionFormValues`). Só na hora de salvar é que o texto é validado e convertido (centavos, data ISO). Isso é explicado no capítulo de [Validação](06-validacao.md).

Um detalhe do formulário de transação: trocar o tipo entre Despesa e Receita **limpa a categoria escolhida**, porque cada tipo tem as suas categorias:

```tsx
if (field === 'type' && value !== prev.type) next.category = null;
```
