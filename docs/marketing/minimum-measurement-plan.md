# GotaVértice — plano mínimo de mensuração do funil

**Versão:** 1.0 · 18 de novembro de 2026
**Estado:** proposta para revisão; não autoriza coleta nem ativação de ferramentas.
**Escopo desta entrega:** documentação somente. Nenhum evento, SDK, pixel, cookie ou ferramenta de analytics foi configurado.

## Objetivo e princípios

Propor indicadores agregados para acompanhar a validação orgânica do percurso: visita à página, clique na chamada para ação, cadastro concluído, primeira leitura e segunda leitura. O aplicativo registra leituras manualmente; uma primeira comparação exige duas leituras. A mensuração deve ajudar a avaliar clareza da página e ativação, não identificar, perfilar ou segmentar pessoas. [1] [2]

Não usar os dados para segmentação de anúncios, públicos semelhantes, retargeting, venda ou compartilhamento para publicidade. Não incluir em eventos, relatórios ou exportações: e-mail, UID ou outro identificador de pessoa/conta, endereço, nome da residência, valor do hidrômetro, datas ou valores de leitura, consumo ou captura de tela identificável.

## Regra de operação enquanto a revisão não estiver concluída

Até que haja revisão documentada de privacidade e decisão sobre consentimento, não instalar, habilitar nem configurar analytics não essencial, pixels, SDKs ou novos eventos. Usar somente contagens agregadas que já estejam disponíveis em fontes existentes e cujo uso tenha sido autorizado; confirmar a disponibilidade e a origem antes de incluí-las. Se as contagens não existirem ou não puderem ser verificadas, limitar a validação a feedback voluntário sem identificadores e registrar que a métrica não está disponível.

Este documento não afirma que exista ferramenta, coleta, consentimento ou aprovação em vigor. Qualquer analytics não essencial só poderá ser considerado após revisão de finalidade, necessidade, fornecedor e fluxos de dados, prazo de retenção, acesso e mecanismo de consentimento válido, informado e anterior à coleta, com opção de recusa sem prejuízo ao uso essencial do aplicativo. A retirada do consentimento deve interromper a coleta futura e ter um procedimento definido para dados já coletados, conforme orientação jurídica. Se a revisão ou o consentimento não estiverem prontos, permanecer no modo de contagens agregadas autorizadas e feedback voluntário.

## Catálogo proposto de métricas

As fontes abaixo são candidatas, não afirmações de que os dados ou sistemas estejam disponíveis. Antes do uso, verificar a fonte, a agregação, a autorização e a ausência de identificadores. Se a fonte só permitir contagem identificável, não utilizá-la neste plano.

