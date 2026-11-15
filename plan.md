# Plano inicial — Água Consciente

## Direção do produto

O Água Consciente será um dashboard web simples para famílias registrarem leituras mensais do hidrômetro, entenderem o consumo e receberem um alerta quando houver aumento expressivo.

## Decisões da primeira versão

- Frontend estático em HTML, CSS e JavaScript, sem dependências externas obrigatórias.
- Dados persistidos no `localStorage` para o MVP funcionar sem backend.
- Interface em português do Brasil, responsiva e orientada a leitura rápida.
- Limite inicial de alerta: aumento superior a 20% em relação ao mês anterior.
- Gráfico construído em SVG para evitar dependência de biblioteca.

## Estrutura

- `public/index.html`: estrutura semântica da dashboard, formulário de leitura e cadastro da residência.
- `public/styles.css`: identidade visual, componentes e responsividade.
- `public/app.js`: estado local, cálculos, tabela, gráfico, validações e alertas.
- `public/manus-routes.json`: rotas declaradas para o site.
- `README.md`: visão do projeto, MVP e documentação da dupla.

## Estratégia de branches

- `main`: versão estável e demonstrável.
- `develop`: integração das funcionalidades antes do merge em `main`.
- `feature/cadastro-residencia`: cadastro e edição dos dados da residência.
- `feature/leituras-consumo`: registro de leituras, cálculo e comparação mensal.
- `feature/graficos-alertas`: visualização da evolução e regras de alerta.
- `docs/apresentacao`: documentação, roteiro e materiais da apresentação.

Cada integrante deve trabalhar em uma branch de tarefa, abrir Pull Request para `develop` e só depois promover uma versão revisada para `main`.
