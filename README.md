# GotaVértice

Aplicação web para acompanhar o consumo de água de uma residência, identificar aumentos fora do padrão e tomar decisões para reduzir desperdícios.

O projeto possui uma versão web publicada com Firebase Hosting e uma versão local full-stack com servidor Node.js, API e SQLite para desenvolvimento. Na versão web, o cadastro e o login usam Firebase Authentication, enquanto a residência e as leituras ficam no Cloud Firestore. O Firebase Hosting publica somente os arquivos estáticos de `public/`.

> **Dados dos clientes:** não são salvos no GitHub. O frontend usa a configuração pública do Firebase Web, e as regras do Firestore restringem cada usuário ao próprio UID. O SQLite local serve apenas para a execução legada e os testes.


## Autoria

Projeto mantido por **Gabriel Lucio** — [@gabrielaraujo-eng](https://github.com/gabrielaraujo-eng).

## O que a aplicação faz

Depois de criar uma conta, a pessoa pode:

- cadastrar o nome da residência e o número de moradores;
- registrar leituras do hidrômetro com data e valor em m³;
- acompanhar o consumo calculado entre duas leituras;
- visualizar histórico, gráfico e comparação mensal;
- receber um alerta quando o consumo sobe mais de 20% em relação ao período anterior;
- exportar os próprios dados em JSON;
- limpar os dados da residência com confirmação;
- entrar com e-mail/senha ou Google;
- solicitar recuperação de senha por e-mail;
- sair da conta e encerrar a sessão;
- excluir a conta e os dados da nuvem após confirmação explícita.

## Publicação da versão web

A publicação é feita a partir da raiz deste repositório, mas o conteúdo enviado pelo Firebase Hosting vem somente de `public/`. O arquivo `firebase.json` deve conter `"public": "public"`.

Depois de instalar e autenticar o Firebase CLI, associe o diretório ao projeto correto uma única vez:

```bash
firebase use gotavertice-gj
```

Para publicar as regras do Firestore e o site atualizado:

```bash
firebase deploy --only firestore:rules,hosting
```

O Hosting publica somente `public/`. As páginas públicas incluem a política de privacidade, a política de cookies, `sitemap.xml`, `robots.txt` e a página 404. O deploy cria ou atualiza a URL `*.web.app`.

O repositório inteiro pode permanecer no GitHub. Arquivos como `server.js`, `data/`, `tests/`, `Dockerfile` e `package.json` continuam úteis para desenvolvimento local e testes, mas não são enviados como conteúdo do Hosting quando `public` é o diretório configurado. As regras `firestore.rules` e os índices `firestore.indexes.json` são configurações versionáveis; os documentos dos clientes permanecem no Firebase.

## Configuração do Firebase

No Console do Firebase, ative **Authentication → E-mail/senha** e **Google**. O Firestore deve estar em modo de produção, com a região definida no projeto. O frontend usa a configuração pública do Firebase Web em `public/firebase.js`; ela não substitui nem contém uma credencial Admin SDK.

As regras versionadas em `firestore.rules` permitem acesso apenas ao usuário autenticado cujo UID corresponde ao caminho do documento. Não use `allow read, write: if true` em produção. Nunca envie para o GitHub arquivos com `private_key`, `serviceAccount`, `.env` ou `firebase-adminsdk`.

## Requisitos

Para executar o projeto, instale:

- **Node.js 22 ou superior** — o projeto usa o SQLite nativo disponível nessa versão;
- **Git** — para baixar o código;
- um navegador atualizado, como Chrome, Edge, Firefox ou Safari.

Você pode conferir a versão do Node com:

```bash
node --version
```

Se o comando retornar uma versão menor que `v22`, atualize o Node antes de continuar.

## Instalação para quem está começando

### 1. Baixe o projeto

Abra um terminal e execute:

```bash
git clone https://github.com/gabrielaraujo-eng/GotaVertice.git
cd GotaVertice
```

Se você já recebeu a pasta do projeto, entre nela com `cd` e pule o primeiro comando.

### 2. Instale a preparação do projeto

O projeto não depende de bibliotecas externas para funcionar, mas este comando prepara o ambiente padrão do Node:

```bash
npm install
```

### 3. Inicie o servidor

```bash
npm run dev
```

Quando aparecer uma mensagem informando que o GotaVértice está disponível, abra no navegador:

<http://localhost:4173>

Mantenha o terminal aberto enquanto usa a aplicação. Para parar o servidor, pressione `Ctrl+C`.

## Primeiro acesso

Ao abrir a aplicação, selecione **Criar minha conta**. Informe um e-mail válido e uma senha com pelo menos oito caracteres. O cadastro cria automaticamente uma residência inicial chamada “Minha residência”.

Depois do cadastro, o sistema abre o dashboard. Entre em **Residência** para trocar o nome e informar a quantidade correta de moradores. Em seguida, use **Nova leitura** para registrar o valor do hidrômetro.

O consumo só pode ser calculado quando houver pelo menos duas leituras. O valor da leitura seguinte precisa ser igual ou maior que a anterior, porque o hidrômetro acumula o consumo. Se você corrigir uma leitura intermediária, ela também precisa permanecer entre as leituras vizinhas.

## Como usar o dashboard

O cartão **Consumo no mês** mostra a diferença entre as duas últimas leituras. **Média da residência** calcula a média dos períodos registrados. **Economia acumulada** compara cada período com uma meta de 15 m³. O cartão **Status do consumo** indica se houve uma alta expressiva.

O gráfico mostra até os seis períodos mais recentes. A linha tracejada representa a média recomendada. A tabela abaixo apresenta a leitura, o consumo calculado e a situação de cada período.

Em **Sua residência**, o botão de exportação baixa um arquivo JSON com a residência e as leituras da conta atual. O botão de limpeza remove somente os dados dessa residência e pede confirmação antes de executar a operação.

## Comandos disponíveis

```bash
npm run dev        # inicia o servidor local legado
npm start          # inicia o servidor local como aplicação
npm test           # executa os testes automatizados
npm run test:smoke # valida o Hosting público sem alterar dados
npm run security:check # audita regras, dependências, segredos e headers
```

O servidor aceita a variável `PORT`. Por exemplo:

```bash
PORT=3000 npm start
```

A rota `GET /healthz` responde com o estado do serviço e pode ser usada por uma plataforma de hospedagem para verificar se a aplicação está funcionando.

## Arquitetura

| Camada | Arquivo ou pasta | Responsabilidade |
| --- | --- | --- |
| Servidor | `server.js` | HTTP, arquivos estáticos, rotas da API, cookies e autenticação |
| Banco web | Firebase Authentication + Cloud Firestore | Contas, residências e leituras da versão publicada |
| Banco local legado | `data/gotavertice.sqlite` | Desenvolvimento local e testes; ignorado pelo Git |
| Login | `public/login/` + `public/firebase.js` | E-mail/senha e Google pelo Firebase Authentication |
| Dashboard | `public/index.html`, `public/app.js` | Interface e chamadas para o Firestore na versão web |
| Regras | `public/consumption.js` | Ordenação, consumo, média, alertas e economia |
| Estilos | `public/styles.css`, `public/login/login.css` | Identidade visual, responsividade e foco acessível |
| Testes | `tests/` | Regras de consumo e integração do servidor |
| Rotas | `public/manus-routes.json` | Páginas navegáveis da aplicação |
| Container | `Dockerfile` | Execução do servidor em uma imagem Node 22 |
| Web | `firebase.json` + `public/` | Publicação dos arquivos estáticos no Firebase Hosting |

O banco local é ignorado pelo Git. O arquivo `data/.gitkeep` mantém a pasta no repositório, mas nenhum dado pessoal é enviado para o GitHub.

## API principal

Todas as rotas abaixo, exceto `/healthz` e as rotas de autenticação, exigem uma sessão válida:

| Método | Rota | Função |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Cria uma conta e a residência inicial |
| `POST` | `/api/auth/login` | Valida e-mail e senha e cria uma sessão |
| `GET` | `/api/auth/session` | Verifica a sessão atual |
| `POST` | `/api/auth/logout` | Invalida a sessão no servidor |
| `GET` | `/api/dashboard` | Retorna residência e leituras da conta |
| `PUT` | `/api/residence` | Atualiza os dados da residência |
| `POST` | `/api/readings` | Cria ou atualiza uma leitura validada |
| `DELETE` | `/api/data` | Remove os dados da residência autenticada |
| `GET` | `/healthz` | Verifica se o servidor está disponível |

As senhas nunca são salvas em texto puro. O servidor usa `scrypt` para derivar um hash e armazena uma sessão aleatória em cookie `HttpOnly`. A API filtra cada consulta pelo usuário autenticado.

## Privacidade, segurança e direitos do usuário

A aplicação usa Firebase Authentication para contas e Cloud Firestore para residência e leituras. As regras do Firestore exigem autenticação e limitam o acesso ao próprio UID; dados de clientes não são versionados no GitHub. A configuração web do Firebase é pública por natureza, mas credenciais Admin SDK e chaves privadas são bloqueadas pelo `.gitignore`.

As páginas públicas [política de privacidade](https://gotavertice-gj.web.app/privacidade/) e [cookies e tecnologias locais](https://gotavertice-gj.web.app/cookies/) explicam o tratamento de dados, os provedores usados, a retenção e os controles disponíveis. No dashboard, o usuário pode exportar seus dados em JSON, limpar residência e leituras ou solicitar a exclusão completa da conta. A exclusão exige a confirmação `EXCLUIR` e pode exigir login recente por segurança.

## Auditoria de segurança

O projeto inclui `npm run security:check`, que verifica se não há chaves privadas no repositório, se as regras do Firestore exigem o UID autenticado, se o Firebase Hosting declara cabeçalhos de proteção e se as dependências de produção não têm vulnerabilidades altas ou críticas. Para verificar também o site publicado, use `SECURITY_URL=https://gotavertice-gj.web.app npm run security:check`.

O tema visual padrão da aplicação é escuro. A interface não usa publicidade comportamental nem rastreamento de anúncios.

## Smoke test do Firebase Hosting

Depois de publicar o Hosting, valide a URL pública com:

```bash
npm run test:smoke
```

Para testar outra URL, use `SMOKE_URL=https://seu-dominio.web.app npm run test:smoke`. O mesmo teste pode ser executado manualmente no GitHub Actions em **Actions → Firebase Hosting smoke test → Run workflow**. Ele verifica o redirecionamento inicial, os assets do login, o dashboard e a página 404 personalizada sem criar usuários ou acessar dados de clientes.

## Testes

Execute:

```bash
npm test
```

A suíte verifica as regras de ordenação e cálculo, o bloqueio de acesso sem sessão, o cadastro, a rejeição de e-mails repetidos, a atualização da residência e a persistência do fluxo autenticado. Os testes de integração usam um banco temporário separado para não alterar dados de desenvolvimento.

## Solução de problemas

### “Node.js precisa ser atualizado”

Instale o Node.js 22 ou superior e abra um novo terminal. Depois confira novamente com `node --version`.

### A porta 4173 já está em uso

Inicie em outra porta:

```bash
PORT=3000 npm run dev
```

Depois abra <http://localhost:3000>.

### A página não abre

Confirme se o terminal ainda está executando `npm run dev`, se você está usando o endereço `localhost` correto e se nenhuma mensagem de erro apareceu no terminal. Acesse `/healthz` para separar um problema do servidor de um problema do navegador.

### Esqueci a senha

Na tela de login, informe o e-mail e clique em **Esqueci minha senha**. O Firebase envia um link de redefinição para o endereço informado. Por segurança, a interface usa a mesma mensagem quando o e-mail não possui uma conta. Se o e-mail não chegar, confira a caixa de spam e confirme no Firebase Console se o provedor **Authentication → E-mail/senha** está ativado.

## Execução com Docker

A imagem usa Node 22 e inicia o mesmo servidor na porta 3000:

```bash
docker build -t gotavertice .
docker run --rm -p 3000:3000 -v gotavertice-data:/app/data gotavertice
```

O volume é importante para manter o banco depois que o container for encerrado. Para uma publicação com várias instâncias, substitua o SQLite local por um banco gerenciado.

## Desenvolvimento e colaboração

A branch `main` contém a versão estável. Use uma branch curta para cada mudança, com nomes como `feature/cadastro-usuarios`, `fix/validacao-leituras` ou `docs/tutorial`. Faça commits semânticos, execute `npm test` e `npm run test:smoke` quando a alteração afetar o Hosting. Abra um Pull Request para `main` e mescle somente depois da revisão.

Antes de abrir um Pull Request, confira:

```bash
node --check server.js
node --check public/app.js
node --check public/login/login.js
npm test
git diff --check
```

## Próximas evoluções

As próximas melhorias naturais são reautenticação guiada antes da exclusão, edição de perfil, múltiplas residências por conta, proteção contra tentativas repetidas de login, logs estruturados, monitoramento de custos e uma camada SaaS com organizações, planos e cobrança. Essas evoluções devem preservar o isolamento dos dados por usuário e a experiência simples do dashboard.
