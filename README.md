# Água Consciente — Monitoramento de consumo

## Sobre o projeto

O **Água Consciente** é um sistema de monitoramento de consumo de água desenvolvido como um trabalho em dupla.

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

As tecnologias serão definidas na etapa de planejamento, considerando o conhecimento da dupla, o prazo disponível e os requisitos do trabalho.

## Status

- [x] Ideia definida
- [x] Problema e solução descritos
- [x] MVP definido
- [x] Etapas de desenvolvimento planejadas
- [x] Divisão inicial da dupla definida
- [ ] Tecnologias escolhidas
- [ ] Protótipo criado
- [ ] Cadastro implementado
- [ ] Registro e cálculo implementados
- [ ] Gráficos implementados
- [ ] Alertas implementados
- [ ] Testes concluídos
- [ ] Apresentação final preparada
