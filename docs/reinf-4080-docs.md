# REINF R-4080 · Documentação absorvida

## Fontes oficiais estudadas
- **Manual de Orientação ao Desenvolvedor da EFD-Reinf v2.7** (`docs/source/manual-desenvolvedor-efd-reinf-v2.7.pdf`):
  * Capítulos 3.5‑3.7 descrevem os requisitos de certificados, assinatura XML (RSA/SHA‑256), uso do ICP‑Brasil e a necessidade de TLS mútua para transmissão.
  * Capítulo 4 relata o modelo assíncrono com POST em `https://reinf.receita.economia.gov.br/recepcao/lotes` (produção) e `https://pre-reinf.receita.economia.gov.br/recepcao/lotes` (restrito), protocolo de recebimento, namespace (`envioLoteEventosAssincrono/v1_00_00`) e limites (54 MB, 50 eventos por lote).
  * As páginas 21‑24 documentam a consulta de lote (`/consulta/lotes/{numeroProtocolo}`) e a retrospectiva dos retornos dos eventos (recibo, situação, “aplicação de recepção” com os valores 1-Webservice síncrono, 2-Portal Web e 3-API assíncrona).

- **Leiaute EFD-Reinf v2.1.2b · Evento R-4080** (`docs/source/leiautes-efd-reinf-v2.1.2b/Leiautes da EFD-Reinf versão 2.1.2b.pdf`, pp. 55‑56):
  * Estrutura hierárquica `Reinf → evtRetRec → ideEvento | ideContri | ideEstab → ideFont → ideRend → infoRec → infoProcRet`.
  * Campos obrigatórios/validações: `perApur` no formato `AAAA-MM`, `nrInsc` (raiz ou completo para órgãos públicos), `nrInscEstab` com mesma raiz do declarante, `cnpjFont` único e distinto do declarante, `natRend` restrito a códigos do grupo 20 da Tabela 01, valores numéricos > 0, `dtFG` dentro do período e `infoProcRet` condicionado à existência do R-1070.
  * Informações de identificação do rendimento (`ideRend`) e receptores (`infoRec`) permitem até 999 datas por natureza e registros de processos (até 50 entradas, com campos `tpProcRet`, `nrProcRet`, `codSusp`, `vlrBaseSuspIR`, `vlrNIR`, `vlrDepIR`).

## Conhecimento complementar de parceiros
- **Contmatic (G5 / Autoatendimento)**: fluxos de lançamento manuel e importação de NFS-e, requisitos para o campo “Código Natureza de Rendimento” (20001‑20009) e a necessidade de consolidar lançamentos duplicados por data/fonte/natureza; também descreve painel de “Retenção no Recebimento” com status e exclusão.
- **TOTVS TDN (linha RM)**: orienta parametrizações (cadastro EFD-Reinf, filtro de eventos), explica origem dos dados no ERP e o tratamento de status (“Não transmitido”, “Inconsistente”, “Rejeitado”, “Autorizado”), confirmando como os registros se encaixam nos campos do leiaute oficial.

> Nota: também tentei buscar com a keyword `reinf evento 4080`; a pesquisa foi enviada via `duckduckgo.com` mas a leitura direta foi interrompida, porém os recursos acima já cobrem os mesmos tópicos.
