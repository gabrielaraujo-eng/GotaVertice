# GotaVértice — Monitoramento de consumo

## Sobre o projeto

O **GotaVértice** é um sistema de monitoramento de consumo de água desenvolvido como um trabalho em dupla.

A proposta é ajudar famílias a acompanhar o próprio consumo e identificar desperdícios antes que eles apareçam somente na conta de água.

## Problema

Muitas famílias não acompanham regularmente o consumo de água da residência. Como consequência, aumentos expressivos e possíveis desperdícios costumam ser percebidos apenas quando a conta chega.

## Solução

O sistema permitirá registrar as leituras mensais do hidrômetro, calcular o consumo do período e acompanhar a evolução do gasto de água por meio de gráficos e comparações entre meses.

## Objetivo

Criar uma aplicação simples e fácil de usar que ajude os moradores a:

- acompanhar o consumo mensal de água;
- identificar aumentos expressivos no consumo;
- comparar o consumo entre diferentes meses;
- perceber possíveis desperdícios com antecedência;
- tomar decisões para reduzir o consumo.

## Funcionalidades do MVP

O MVP, ou versão inicial do sistema, terá as seguintes funcionalidades:

1. **Cadastro de residência**
   - Nome ou identificação da residência;
   - Endereço ou uma identificação simplificada;
   - Quantidade de moradores, se necessário para análises futuras.

2. **Registro mensal do hidrômetro**
   - Data da leitura;
   - Valor registrado no hidrômetro;
   - Possibilidade de consultar os registros anteriores.

3. **Cálculo do consumo**
   - Consumo mensal calculado pela diferença entre a leitura atual e a leitura anterior;
   - Exibição do resultado em metros cúbicos (m³).

4. **Gráfico de evolução**
   - Visualização do consumo ao longo dos meses;
   - Identificação visual de períodos de aumento ou redução.

5. **Comparação entre meses**
   - Comparação do consumo do mês atual com o mês anterior;
   - Exibição da diferença em m³ e, se possível, em porcentagem.

6. **Alertas de aumento expressivo**
   - Aviso quando o consumo aumentar acima de um limite definido;
   - Mensagem de orientação para verificar possíveis vazamentos ou desperdícios.

## Etapas do desenvolvimento

O projeto será desenvolvido em etapas para facilitar a organização do trabalho em dupla.

### Etapa 1 — Planejamento

- Definir o objetivo e o público-alvo;
- Levantar os requisitos do sistema;
- Definir o escopo do MVP;
- Escolher as tecnologias que serão utilizadas;
- Criar o cronograma e dividir as tarefas entre a dupla.

### Etapa 2 — Modelagem e prototipação

- Modelar os dados da residência e das leituras;
- Definir as telas principais;
- Criar o fluxo de navegação;
- Elaborar um protótipo simples da interface;
- Definir a regra de cálculo do consumo e dos alertas.

### Etapa 3 — Implementação do cadastro

- Criar o cadastro da residência;
- Implementar o armazenamento dos dados;
- Criar as telas ou formulários necessários;
- Validar os campos preenchidos pelo usuário.

### Etapa 4 — Implementação das leituras e cálculos

- Criar o registro mensal do hidrômetro;
- Implementar o cálculo automático do consumo;
- Exibir o histórico de leituras;
- Implementar a comparação entre meses.

### Etapa 5 — Gráficos e alertas

- Criar o gráfico de evolução do consumo;
- Definir o que será considerado um aumento expressivo;
- Implementar os alertas;
- Melhorar a clareza das informações apresentadas.

### Etapa 6 — Testes e ajustes

- Testar o cadastro de residências;
- Testar leituras em sequência;
- Verificar cálculos com diferentes valores;
- Testar aumentos e reduções de consumo;
- Corrigir erros e ajustar a interface.

### Etapa 7 — Documentação e apresentação

- Finalizar o README;
- Registrar as decisões do projeto;
- Preparar exemplos de uso;
- Dividir a apresentação entre os dois integrantes;
- Demonstrar o funcionamento do MVP.

### Etapa 8 — Acesso e evolução do produto

- Criar a tela de login responsiva;
- Proteger o dashboard com uma sessão local de demonstração;
- Preparar a integração futura com autenticação no backend;
- Evoluir o cadastro e as permissões por residência.

## Organização do trabalho em dupla

