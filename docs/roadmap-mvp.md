# Roadmap MVP – pequenas contabilidades (MEI/ME/Simples Nacional)

**Objetivo:** entregar um produto leve que automatiza a rotina contábil básica (obrigação acessória, emissão de NF-e e relacionamento com o cliente) e permite uma jornada semelhante a Tron/Contmatic, mas com foco em escritórios enxutos.

## Milestones
1. **Discovery + Conformidade** – mapear regimes tributários (MEI, ME, Simples) e estruturar estrutura de dados (clientes, CNPJ, atividades, natureza do rendimento) para alimentar R-4080, NF-e e obrigações mensais.
2. **Core financeiro + workflow fiscal** – implementar cadastro de notas de serviço/mercadorias, controle de contas a pagar/receber e cálculo automático de impostos (ISS, IRRF, DAS). Referência: Nibo, Omie e ContaAzul já automatizam fluxo de caixa + cobranças com emissão de boletos e NF-e/NFS-e (fonte: [Jornada Contábil](https://jornadacontabil.com.br/softwares-de-contabilidade/)).
3. **Módulo R-4080 light** – permitir geração do evento (ideEstab, ideFont, ideRend, infoRec) a partir de lançamentos, com preview e validação local antes de disponibilizar o XML (inspirado em Tron/Contmatic). Já há módulos semelhantes em Tron e G5, que importam NFSe e campos de natureza de rendimento 20001‑20009 ([Tron](https://atendimento.tron.com.br/kb/pt-br/article/409716/efd-reinf-r-4080-retencao-no-recebimento), [Contmatic](https://autoatendimento.contmatic.com.br/hc/pt-br/articles/36246756574099)).
4. **Dashboard e notificações** – painel com vencimentos, alertas de vencimento do DAS e SIG Sefaz; relatórios de status de eventos (não transmitido, inconsistências, aguardando autorização) como os listados no TOTVS Linha RM ([TDN Totvs](https://tdn.totvs.com/pages/releaseview.action?pageId=733190928)).
5. **Entrega/Exportação** – habilitar download do XML, assinatura digital (A1 ou A3) e um fluxo guiado de envio para produção restrita, com logs de recibos e protocolos.

## Funcionalidades mínimas
- **Cadastro e onboarding:** CNPJ/CPF, regime tributário, dados bancários, documentos digitalizados (facilitando o controle do MEI e do pequeno cliente). 
- **Financeiro básico:** contas a pagar/receber, fluxo de caixa, conciliação automática e emissão de boletos (semelhante a Nibo ou ContaAzul). 
- **Emissão de NF-e/NFS-e:** emissor integrado com validações fiscais, controle de séries, e atualização automática dos XML para R-4080. 
- **R-4080 simplificado:** agrupamento por fonte/natureza/data com validações de CNPJ e datas (baseado nos leiautes oficiais e no funcionamento da Tron). 
- **Relatórios e alertas:** indicadores de pendências, status dos eventos e previsões de impostos acumulados (inspiração: TOTVS RM). 
- **Suporte ao cliente:** chat / WhatsApp (como Omie) para agilizar acesso a próximos passos e replicar o atendimento humanizado dos grandes players.

## Adoção e validação
- Realizar pilotos com escritórios de pequeno porte (MEI/ME) para validar os gatilhos de valor: R-4080 automatizado, NF-e sem retrabalho e dashboards simples.
- Usar feedback de suporte (similar aos comentários de Fluxo Positivo) para iterar sobre o pós-venda e o onboarding.
