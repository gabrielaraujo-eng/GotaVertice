# Plano — GotaVértice Full-stack

## Objetivo

Transformar o protótipo com `localStorage` em uma aplicação web funcional, com servidor HTTP, autenticação persistente, banco SQLite e frontend conectado a uma API. A identidade visual atual será preservada; a mudança principal será de arquitetura e persistência.

## Decisões de implementação

- **Servidor:** Node.js nativo com `node:http`, para manter a aplicação pequena e sem dependências de runtime desnecessárias.
- **Persistência:** SQLite via `node:sqlite`, com banco em `data/gotavertice.sqlite` e schema inicial criado automaticamente.
- **Autenticação:** e-mail e senha existentes do protótipo, com senha derivada por `scrypt`, sessão aleatória armazenada no banco e cookie HttpOnly.
- **API:** endpoints JSON para login, sessão, logout, dashboard, residência, leituras e limpeza dos dados do usuário.
- **Frontend:** mantém HTML/CSS/JS atuais, removendo a dependência funcional do `localStorage` e carregando o estado pela API.
- **Dados:** cada usuário possui uma residência e suas leituras; consultas e alterações sempre filtram pelo usuário autenticado.
- **Execução:** `npm run dev` inicia o servidor; `npm test` cobre as regras de consumo e testes básicos do servidor.

## Estrutura

- `server.js`: servidor HTTP, roteamento, cookies, autenticação e API.
- `db.js`: criação do SQLite, schema, seed da conta de demonstração e consultas de domínio.
- `public/`: frontend e assets existentes.
- `public/login/`: tela de login conectada à API.
- `public/app.js`: dashboard conectado à API.
- `tests/`: testes de regras de consumo e endpoints essenciais.
- `data/`: banco local ignorado pelo Git; apenas o schema e a conta de demonstração são recriados automaticamente.

## Design

### Estilos considerados

- **Dashboard editorial de água — 0,04:** preservar a identidade atual e priorizar leitura clara.
- **Admin SaaS minimalista — 0,07:** organizar estados e ações com densidade funcional.
- **Portal institucional — 0,05:** enfatizar confiança e explicações longas.

### Escolha

**Dashboard editorial de água.** O produto continua leve, claro e acolhedor, mas passa a comunicar estados reais de sessão, carregamento e erro.

### Princípios

1. Persistência real sem esconder o estado da operação.
2. Feedback curto e acionável para login, salvamento e falha de rede.
3. Separação clara entre domínio, API e apresentação.
4. Segurança por padrão: sessão HttpOnly e isolamento por usuário.

### Cor e tipografia

A paleta azul-petróleo, verde de economia, âmbar de ação e coral de alerta permanece. `Space Grotesk` continua reservado para títulos e métricas; `DM Sans` para textos, formulários e mensagens operacionais.

### Voz

- “Seu histórico está salvo com segurança.”
- “Não foi possível salvar agora. Tente novamente.”

## Próximo limite técnico

A autenticação desta etapa é própria e funcional para o ambiente do projeto. Para produção pública, o próximo passo é configurar secrets, HTTPS, política de cookies de Preview e um banco gerenciado; não usar o arquivo SQLite local como armazenamento compartilhado de produção.
