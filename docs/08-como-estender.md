# 8. Como estender o app

[← Componentes e tema](07-componentes-e-tema.md) · [Índice](README.md) · [Próximo: Decisões e limitações →](09-decisoes-e-limitacoes.md)

A melhor forma de entender a arquitetura é mexer nela. Cada receita abaixo passa por camadas diferentes, da mais fácil pra mais difícil.

## Receita 1: uma categoria nova

**Camadas envolvidas:** só `constants/`.

Abre `src/constants/categories.ts` e adiciona uma linha em `EXPENSE_CATEGORIES` (ou em `INCOME_CATEGORIES`, se for receita):

```ts
{ id: 'pets', name: 'Pets', icon: 'paw', color: '#A16207', type: 'expense' },
```

Pronto: ela aparece no formulário, na aba Orçamentos e no Resumo (quando tiver gasto). Não precisa mexer no banco, porque a coluna `category` guarda só o `id` como texto. E se você errar o nome do ícone, o TypeScript reclama: o tipo `IconName` conhece todos os nomes do Ionicons.

**Cuidado:** pode mudar o `name`, o `icon` e a `color` à vontade, mas **nunca mude o `id`** de uma categoria que já tem transação salva. As transações antigas passam a aparecer como "Sem categoria".

## Receita 2: uma tela nova

**Camadas envolvidas:** `app/`.

Cria o arquivo `src/app/sobre.tsx`:

```tsx
import { Text, View } from 'react-native';

import { colors, spacing } from '@/constants/theme';

export default function AboutScreen() {
  return (
    <View style={{ padding: spacing.lg }}>
      <Text style={{ color: colors.text }}>Meu Bolso, versão 1.0</Text>
    </View>
  );
}
```

A rota `/sobre` já existe, sem registrar nada. Pra abrir:

```tsx
router.push('/sobre');
// ou
<Link href="/sobre">Sobre</Link>
```

Pra dar um título no cabeçalho, adiciona uma linha na pilha do `src/app/_layout.tsx`:

```tsx
<Stack.Screen name="sobre" options={{ title: 'Sobre' }} />
```

**Quer que vire uma aba?** Coloca o arquivo em `src/app/(tabs)/sobre.tsx` e adiciona um `<Tabs.Screen name="sobre" options={{ title: 'Sobre' }} />` no `src/app/(tabs)/_layout.tsx`.

Lembra: a tela precisa ter um `export default`. É ele que o Expo Router renderiza.

## Receita 3: uma coluna nova no banco

**Camadas envolvidas:** `database/`, `utils/` e `app/`.

Digamos que você quer guardar a forma de pagamento. Primeiro, a migração.

**Nunca edita o bloco de criação da versão 0.** Quem já tem o app instalado nunca mais roda ele, então a coluna nova nunca seria criada pra essas pessoas. Cria um bloco novo em `src/database/schema.ts`:

```ts
const DATABASE_VERSION = 2; // era 1

// dentro de migrateDbIfNeeded, logo depois do bloco da versão 0:
if (currentVersion === 1) {
  await db.execAsync(`ALTER TABLE transactions ADD COLUMN payment_method TEXT`);
  currentVersion = 2;
}
```

Como funciona pra cada pessoa:

| Situação | `user_version` ao abrir | O que roda |
|---|---|---|
| Instalou agora | 0 | Bloco da versão 0 (cria tudo) e depois o da versão 1 (adiciona a coluna) |
| Já usava o app | 1 | Só o bloco novo. Os dados antigos ficam intactos |
| Já atualizou | 2 | Nada |

Depois é seguir a coluna pelas camadas:

1. **`src/database/transactions.ts`:** adiciona `payment_method` em `COLUMNS`, o campo nos tipos `TransactionRow` e `Transaction`, a tradução no `fromRow`, e o valor no `INSERT` e no `UPDATE`.
2. **`src/utils/validation.ts`:** adiciona o campo em `TransactionFormValues` e `ValidTransaction`, com a regra dele dentro de `validateTransaction`.
3. **`src/app/transacao.tsx`:** adiciona o campo no formulário (um `SegmentedControl` com Pix / Cartão / Dinheiro cairia bem) e no `emptyForm()`.

O `npm run typecheck` vai apontar cada lugar que ficou faltando. Deixa o TypeScript ser o seu guia.

## Instalando uma biblioteca nova

Sempre com:

```bash
npx expo install <pacote>
```

E não com `npm install`: o `expo install` escolhe a versão compatível com o SDK 58.

**Atenção:** o Expo Go só traz as bibliotecas nativas que já vêm com ele. Se você instalar uma biblioteca com código nativo que não tá no Expo Go, o app para de rodar por lá, e aí você vai precisar de um *development build* (`npx expo run:android`, que exige o Android Studio).

## Antes de dizer que terminou

```bash
npm run typecheck   # tipos certinhos?
npm run lint        # código limpo?
```

Os dois têm que passar sem erro. Depois, testa no celular o caminho que você mexeu.

### Checklist do desafio

- [ ] Adicionei a categoria Pets
- [ ] Criei a tela Sobre e abri ela por um link
- [ ] Fiz a migração pra versão 2 sem perder os dados que já existiam
- [ ] `typecheck` e `lint` passando sem erro
