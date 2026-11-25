# 9. Decisões e limitações

[← Como estender](08-como-estender.md) · [Índice](README.md)

## Por que a gente escolheu cada coisa

| Decisão | Em vez de | Por quê |
|---|---|---|
| **Expo** | React Native "puro" (CLI) | Roda no celular pelo Expo Go, sem instalar Android Studio nem Xcode. O setup fica muito mais simples pra uma turma inteira |
| **Expo Router** | Configurar o React Navigation na mão | As rotas saem da estrutura de pastas, sem código de registro. Parâmetros e links já vêm prontos (e por baixo ele usa o próprio React Navigation) |
| **SQLite** | AsyncStorage (chave-valor) | O app precisa somar, agrupar e filtrar (`SUM`, `GROUP BY`, `LIKE`). Com AsyncStorage teria que carregar tudo na memória e fazer isso em JavaScript. E o SQLite ainda dá o `CHECK` de brinde |
| **Banco local** | Backend na nuvem | A atividade pede persistência local. Sem servidor, o app funciona offline e não precisa de login |
| **Centavos inteiros** | Número decimal (`REAL`) | Evita erro de arredondamento: `0.1 + 0.2` dá `0.30000000000000004` em ponto flutuante |
| **Data como texto ISO** | Timestamp numérico | Dá pra ler direto no banco, ordenar como texto e montar o intervalo do mês sem se preocupar com fuso horário |
| **Context + recarregar do banco** | Redux, Zustand e afins | O único estado global é o mês selecionado. O resto vem sempre do banco, então não tem cache pra ficar desatualizado |
| **Validação escrita na mão** | Bibliotecas tipo Zod ou Yup | As regras são poucas e simples. Assim não entra dependência extra e as mensagens já nascem em português |
| **Categorias no código** | Uma tabela de categorias | São fixas e têm ícone e cor. No código o TypeScript confere tudo, e não precisa de tela pra gerenciar categoria |
| **Um limite por categoria, sem mês** | Limite diferente pra cada mês | Mais simples de usar e de implementar. Na prática, orçamento costuma ser o mesmo todo mês |

## Limitações conhecidas

O que o app **ainda não faz**, ou faz de um jeito limitado:

| Limitação | Detalhe |
|---|---|
| Não roda na web | O `expo-sqlite` na web precisa de configuração extra que não foi feita. Só Android e iOS |
| Sem backup | Os dados ficam só no celular. Desinstalar o app (ou o Expo Go) apaga tudo, e não tem sincronização entre aparelhos |
| Sem testes automatizados | As funções de `src/utils/` são puras e fáceis de testar, mas os testes ainda não foram escritos |
| Categorias fixas | Pra criar ou mudar categoria, só editando o código ([receita 1](08-como-estender.md#receita-1-uma-categoria-nova)) |
| Limite igual pra todo mês | Não dá pra ter um orçamento maior em dezembro, por exemplo |
| Sem lançamento futuro | Não dá pra registrar uma conta agendada pro mês que vem (a validação bloqueia data futura) |
| Sem transação recorrente | O aluguel precisa ser lançado todo mês na mão |
| Só tema claro e modo retrato | O `app.json` fixa `userInterfaceStyle: "light"` e `orientation: "portrait"` |
| Só português e só real | Os textos e o `formatMoney` (`R$ 1.234,56`) são fixos |
| `1.234` é lido como milhar | Com ponto e 3 dígitos depois, o valor vira R$ 1.234,00, não R$ 1,23 (ver [Validação](06-validacao.md#parsemoney-texto--centavos-srcutilsmoneyts)) |

## Ideias pros próximos passos

- Testes unitários com Jest para `validation.ts`, `money.ts` e `date.ts`.
- Exportar os dados em CSV, pra ter um backup.
- Modo escuro, aproveitando que as cores já estão centralizadas em `theme.ts`.
- Transações recorrentes (aluguel, assinaturas).
- Gráfico de evolução do saldo mês a mês.