O projeto será realizado por **dois integrantes**, com divisão de responsabilidades e colaboração nas decisões importantes. A divisão abaixo é uma sugestão inicial e pode ser ajustada conforme a necessidade do projeto.

### Integrante 1 — Dados e regras de negócio

- Modelagem dos dados;
- Cadastro da residência;
- Registro das leituras do hidrômetro;
- Cálculo do consumo mensal;
- Comparação entre meses;
- Implementação dos alertas;
- Testes das funcionalidades e dos cálculos.

### Integrante 2 — Interface e visualização

- Prototipação das telas;
- Desenvolvimento da interface;
- Tela de dashboard ou resumo do consumo;
- Criação dos gráficos;
- Organização da experiência de uso;
- Ajustes visuais e responsividade;
- Apoio na documentação e na apresentação.

### Responsabilidades compartilhadas

Os dois integrantes deverão participar de:

- planejamento e definição do escopo;
- escolha das tecnologias;
- revisão do código;
- testes gerais do sistema;
- correção de problemas;
- documentação;
- apresentação final do projeto.

A divisão de tarefas não significa que cada integrante trabalhará isoladamente. As funcionalidades deverão ser integradas e revisadas em conjunto para garantir que o resultado final seja consistente.

## Fluxo básico de uso

1. O usuário cadastra a residência.
2. O usuário registra a primeira leitura do hidrômetro.
3. No mês seguinte, registra uma nova leitura.
4. O sistema calcula automaticamente o consumo do período.
5. O usuário visualiza o histórico e o gráfico de evolução.
6. O sistema compara o consumo com meses anteriores.
7. Caso exista um aumento expressivo, o sistema apresenta um alerta.

## Critérios de sucesso do MVP

O MVP será considerado funcional quando for possível:

- cadastrar uma residência;
- registrar pelo menos duas leituras do hidrômetro;
- calcular corretamente o consumo entre as leituras;
- visualizar a evolução do consumo em um gráfico;
- comparar o mês atual com outro mês;
- exibir um alerta quando houver aumento expressivo;
- utilizar o sistema de forma simples e compreensível.

## Tecnologias

O frontend continua usando **HTML, CSS e JavaScript puro**, sem framework obrigatório. A aplicação agora possui servidor Node.js, API, sessões HttpOnly e SQLite; o `localStorage` não é mais a fonte de verdade para autenticação ou dados da residência.

## Como executar

Na raiz do projeto, execute:

```bash
npm run dev
```

Depois, abra `http://localhost:4173` no navegador. Também é possível abrir `public/index.html` diretamente, mas o servidor local é recomendado para manter o comportamento mais próximo de uma publicação web.

O arquivo `index.html` na raiz é a entrada principal preparada para uma futura publicação no GitHub Pages. Ele encaminha o visitante para a aplicação em `public/`.

## Publicação futura no GitHub Pages

Quando o projeto estiver pronto, a publicação poderá usar a opção **GitHub Actions** nas configurações de Pages. O `index.html` da raiz já está preparado como porta de entrada, enquanto a aplicação completa permanece organizada em `public/`.

Antes de publicar, a dupla deverá conferir os caminhos dos arquivos, testar a navegação e decidir se manterá o redirecionamento para `public/` ou moverá os arquivos finais para a raiz.

## Estrutura atual

| Caminho | Responsabilidade |
| --- | --- |
| `index.html` | Entrada principal da raiz e ponto de entrada para o futuro GitHub Pages |
| `README.md` | Descrição, regras de colaboração e instruções do projeto |
| `package.json` | Comandos locais para iniciar o servidor de desenvolvimento |
| `.gitignore` | Arquivos locais que não devem ser enviados ao GitHub |
| `public/index.html` | Dashboard, histórico, formulário de leitura e cadastro da residência |
| `public/styles.css` | Identidade visual, componentes e layout responsivo |
| `public/app.js` | Estado local, cálculos, gráfico, comparações, validações e alertas |
| `public/login/index.html` | Tela de login e entrada para o próximo estágio do produto |
| `public/login/login.css` | Identidade visual responsiva da tela de acesso |
| `public/login/login.js` | Validação e sessão local de demonstração |
| `public/tela-cadastro/index.html` | Estrutura inicial vazia para o cadastro da residência |
| `public/tela-leituras/index.html` | Estrutura inicial vazia para o registro do hidrômetro |
| `public/tela-graficos/index.html` | Estrutura inicial vazia para os gráficos |
| `public/tela-alertas/index.html` | Estrutura inicial vazia para os alertas |
| `public/tela-historico/index.html` | Estrutura inicial vazia para o histórico e comparações |