| Métrica | Definição operacional | Fonte segura candidata, a confirmar | Finalidade | Retenção proposta e acesso |
|---|---|---|---|---|
| Visitas à página | Total de visualizações da página informativa no período. Sem deduplicação por pessoa ou dispositivo; declarar se bots ou repetição não puderem ser separados com segurança. | Contagem agregada já existente na hospedagem ou relatório agregado do servidor. Não criar identificadores persistentes nem ativar analytics para obtê-la. | Entender o alcance orgânico e contextualizar o volume do funil. | Até 12 meses para o total semanal agregado, sujeito a revisão. Acesso restrito a produto/marketing responsável pelo relatório e privacidade/jurídico quando necessário. Logs brutos não entram no relatório; a retenção dos logs de origem deve ser verificada separadamente. |
| Cliques na CTA | Total de cliques na chamada para ação no período. Não equivale a pessoas únicas; cliques repetidos podem contar mais de uma vez. | Contagem agregada já disponível na página ou plataforma, somente se puder ser consultada sem novo tracking e sem identificadores. | Avaliar clareza da CTA; comparar com visitas apenas com ressalvas metodológicas. | Até 12 meses para totais semanais agregados, sujeito a revisão; acesso restrito. Não guardar identificadores nem sequência de navegação. |
| Cadastros concluídos | Total de conclusões de cadastro no período, conforme definição existente do produto. Não exportar linhas de cadastro nem calcular pessoas únicas para este relatório. | Contagem agregada já disponível no sistema de cadastro, gerada sem expor registros individuais. | Acompanhar a passagem da página para o início do uso. | Até 12 meses para totais agregados, sujeito a revisão; acesso restrito. A base operacional de contas tem finalidade e política próprias e não deve ser copiada para o relatório. |
| Primeiras leituras | Total de cadastros que registraram uma primeira leitura manual concluída no período, contado apenas como agregado. Se não for possível derivar o total sem consultar ou exportar dados identificáveis, não calcular até aprovação e método seguro. | Contagem agregada já disponível no produto; consulta somente após revisão técnica e de privacidade. Não incluir valor, data/hora exata, residência ou identificador de conta. | Medir ativação inicial: o cadastro avançou até o primeiro registro manual? | Até 12 meses para agregados semanais, sujeito a revisão; acesso restrito. Não reter valores de leituras nem dados em nível de conta para este fim. |
| Segundas leituras | Total de cadastros que registraram uma segunda leitura manual distinta após a primeira, permitindo a primeira comparação. Reportar como contagem agregada; não incluir leituras, consumo, datas exatas ou identificadores. | Contagem agregada já disponível no produto; derivação e validação da distinção entre primeira e segunda leitura dependem de revisão técnica e de privacidade. | Acompanhar a ativação que permite comparação e a sequência de uso em validação. | Até 12 meses para agregados semanais, sujeito a revisão; acesso restrito. Não reter dados de consumo ou séries individuais para este relatório. |

O prazo de até 12 meses é uma proposta para totais semanais agregados, não uma política vigente. Deve ser aprovado junto com o local de armazenamento, controles de acesso e descarte. Para reduzir risco de reidentificação, propõe-se suprimir recortes com menos de 10 casos e totais complementares que permitam deduzir o valor suprimido. Esse limiar é uma salvaguarda operacional proposta, não garantia de anonimização nem substituto de revisão especializada. Se a agregação segura não puder ser demonstrada, não divulgar o recorte.

## Definição de ativação e leitura do funil

**Ativação inicial:** ocorrência de uma primeira leitura manual concluída após o cadastro. **Ativação para primeira comparação:** ocorrência de uma segunda leitura manual distinta após a primeira. As definições ficam separadas: a primeira leitura, por si só, não significa que já exista comparação. [2]

Os cinco totais da tabela são as métricas primárias. Taxas derivadas — por exemplo, cliques/visitas, cadastros/cliques, primeiras leituras/cadastros e segundas leituras/cadastros — são opcionais e só devem ser calculadas quando numerador e denominador tiverem janelas e populações compatíveis, sem exigir vínculo individual não aprovado. Sem essa compatibilidade, apresentar os totais lado a lado, sem chamar a razão de conversão. Não interpretar totais agregados como conversão da mesma pessoa se a ligação não tiver sido autorizada e validada.

A meta de validação de 90 dias é hipótese de aprendizagem, não resultado nem comportamento comprovado. Uma coorte agregada por semana de cadastro só pode ser acompanhada se houver método seguro e aprovado que não exponha nem acompanhe indivíduos. Sem esse método, reportar totais disponíveis, sem alegar retenção ou progressão da mesma coorte.

## Modelo de relatório semanal

Preparar um resumo semanal sem nomes, identificadores, valores de hidrômetro, consumo, endereço ou nome de residência. Indicar janela, fonte e definição. Separar **observações factuais** de **interpretações**; não atribuir causalidade a mudanças sem evidência.

### Observações — fatos do período

| Indicador | Total no período | Comparação disponível | Observação factual ou ressalva |
|---|---:|---|---|
| Visitas à página | [ ] | [período anterior, se comparável] | [ ] |
| Cliques na CTA | [ ] | [ ] | [ ] |
| Cadastros concluídos | [ ] | [ ] | [ ] |
| Primeiras leituras | [ ] | [ ] | [ ] |
| Segundas leituras | [ ] | [ ] | [ ] |

