# Motor de emissão de NF-e via API – viabilidade e roteiro técnico

## Por que é viável
A Receita publica todos os endpoints SOAP por estado (SVA, SVRS, SVC-AN, SVC-RS) no Portal NF-e, inclusive URLs de `NFeAutorizacao`, `RecepcaoEvento`, `NFeRetAutorizacao`, `NFeConsultaProtocolo`, etc. ([Fonte oficial](https://www.nfe.fazenda.gov.br/portal/webServices.aspx?tipoConteudo=OUC/YVNWZfo=)). Isso significa que podemos criar um motor que:
1. Monte XMLs na versão 4.00 (válida para NF-e/NFC-e) e assine com o certificado digital do cliente (A1 ou A3). 
2. Use o mesmo XML assinado para chamadas diferentes (autorização, consulta de protocolo, inutilização, eventuais contigências). 
3. Faça retry automático com os serviços de contingência (SVC-AN/SVC-RS) sempre que o endpoint principal estiver indisponível.

## Requisitos técnicos essenciais
- **Certificado digital ICP-Brasil** (A1 ou A3) no padrão PFX/P12 para handshake TLS com os servidores SOAP. O motor deve permitir upload desse arquivo e salvar a senha de forma segura, a fim de construir um `https.Agent` customizado.
- **Assinatura XML**: usar biblioteca como `xml-crypto` ou `node-forge` para gerar `<Signature>` no padrão W3C, utilizando o certificado no momento de montar o XML (igual ao que já ocorre para R-4080 no módulo atual). 
- **Schema e namespaces**: utilizar os XSDs oficiais (disponíveis no portal `Downloads → Esquemas XML`) e versionar namespaces (ex.: `http://www.portalfiscal.inf.br/nfe` + `nfeDadosMsg`). 
- **Stateful flow**: manter log de recibos (`nRec`), protocolos, status e mensagens de rejeição (codes 225, 301, 302 etc.) para alimentar a UI e permitir retentativas.

## Arquitetura proposta
1. **Builder XML** – função que converte faturas/serviços em um documento `infNFe` com chaves (CNPJ emitente/destinatário, modelo 55, série, número, itens e total). Este módulo pode reutilizar as rotinas de transformação já usadas para o R-4080.
2. **Signer** – adiciona `<Signature>` ao XML com o certificado do cliente e gera a `NFe` final. Pode ser exposto como utilitário no backend (Node/Next API). 
3. **Transmissor** – chama os endpoints SOAP (ex.: `https://nfe.svrs.rs.gov.br/ws/NfeAutorizacao4/NFeAutorizacao4.asmx`) usando o agente TLS com o PFX. Em caso de sucesso, grava protocolo. Em caso de contingência, repete a chamada nos URLs de backup listados no portal. 
4. **Consulta e distribuição** – implementa chamadas a `NFeRetAutorizacao`, `NFeConsultaProtocolo` e `NFeDistribuicaoDFe` para confirmar autorização e baixar XMLs, mostrando histórico ao usuário.

## Roadmap técnico
| Passo | Descrição | Métrica | Dependência |
| --- | --- | --- | --- |
| 1 | Validar certificados (upload, password, conversão para `key/cert`) | >95% dos clientes conseguem enviar auth down | TLS handshake com endpoint SVRS |
| 2 | Implementar assinatura XML e geração do lote com schema 4.00 | XMLs passados por XSD `nfe_v4.00` | Biblioteca `xml-crypto` |
| 3 | Transmissão com fallback aos serviços listados no portal | Entregar NF-e com status AUTORIZADO + log de protocolo | Endpoints listados em `webServices.aspx` |
| 4 | Visualização de recibos e desacoplamento do processo | Log de protocolos, `nRec`, `dhRecbto`, e `cStat` | NF-e e R-4080 compartilhando UI |

## Proximos passos operacionais
- Criar rotinas de testing com Sefaz (usar o ambiente `SVRS` e `SVC-AN` para sandbox). 
- Documentar procedimentos de contingência (virtual vs. estado). 
- Estudar certificação de serviços REST para NF-e (existe API moderna? Podem usar wrappers de SOAP com JSON). 
