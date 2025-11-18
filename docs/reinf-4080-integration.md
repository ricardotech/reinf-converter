# Próximos passos para integrar R-4080 no gerador

## 1. Sequência “gerar → validar → transmitir”
- Gerar o XML `evtRetRec` após o upload do XLSX, já feito via `scripts/generate-r4080.js`, e exibir uma pré-visualização para o usuário com contagens (342 `ideFont` / 342 `infoRec`) e valores formatados.
- Validar localmente contra os requisitos do leiaute v2.1.2b (período, CNPJ 14 dígitos, natureza do grupo 20, valores positivos, datas no formato `AAAA-MM-DD`, campos obrigatórios) antes de liberar o botão de envio.
- Após validação, permitir upload do certificado digital A1 (PKCS#12 / `.pfx`) com senha; armazenar temporariamente no navegador/servidor para uso no envio TLS mútua e assinatura do lote.

## 2. Comunicação com a Receita
- Usar o certificado A1 para estabelecer a conexão HTTPS com `https://pre-reinf.receita.economia.gov.br/recepcao/lotes` (sandbox) usando `fetch`/`axios` com agente customizado (Node `https.Agent` com `pfx`, `passphrase` e `rejectUnauthorized: true`).
- Assinar o XML antes do envio no cliente (ou backend) usando biblioteca compatível (ex.: `xml-crypto`) com base no PFX carregado.
- Monitorar o retorno HTTP 201 + protocolo, armazenar o `numeroProtocolo` e exibir o recibo; se houver erros (HTTP 422/7/etc.), mostrar a mensagem oficial (“Aplicação de recepção”, códigos, validações).
- Consultar `https://pre-reinf.receita.economia.gov.br/consulta/lotes/{numeroProtocolo}` para verificar se o lote ficou autorizado antes de partir para produção.

## 3. Promover para produção
- Reaproveitar o mesmo XML assinado e reenviá-lo para o endpoint oficial (`https://reinf.receita.economia.gov.br/recepcao/lotes`), mantendo o mesmo protocolo de validação; isso garante que testes em sandbox foram executados antes da produção.
- Armazenar recibos e protocolos em um histórico dentro da aplicação para referência futura (exibe status, data/hora, `indRetif`, e `nrRecibo`).

## 4. UX / interface
- Introduzir telas com etapas numeradas: (1) upload XLSX, (2) geração e validação do XML, (3) upload do certificado, (4) envio sandbox (exibir protocolo), (5) promoção a produção.
- Detalhar instruções sobre os campos do PDF (p.ex., “Código Natureza de Rendimento” deve ser 20001‑20009) e fornecer links (Contmatic/TOTVS) para os parceiros que já operam o mesmo fluxo.
- Adicionar alertas para erros comuns (certificado expirado, assinatura inválida, campos fora do leiaute) usando as regras de validação identificadas no guia oficial.

## 5. Documentação e rastreabilidade
- Guardar referências das fontes oficiais (`docs/source/manual-desenvolvedor-efd-reinf-v2.7.pdf`, `docs/source/leiautes-efd-reinf-v2.1.2b/*.pdf`) no repositório para novos colaboradores.
- Manter os novos `.md` criados como “fonte única” para o entendimento do R-4080, atualizando conforme o manual evoluir (citar datas e versões).