**Período:** [data inicial–data final] · **Fonte e método:** [somente fontes agregadas verificadas; descrever sem identificadores] · **Cobertura:** [ ]

### Interpretações — hipóteses, não fatos

- Sinal que merece investigação: [ ]
- Explicações alternativas e dados que faltam: [ ]
- Próximo passo de baixo risco: [ ]
- Decisão: [nenhuma / proposta para discussão]

### Coortes e maturidade

Indicar coorte ou janela observada, número de casos com observação completa e coortes ainda imaturas. Não comparar uma coorte recém-iniciada com outra que já teve 90 dias para registrar uma segunda leitura. Marcar coortes incompletas como **imaturas**; não tratá-las como falha de ativação ou abandono. Se a amostra for pequena, o período curto ou houver supressão por privacidade, registrar **resultado inconclusivo** em vez de inferir tendência.

### Limitações e qualidade

Registrar disponibilidade e cobertura das fontes, possíveis duplicidades ou atrasos, diferenças de definição, tamanho da amostra e cortes suprimidos. Feedback voluntário pode contextualizar os números, mas não deve ser tratado como amostra representativa. Não preencher lacunas com estimativas apresentadas como fatos.

## Acesso, retenção e descarte

O relatório contém somente os totais agregados necessários e fica acessível às pessoas que precisam dele para produto, marketing orgânico e revisão de privacidade/jurídica. Evitar links públicos, compartilhamento externo, planilhas abertas e exportações de registros. Definir responsáveis e controles de acesso antes de qualquer produção regular. Não conceder acesso para publicidade ou segmentação.

O prazo proposto de até 12 meses para agregados semanais precisa ser revisado e aprovado. A revisão deve confirmar prazo, local de armazenamento, controles, descarte e eventual retenção de dados nas fontes originais. Não criar retenção paralela de dados brutos para este plano. Se uma fonte exigir identificadores, dados de leitura ou logs em nível individual para gerar um indicador, suspender esse uso até revisão e autorização específicas; a agregação no relatório não resolve, por si só, a retenção na origem.

## Checklist obrigatório antes de analytics não essencial

- [ ] Jurídico/privacidade revisou finalidade, necessidade, base legal, riscos, fornecedores, fluxos de dados, retenção, descarte e direitos aplicáveis.
- [ ] O consentimento foi avaliado para o caso de uso; quando exigido, é claro, informado, anterior à coleta, permite recusa sem prejuízo ao uso essencial e pode ser retirado.
- [ ] A decisão e o escopo aprovado estão documentados. Sem aprovação, analytics não essencial permanece desativado.
- [ ] Fonte e método produzem somente agregados, sem e-mail, UID, endereço, nome de residência, valor do hidrômetro ou consumo em eventos, relatórios ou exportações.
- [ ] Não há identificadores persistentes, fingerprinting, perfil individual ou ligação entre etapas não aprovada. Qualquer método de coorte foi revisado separadamente.
- [ ] Retenção, acesso mínimo, armazenamento, descarte e responsáveis foram definidos; existe procedimento para retirada de consentimento.
- [ ] Supressão de grupos pequenos e risco de dedução por totais complementares foram avaliados.
- [ ] Os dados não serão usados para segmentação de anúncios, retargeting, públicos semelhantes ou compartilhamento publicitário.
- [ ] O relatório apresenta definições, janelas e limitações explícitas e não trata coortes imaturas como resultados finais.

**Critério de liberação:** concluir e aprovar os itens aplicáveis antes de habilitar analytics não essencial. Até lá, usar apenas contagens agregadas existentes cuja utilização esteja autorizada e feedback voluntário; se isso não puder ser confirmado, não coletar nem reportar a métrica.

## Referências

[1]: https://docs.google.com/document/d/1IbqKe2EncqLAF1WdQmbskCA4nq3LZcg7qs9oN_Xve9w/edit "Plano de marketing do GotaVértice"
[2]: https://github.com/gabrielaraujo-eng/GotaVertice/blob/main/public/consumption.js "Cálculos de leituras e consumo do GotaVértice"
