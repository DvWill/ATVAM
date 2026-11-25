# 6. Validação

[← Estado e fluxo de dados](05-estado-e-fluxo-de-dados.md) · [Índice](README.md) · [Próximo: Componentes e tema →](07-componentes-e-tema.md)

Dado zoado tem que passar por três barreiras antes de chegar no banco. A principal mora em `src/utils/validation.ts`, separada das telas, então dá pra reaproveitar e testar sem abrir o app.

## As 3 camadas

| Camada | Onde | O que faz |
|---|---|---|
| **1. Enquanto digita** | Props dos campos nas telas | Teclado numérico (`keyboardType="decimal-pad"`), limite de caracteres (`maxLength`) e máscara de data: digitou `25112026`, aparece `25/11/2026` |
| **2. Ao salvar** | `validateTransaction` e `validateBudget` | Confere cada regra, monta as mensagens de erro e converte o texto em dado limpo |
| **3. No banco** | `CHECK` nas tabelas | Última linha de defesa, caso algum bug passe pelas outras (ver [Banco de dados](04-banco-de-dados.md)) |

## O truque do tipo de retorno

A função recebe o formulário do jeito que foi digitado (tudo `string`) e devolve **uma de duas coisas**:

```ts
type ValidationResult<T, K extends string> =
  | { ok: true; value: T }                              // dado limpo e convertido
  | { ok: false; errors: Partial<Record<K, string>> };  // uma mensagem por campo
```

Isso é uma *union discriminada*: o TypeScript só deixa acessar `value` depois de checar que `ok` é `true`. Ou seja, **é impossível mandar dado não validado pro banco sem o editor reclamar**, porque `createTransaction` só aceita o tipo `ValidTransaction`.

Entra e sai assim:

| | Tipo | Exemplo |
|---|---|---|
| **Entra** | `TransactionFormValues` | `{ type: 'expense', amount: '1.234,56', description: '  Almoço   no  bandejão ', category: 'alimentacao', date: '25/11/2026', notes: '' }` |
| **Sai** | `ValidTransaction` | `{ type: 'expense', amountCents: 123456, description: 'Almoço no bandejão', category: 'alimentacao', date: '2026-11-25', notes: null }` |

Repara que a validação também **limpa** o dado: tira espaços sobrando, converte o valor pra centavos, a data pra ISO, e observação vazia vira `null`.

## Como a tela usa

```tsx
// src/app/transacao.tsx (resumido)
const validation = useMemo(() => validateTransaction(values), [values]);
const errors = submitted && !validation.ok ? validation.errors : {};

async function handleSave() {
  setSubmitted(true);
  if (!validation.ok) return;                     // mostra os erros e para aqui
  await createTransaction(db, validation.value);  // só dado limpo chega no banco
  router.back();
}
```

**Sacada de UX:** a validação roda a cada tecla, mas os erros **só aparecem depois da primeira tentativa de salvar** (a flag `submitted`). Assim o app não fica gritando "campo obrigatório!" enquanto a pessoa ainda tá digitando. Depois da primeira tentativa, os erros somem sozinhos conforme ela corrige.

Quando tem erro, aparece também uma faixa no topo: "Corrija os campos destacados para salvar."

## As regras e as mensagens

| Campo | Regra | Mensagem |
|---|---|---|
| **Valor** | Obrigatório | Informe o valor. |
| | Formato válido (ver abaixo) | Valor inválido. Use o formato 1.234,56. |
| | Maior que zero | O valor deve ser maior que zero. |
| | No máximo R$ 1.000.000,00 | O valor máximo é R$ 1.000.000,00. |
| **Descrição** | Obrigatória | Informe uma descrição. |
| | Pelo menos 3 caracteres (depois de limpar os espaços) | A descrição deve ter pelo menos 3 caracteres. |
| | No máximo 60 caracteres | A descrição pode ter no máximo 60 caracteres. |
| | Pelo menos uma letra | A descrição deve conter pelo menos uma letra. |
| **Categoria** | Precisa existir e ser do tipo certo (receita ou despesa) | Selecione uma categoria. |
| **Data** | Obrigatória | Informe a data. |
| | Formato dd/mm/aaaa | Use o formato dd/mm/aaaa. |
| | Precisa existir (31/02 não vale) | Essa data não existe. |
| | A partir de 01/01/2000 | A data deve ser a partir de 01/01/2000. |
| | Não pode ser futura | A data não pode estar no futuro. |
| **Observação** | Opcional, no máximo 200 caracteres | A observação pode ter no máximo 200 caracteres. |
| **Limite do orçamento** | As mesmas regras do Valor | As mesmas mensagens do Valor |

Os limites ficam em constantes exportadas no topo do arquivo, então mudar uma regra é mudar um número:

```ts
export const DESCRIPTION_MIN = 3;
export const DESCRIPTION_MAX = 60;
export const NOTES_MAX = 200;
export const MAX_AMOUNT_CENTS = 100_000_000; // R$ 1.000.000,00
```

As telas usam essas mesmas constantes no `maxLength` dos campos e no contador de caracteres (`12/60`), então a regra e a interface nunca ficam diferentes.

## Por dentro das funções auxiliares

### `parseMoney`: texto → centavos (`src/utils/money.ts`)

Aceita os jeitos mais comuns de digitar dinheiro no Brasil, usando três expressões regulares. Também ignora o `R$` e os espaços:

| Digitado | Resultado (centavos) | Lido como |
|---|---|---|
| `1.234,56` | `123456` | Milhar com ponto, decimal com vírgula |
| `1234,56` | `123456` | Decimal com vírgula |
| `1234.56` | `123456` | Decimal com ponto (alguns teclados só têm ponto) |
| `12,5` | `1250` | R$ 12,50 |
| `R$ 12,50` | `1250` | O `R$` é ignorado |
| `1234` | `123400` | Inteiro |
| `12,345` | `null` | Inválido: 3 casas depois da vírgula |
| `1,234.56` | `null` | Inválido: formato americano não é aceito |

**Pegadinha conhecida:** com ponto e exatamente 3 dígitos depois, vale a leitura de milhar. Então `1.234` vira R$ 1.234,00, mas `1.5` vira R$ 1,50.

### `brToISO`: como saber se uma data existe? (`src/utils/date.ts`)

A função cria um `Date` com o dia, mês e ano digitados e confere se ele "transbordou". O JavaScript transforma 31/02 em 03/03 sem reclamar, então se o dia ou o mês mudou, a data não existe:

```ts
const date = new Date(y, m - 1, d);
if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
  return null; // 31/02 virou 03/03: data inválida
}
```

De quebra, isso também resolve ano bissexto: 29/02/2024 passa, 29/02/2025 não.

### `maskDateInput`: a máscara de data

Tira tudo que não é número, corta em 8 dígitos e coloca as barras nos lugares certos: `2`, `25`, `25/1`, `25/11`, `25/11/2`... até `25/11/2026`.

## Dá pra testar sem o app

`validateTransaction` recebe a data de "hoje" como segundo parâmetro opcional:

```ts
export function validateTransaction(values: TransactionFormValues, today: string = todayISO())
```

Na tela ela é chamada sem esse parâmetro. Mas num teste dá pra fixar o "hoje" e checar a regra de data futura sem depender do relógio do computador. O projeto ainda não tem testes automatizados (ver [Decisões e limitações](09-decisoes-e-limitacoes.md)), mas a função já tá pronta pra eles.
