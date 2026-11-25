# 7. Componentes e tema

[← Validação](06-validacao.md) · [Índice](README.md) · [Próximo: Como estender →](08-como-estender.md)

As telas são montadas com 11 peças de `src/components/`, como um Lego. E todas puxam cor e espaçamento de um lugar só: `src/constants/theme.ts`.

## O tema

```ts
// src/constants/theme.ts (resumido)
export const colors = {
  primary: '#0E7C66',      // verde da marca
  primaryDark: '#0A5C4C',  // botão pressionado
  primaryLight: '#E3F4EF', // fundos suaves
  background: '#F3F5F7',
  card: '#FFFFFF',
  text: '#1D2733',
  textMuted: '#6B7684',
  income: '#15803D',       // receitas
  expense: '#DC2626',      // despesas e erros
  warning: '#B45309',      // alerta de orçamento
  // ...
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const radius  = { sm: 8, md: 12, lg: 16, pill: 999 };
```

**Regra:** nenhum componente escreve `'#DC2626'` na mão. É sempre `colors.expense`. Quer mudar a cara do app inteiro? Muda uma linha aqui.

A cor de fundo do ícone adaptativo do Android, no `app.json`, é a mesma `primaryLight` (`#E3F4EF`), pra combinar com o tema.

## As categorias

`src/constants/categories.ts` define as categorias e funções pra achar cada uma:

| Tipo | Categorias |
|---|---|
| Despesa (`EXPENSE_CATEGORIES`) | Alimentação, Transporte, Moradia, Saúde, Educação, Lazer, Compras, Contas, Outros |
| Receita (`INCOME_CATEGORIES`) | Salário, Freelance, Investimentos, Presente, Outras receitas |

Cada categoria é um objeto `{ id, name, icon, color, type }`. As funções:

| Função | O que faz |
|---|---|
| `getCategories(type)` | Lista as categorias de receita ou de despesa |
| `findCategory(id)` | Acha pelo id, ou `undefined` se não existir |
| `getCategory(id)` | Acha pelo id, ou devolve uma categoria "Sem categoria" (nunca quebra a tela) |
| `isValidCategory(id, type)` | Confere se o id existe **e** é do tipo certo. Usada na validação |

## As peças

| Componente | O que é | Props principais |
|---|---|---|
| `Button` | Botão com 3 variantes: `primary`, `danger` e `outline` | `title`, `onPress`, `variant`, `icon`, `loading`, `disabled` |
| `TextField` | Campo de texto com rótulo, mensagem de erro e dica | `label`, `error`, `hint`, `prefix`, `footer` + tudo do `TextInput` |
| `SegmentedControl` | Seletor em botões lado a lado (Despesa / Receita, Todas / Receitas / Despesas) | `options`, `value`, `onChange` |
| `CategoryPicker` | Grade de categorias pra escolher | `categories`, `value`, `onChange`, `error` |
| `CategoryIcon` | Bolinha colorida com o ícone da categoria | `category`, `size` |
| `Card` | Caixa branca com título e um canto direito opcionais | `title`, `right`, `children`, `style` |
| `ProgressBar` | Barra de progresso, mais a função `budgetColor` | `progress` (0 a 1), `color`, `height` |
| `TransactionItem` | Uma linha da lista de transações | `transaction`, `onPress`, `showDate` |
| `MonthSelector` | As setinhas de troca de mês | Nenhuma: lê direto do `MonthContext` |
| `Fab` | O botão + flutuante (*Floating Action Button*) | `onPress`, `label` |
| `EmptyState` | Aviso de "nada por aqui" ou de erro | `icon`, `title`, `message` |

## Padrões que vale copiar

**Estender as props nativas.** O `TextField` declara `interface TextFieldProps extends TextInputProps` e repassa o resto com `...inputProps`. Resultado: ele aceita `keyboardType`, `maxLength`, `multiline` e qualquer outra prop do `TextInput` sem precisar declarar uma por uma.

```tsx
export function TextField({ label, error, hint, prefix, footer, style, ...inputProps }: TextFieldProps) {
  // ...
  <TextInput style={[styles.input, style]} accessibilityLabel={label} {...inputProps} />
```

**Componente genérico.** O `SegmentedControl<T extends string>` descobre o tipo pelas opções. Se elas são `'income'` e `'expense'`, o `onChange` já recebe esse tipo, sem gambiarra nem `as`.

**Botão que se protege de toque duplo.** Com `loading={true}`, o `Button` troca o texto por um `ActivityIndicator` e fica desabilitado. Assim ninguém salva a mesma transação duas vezes tocando rápido.

**Uma função decide a cor do orçamento.** A `budgetColor(progress)`, em `ProgressBar.tsx`, é usada tanto na barra quanto no texto de status:

| Gasto / limite | Cor |
|---|---|
| Menos de 80% | Verde (`colors.income`) |
| De 80% a 100% | Laranja (`colors.warning`) |
| Mais de 100% | Vermelho (`colors.expense`) |

**Cor com transparência sem biblioteca.** O `CategoryIcon` e o `CategoryPicker` fazem o fundo suave juntando `22` no fim da cor hexadecimal (`#F97316` + `22` = mais ou menos 13% de opacidade).

## Acessibilidade

Os componentes já vêm com as informações pro leitor de tela (TalkBack no Android, VoiceOver no iOS):

| Onde | O que tem |
|---|---|
| `Button`, `Fab`, `TransactionItem` | `accessibilityRole="button"` e um `accessibilityLabel` descritivo (ex.: "Almoço, despesa de R$ 25,90") |
| `CategoryPicker` | Funciona como um grupo de opções: `radiogroup` com itens `radio` e estado `checked` |
| `SegmentedControl` | Funciona como abas: `tablist` com itens `tab` e estado `selected` |
| `TextField` | O rótulo vira `accessibilityLabel`, e a mensagem de erro é anunciada quando aparece (`accessibilityLiveRegion`) |
| `MonthSelector` | "Mês anterior" e "Próximo mês", com estado `disabled` quando não dá pra avançar |
