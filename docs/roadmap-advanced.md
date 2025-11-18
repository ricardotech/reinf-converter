# Roadmap v2 – escritórios que atendem Lucro Presumido e Lucro Real

**Visão:** evoluir o MVP para suportar obrigações de maior complexidade (R-4010, R-4020, R-4040, R-4080 e R-4099), regimes Lucro Presumido/Real e controle de múltiplas empresas/filiais com fluxo fiscal integral.

## Principais módulos a abrir na versão 2
1. **Compliance tributária avançada** – gerar grafos de obrigações do IR, PIS, Cofins, ISS, INSS e EFD-Reinf em um único cockpit, com regras condicionais para regimes Presumido/Real (inspiração: TOTVS RM e Nasajon oferecem visões integradas de múltiplos exercícios). 
2. **Gestão de múltiplas entidades e centros de custo** – suportar matriz+filiais/coligadas, replicando o modelo do Nasajon e do Sage com planos e relatórios consolidados. 
3. **Digitalização e workflow documental** – implementar OCR para notas fiscais recebidas/enviadas, fichas patrimoniais e contratos, com gatilhos de revisão contábil — prática comum em plataformas como ContaAzul e Granatum.
4. **NF-e/NFC-e/NFS-e + SPED (EFD/ECF)** – construir um motor genérico de emissão e recepção de XML que consolide CTe, NF-e, NFC-e e NFS-e, com versionamento para cada tipo de obrigação, replicando a estratégia da Domínio e SCI de manter pacotes atualizados.
5. **Gestão tributária e auditoria** – armazenamento histórico de XML, recibos, protocolos e logs de transmissão para atender auditorias de Lucro Real; permitir auditoria comparando dados do ERP vs. SPED (benchmark: Fortes e Alterdata têm módulos de auditoria e compliance fiscal). 

## Roadmap técnico (milestones)
| Fase | Entregável | Descrição | Referência | Indicador de sucesso |
| --- | --- | --- | --- | --- |
| Fase 1 | Modelagem tributária | Modelar regras para regime Presumido/Real (ex: alíquotas de PIS, Cofins, CSLL, IRPJ) e integrar ao motor de documentos. | TOTVS RM + Nasajon | 100% das obrigações diárias mapeadas em backlog |
| Fase 2 | NF-e engine (veja documento específico) | Criar API com assinatura digital, chamada aos serviços web da Sefaz e retentativas. | Portal NF-e (webServices) | NF-e emitidas automatizadas com logs e status (autorizado/denegado) |
| Fase 3 | SPED e EFD-Reinf expandida | Gerar eventos R-4010/4020/4040/4080 e R-4099, além de eSocial e EFD-Contribuições; incluir simulações de retificação com `indRetif`. | Leiaute R-4080 v2.1.2b + manual oficial | 80% dos principais eventos cobertos pelo gerador XML |
| Fase 4 | Relatórios de performance | DRE, balancete, DFC, KPI de impostos e impostos provisionados (por cliente e por grupo). | Nasajon + Fortes | Dashboards em tempo real publicados mensalmente |

## Estratégias de crescimento
- **Plano de suporte premium** para Lucro Real, trazendo consultoria fiscal e revisão de eventos, espelhando o modelo clássico da Alterdata e Fortes (suportes com especialistas fiscais). 
- **Plano de automação tributária** com alertas para LUCRO REAL (projeções de imposto, recalculo IRPJ/CSLL), controles de débitos e antecipações de impostos. 
- **Marketplace de integrações** (bancos, ERPs, NF-e, autenticação GovBR) para replicar os ecossistemas de Omie/ContaAzul.
