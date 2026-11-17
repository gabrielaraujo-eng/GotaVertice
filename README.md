# GotaVértice

Aplicação web para acompanhar o consumo de água de uma residência, identificar aumentos fora do padrão e tomar decisões para reduzir desperdícios.

O projeto possui uma versão web publicada com Firebase Hosting e uma versão local full-stack com servidor Node.js, API e SQLite para desenvolvimento. Na versão web, o cadastro e o login usam Firebase Authentication, enquanto a residência e as leituras ficam no Cloud Firestore. O Firebase Hosting publica somente os arquivos estáticos de `public/`.

> **Dados dos clientes:** não são salvos no GitHub. O frontend usa a configuração pública do Firebase Web, e as regras do Firestore restringem cada usuário ao próprio UID. O SQLite local serve apenas para a execução legada e os testes.

## O que a aplicação faz

Depois de criar uma conta, a pessoa pode:

- cadastrar o nome da residência e o número de moradores;
- registrar leituras do hidrômetro com data e valor em m³;
- acompanhar o consumo calculado entre duas leituras;
- visualizar histórico, gráfico e comparação mensal;
- receber um alerta quando o consumo sobe mais de 20% em relação ao período anterior;
- exportar os próprios dados em JSON;
- limpar os dados da residência com confirmação;
- sair da conta e encerrar a sessão no servidor.

## Publicação da versão web

A publicação é feita a partir da raiz deste repositório, mas o conteúdo enviado pelo Firebase Hosting vem somente de `public/`. O arquivo `firebase.json` deve conter `"public": "public"`.

Depois de instalar e autenticar o Firebase CLI, execute:

```bash
firebase init hosting
firebase deploy --only hosting
```

Durante o `firebase init hosting`, selecione o projeto Firebase correto, use `public` como diretório público e responda **No** para configuração de aplicação de página única. O deploy cria uma URL `*.web.app`.

O repositório inteiro pode permanecer no GitHub. Arquivos como `server.js`, `data/`, `tests/`, `Dockerfile` e `package.json` continuam úteis para desenvolvimento local e testes, mas não são enviados como conteúdo do Hosting quando `public` é o diretório configurado. As regras `firestore.rules` e os índices `firestore.indexes.json` são configurações versionáveis; os documentos dos clientes permanecem no Firebase.

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
npm run dev    # inicia o servidor para desenvolvimento
npm start      # inicia o servidor como processo de aplicação
npm test       # executa todos os testes automatizados
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
| Banco | `data/gotavertice.sqlite` | Usuários, sessões, residências e leituras; criado automaticamente |
| Login | `public/login/` | Entrar e criar conta pela API |
| Dashboard | `public/index.html`, `public/app.js` | Interface e chamadas para o servidor |
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

O fluxo de recuperação por e-mail ainda não está configurado. Em ambiente local, a conta fica no arquivo SQLite da pasta `data`. Para recomeçar com um banco vazio, pare o servidor e remova esse arquivo; essa ação apaga todas as contas e leituras locais.

## Execução com Docker

A imagem usa Node 22 e inicia o mesmo servidor na porta 3000:

```bash
docker build -t gotavertice .
docker run --rm -p 3000:3000 -v gotavertice-data:/app/data gotavertice
```

O volume é importante para manter o banco depois que o container for encerrado. Para uma publicação com várias instâncias, substitua o SQLite local por um banco gerenciado.

## Desenvolvimento e colaboração

A branch `main` contém a versão estável. Use uma branch curta para cada mudança, com nomes como `feature/cadastro-usuarios`, `fix/validacao-leituras` ou `docs/tutorial`. Faça commits semânticos, execute `npm test`, abra um Pull Request para `develop` e só depois promova a integração para `main`.

Antes de abrir um Pull Request, confira:

```bash
node --check server.js
node --check public/app.js
node --check public/login/login.js
npm test
git diff --check
```

## Próximas evoluções

As próximas melhorias naturais são recuperação de senha por e-mail, edição de perfil, múltiplas residências por conta, banco gerenciado para produção, proteção contra tentativas repetidas de login, logs estruturados e publicação com HTTPS. Essas evoluções devem preservar o isolamento dos dados por usuário e a experiência simples do dashboard.
