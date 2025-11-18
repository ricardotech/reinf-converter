# REINF R-4080 · Formas de transmissão

1. **API REST (modelo assíncrono)** – Canal recomendado pelo Manual 2.7:
   * POST em `https://reinf.receita.economia.gov.br/recepcao/lotes` (produção) ou `https://pre-reinf.receita.economia.gov.br/recepcao/lotes` (produção restrita/testes) com `Content-Type: application/xml`, carregando `envioLoteEventosAssincrono-v1_00_00.xsd`.
   * Requer certificado digital ICP-Brasil (A1/A3) tanto para a conexão TLS quanto para assinatura do XML.
   * O retorno fornece um número de protocolo e o status (HTTP 201, código 1-em processamento, 7-ocorrências, 99-erro interno) e iconiza a aplicação como “API Lote Assíncrono”.
   * Posteriormente consulta GET em `/consulta/lotes/{numeroProtocolo}` para receber recibos, incluindo o campo “Aplicação de recepção” = 3.

2. **Portal Web da Receita (portal REINF / e-CAC)** – Mencionado no Manual como aplicação 2 (“Portal Web”):
   * Permite digitar manualmente um ou mais eventos R-4080 através da interface da Receita ou do Portal da EFD-Reinf.
   * O recibo daquele envio específico pode ser acessado pela mesma interface; o XML resultante pode depois ser baixado e reutilizado.

3. **Lote Síncrono (Webservice legado / SOAP)** – Aplicação 1 no manual:
   * Ainda disponível para testes ou migração, mas será descontinuada (capítulos removidos no Manual v2.7). Serve para enviar lote e obter recibo na mesma chamada.
   * Usa SOAP e endpoints `https://reinf.receita.economia.gov.br/recepcao` (sem `/lotes`), com certificados e assinaturas equivalentes; não é tratado diretamente pelo Next.js, mas documentado para referência histórica.

4. **Alternativas de parceiros/ERPs** (Contmatic, TOTVS e outros):
   * Eles integram seus módulos de ISS/NFSe com o campo “Código de Natureza de Rendimento” (20001‑20009) e exportam o XML correto do R-4080 para um serviço interno de assinatura/transmissão.
   * Essas plataformas permitem “anexar” certificados nas rotinas antes de enviar para ambientes de sandbox (produção restrita) e só depois promoverem para produção via lotes assíncronos.

> Dado o que li, o fluxo ideal é: gerar o XML conforme o leiaute, validar localmente, anexar um certificado A1 (upload) para estabelecer TLS+assinatura, fazer testes em sandbox (produção restrita), consultar o protocolo e só então promover o mesmo XML para o endpoint de produção. Esse pipeline será a espinha dorsal da integração pretendida.
