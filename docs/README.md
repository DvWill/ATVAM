# Documentação técnica do Meu Bolso

E aí! Essa pasta explica **como o Meu Bolso foi construído por dentro**: as tecnologias, a arquitetura, a navegação, o banco de dados e as decisões que a gente tomou no caminho.

Se você só quer rodar o app e saber o que ele faz, o [README principal](../README.md) já resolve. Aqui o papo é técnico.

## O projeto em 30 segundos

- **O que é:** um app mobile de controle financeiro pessoal (receitas, despesas e limite de gasto por categoria).
- **Feito com:** React Native + Expo SDK 58 + TypeScript.
- **Navegação:** Expo Router (cada arquivo em `src/app/` vira uma tela).
- **Dados:** SQLite local, via `expo-sqlite`. Não tem servidor nem login: tudo fica no celular.
- **Arquitetura:** telas no topo, e embaixo delas camadas separadas pra visual, estado, regras e acesso a dados. Só a camada `src/database/` escreve SQL.

## Capítulos

Dá pra ler na ordem ou pular direto pro que interessa:

| # | Capítulo | O que tem lá |
|---|---|---|
| 1 | [Stack e setup](01-stack-e-setup.md) | Tecnologias, como rodar e como o projeto foi montado a partir do template do Expo |
| 2 | [Arquitetura](02-arquitetura.md) | As camadas, quem pode importar quem e a estrutura de pastas |
| 3 | [Navegação](03-navegacao.md) | Expo Router: rotas por arquivo, pilha, abas e parâmetros |
| 4 | [Banco de dados](04-banco-de-dados.md) | Tabelas, migração, consultas e por que dinheiro é guardado em centavos |
| 5 | [Estado e fluxo de dados](05-estado-e-fluxo-de-dados.md) | Context do mês, o hook `useFocusData` e o caminho de um "Salvar" |
| 6 | [Validação](06-validacao.md) | As 3 camadas de validação e todas as regras dos formulários |
| 7 | [Componentes e tema](07-componentes-e-tema.md) | As 11 peças reutilizáveis e o tema centralizado |
| 8 | [Como estender](08-como-estender.md) | Receitas pra adicionar categoria, tela ou coluna no banco |
| 9 | [Decisões e limitações](09-decisoes-e-limitacoes.md) | Por que a gente escolheu cada coisa e o que o app ainda não faz |

## Convenções desta documentação

- Todo caminho de arquivo parte da raiz do repositório (onde ficam o `package.json` e o `app.json`).
- Os trechos de código são **resumidos** pra caber no texto. A versão completa tá sempre no arquivo citado.
- Os nomes no código (variáveis, funções, tabelas) estão em inglês. Os textos que aparecem na tela estão em português.
