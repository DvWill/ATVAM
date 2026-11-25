# 1. Stack e setup

[← Índice](README.md) · [Próximo: Arquitetura →](02-arquitetura.md)

## A stack

São 7 peças principais. As versões saem direto do `package.json`:

| Tecnologia | Versão | Pra que serve | Onde aparece |
|---|---|---|---|
| **React Native** | 0.88 | Fazer app nativo de Android e iOS escrevendo React | Em toda tela: `View`, `Text`, `Pressable`, `ScrollView`... |
| **React** | 19.3 | A base dos componentes e dos hooks (`useState`, `useEffect`, `useCallback`...) | Em todo arquivo `.tsx` |
| **Expo** | SDK 58 | O kit em volta do React Native: roda no Expo Go sem precisar de Android Studio e traz módulos prontos | `package.json`, `app.json` |
| **TypeScript** | 6.0 | JavaScript com tipos, em modo `strict`. O editor acusa o erro antes de rodar | Todo `.ts`/`.tsx`, `tsconfig.json` |
| **Expo Router** | 58 | Navegação por arquivos: cada arquivo em `src/app/` vira uma tela | `src/app/` |
| **expo-sqlite** | 58 | Um banco SQL de verdade, rodando dentro do celular | `src/database/`, `src/app/_layout.tsx` |
| **ESLint** | 9 | Caça erros e más práticas no código (config padrão do Expo) | `eslint.config.js` |

Ainda tem uns coadjuvantes: `@expo/vector-icons` (os ícones Ionicons), e `react-native-screens`, `react-native-safe-area-context`, `expo-linking` e `expo-constants`, que o Expo Router precisa pra funcionar.

## Rodando o projeto

**Pré-requisitos:**

- Node.js 20 ou mais novo (`node -v` pra conferir)
- App **Expo Go** no celular (Android ou iOS), **no mesmo Wi-Fi** do computador. Ou um emulador Android pelo Android Studio.

```bash
git clone https://github.com/DvWill/ATVAM.git
cd ATVAM
npm install          # só na primeira vez
npx expo start       # sobe o servidor e mostra um QR Code
```

Escaneia o QR Code: no Android, pelo próprio Expo Go; no iPhone, pela câmera. Deixa o terminal aberto enquanto usa o app (`Ctrl + C` desliga).

> A versão web **não é suportada**: o SQLite na web exige uma configuração extra que a gente não fez.

### Scripts disponíveis

| Comando | O que faz |
|---|---|
| `npm start` | Mesmo que `npx expo start` |
| `npm run android` | Sobe o servidor e já abre no emulador Android |
| `npm run ios` | Sobe o servidor e já abre no simulador iOS (só no Mac) |
| `npm run typecheck` | Roda o TypeScript sem gerar arquivo (`tsc --noEmit`): acusa erro de tipo |
| `npm run lint` | Roda o ESLint em todo o projeto |
| `npx expo start --clear` | Sobe limpando o cache do bundler (resolve 90% dos "travou do nada") |
| `npx expo start --tunnel` | Usa um túnel em vez da rede local. Salva a pátria em rede de faculdade que bloqueia o Expo |

## Como o projeto foi montado

O projeto nasceu do template `blank-typescript` do Expo, que vem só com um `App.tsx` e um `index.ts`. Dá pra conferir no primeiro commit do repositório (o "Initial commit" do `git log`). Comparando aquele commit com o código atual, o caminho foi este:

**1. Criar o projeto a partir do template**

```bash
npx create-expo-app@latest meu-bolso --template blank-typescript
```

**2. Instalar as bibliotecas com `npx expo install`** (e não `npm install`). O `expo install` escolhe a versão de cada pacote que é compatível com o SDK do projeto:

```bash
npx expo install expo-router expo-linking expo-constants react-native-safe-area-context \
  react-native-screens expo-sqlite expo-font @expo/vector-icons react-dom
```

**3. Trocar a porta de entrada do app.** No `package.json`, o `main` passou a ser o Expo Router, e o `App.tsx` e o `index.ts` foram apagados. A partir daí o app começa por `src/app/_layout.tsx`:

```json
"main": "expo-router/entry"
```

**4. Configurar o `app.json`:** nome de exibição, um `scheme` (o "endereço" do app, que o Expo Router usa pra links) e os plugins nativos:

```json
"name": "Meu Bolso",
"scheme": "meubolso",
"plugins": ["expo-router", "expo-sqlite", "expo-font"]
```

**5. Criar o atalho `@/` no `tsconfig.json`.** Assim a gente escreve `import { colors } from '@/constants/theme'` em vez de `'../../constants/theme'`:

```json
"paths": { "@/*": ["./src/*"] }
```

**6. Ligar o ESLint e os scripts de qualidade.** Rodar `npx expo lint` pela primeira vez cria o `eslint.config.js`. Depois foi só adicionar no `package.json`:

```json
"typecheck": "tsc --noEmit",
"lint": "eslint ."
```

**7. Criar a pasta `src/`** com as telas, o banco e o resto. É o que os próximos capítulos explicam.

## Arquivos de configuração (raiz do projeto)

| Arquivo | Pra que serve |
|---|---|
| `package.json` | Dependências, scripts e o ponto de entrada (`main`) |
| `app.json` | Configuração do Expo: nome, ícones, orientação (só retrato), `scheme` e plugins |
| `tsconfig.json` | Herda a config base do Expo, liga o modo `strict` e cria o atalho `@/` |
| `eslint.config.js` | Usa a config oficial do Expo (`eslint-config-expo/flat`) e ignora a pasta `dist/` |
| `.gitignore` | Tira do Git o que é gerado: `node_modules/`, `.expo/`, `/ios`, `/android`... |
| `AGENTS.md` | Regras do projeto pra assistentes de IA (sempre usar `npx expo install`, rotas só em `src/app/`...) |

As pastas `ios/` e `android/` **não existem de propósito**: o Expo gera elas na hora do build (o tal do *Continuous Native Generation*). Qualquer configuração nativa vai no `app.json`, nunca na mão.