As telas específicas antigas permanecem como referências de organização. O fluxo principal usa o dashboard e o login servidos pelo backend; o banco SQLite local é criado automaticamente e o arquivo é ignorado pelo Git.

## Branches para a dupla

Para manter a `main` estável, o projeto terá uma branch de integração e branches específicas por funcionalidade:

| Branch | Uso |
| --- | --- |
| `main` | Versão estável e demonstrável |
| `develop` | Integração das funcionalidades antes da entrega |
| `feature/cadastro-residencia` | Cadastro e edição da residência |
| `feature/leituras-consumo` | Leituras, cálculo e comparação mensal |
| `feature/graficos-alertas` | Gráfico de evolução e alertas |
| `docs/apresentacao` | Documentação e preparação da apresentação |

Cada integrante deve trabalhar em uma branch de tarefa, abrir um Pull Request para `develop` e, após a revisão dos dois integrantes, fazer o merge da versão final em `main`.

## Status

- [x] Ideia definida
- [x] Problema e solução descritos
- [x] MVP definido
- [x] Etapas de desenvolvimento planejadas
- [x] Divisão inicial da dupla definida
- [x] Tecnologias escolhidas
- [x] Protótipo inicial criado
- [x] Cadastro demonstrativo implementado
- [x] Registro e cálculo demonstrativos implementados
- [x] Gráficos demonstrativos implementados
- [x] Alertas demonstrativos implementados
- [x] Tela de login e sessão local de demonstração implementadas
- [ ] Testes concluídos
- [ ] Apresentação final preparada

## Arquitetura da aplicação web

O projeto deixou de depender apenas de uma página estática e agora possui um servidor Node.js com API, autenticação por sessão e persistência em SQLite. O navegador não grava mais residência, leituras ou sessão no `localStorage`: esses dados são carregados e salvos no servidor para o usuário autenticado.

### Executar localmente

Requer Node.js 22 ou superior, pois o projeto usa o módulo SQLite nativo do Node.

```bash
npm install
npm run dev
```

Acesse `http://localhost:4173`. O servidor também expõe `GET /healthz` para verificar a disponibilidade.

### Acesso de demonstração

- E-mail: `demo@gotavertice.com`
- Senha: `agua123`

A conta é criada automaticamente na primeira inicialização. Em ambiente de produção, a senha deve ser substituída por um fluxo de cadastro e secrets gerenciados.

### Camadas principais

| Camada | Arquivos | Responsabilidade |
| --- | --- | --- |
| Servidor | `server.js` | HTTP, arquivos estáticos, API, cookies e autenticação |
| Banco | `server.js`, `data/` | SQLite com usuários, sessões, residência e leituras |
| Frontend | `public/app.js` | Dashboard conectado aos endpoints da API |
| Login | `public/login/login.js` | Login real via `fetch` e sessão HttpOnly |
| Domínio | `public/consumption.js` | Ordenação, consumo, média, alertas e economia |
| Qualidade | `tests/` | Testes de domínio e integração do servidor |

### Endpoints essenciais

- `POST /api/auth/login` cria uma sessão com cookie HttpOnly.
- `GET /api/auth/session` verifica a sessão atual.
- `POST /api/auth/logout` invalida a sessão.
- `GET /api/dashboard` retorna residência e leituras do usuário.
- `PUT /api/residence` atualiza a residência autenticada.
- `POST /api/readings` cria ou corrige uma leitura respeitando a ordem do hidrômetro.
- `DELETE /api/data` limpa apenas os dados da residência autenticada.

### Testes

```bash
npm test
```

A suíte cobre as regras de consumo e o fluxo de autenticação, isolamento de sessão, carregamento do dashboard e persistência da residência.

### Execução em container

O `Dockerfile` executa o mesmo servidor na porta `3000`. O SQLite dentro do container é adequado para desenvolvimento ou instâncias únicas; em produção compartilhada, use volume persistente ou migre para um banco gerenciado antes de publicar.

### Limite atual de produção

A base já funciona como aplicação web full-stack local e está preparada para deploy como servidor. Para publicação compartilhada, o próximo passo operacional é trocar o SQLite local por um banco gerenciado, configurar secrets, HTTPS e a política de cookies do ambiente publicado. O arquivo do banco local permanece ignorado pelo Git.
