# Task Details

## Context
- Repositório Next.js com utilitário para converter XLSX em XML Reinf.
- Usuário solicitou estudo aprofundado sobre o evento **R-4080 (Retenção no Recebimento)** da EFD-Reinf usando fontes oficiais da Receita/Sped e blogs de parceiros técnicos.
- Também pediu a geração manual de um XML do evento R-4080 a partir da planilha `mar_todos.xlsx`, com validação do resultado.

## Objetivos
1. Levantar todas as maneiras oficiais disponíveis hoje para transmitir eventos R-4080 (e quaisquer XML Reinf) para a Receita, citando a base normativa.
2. Resumir o leiaute oficial do evento R-4080 (registros/campos, regras e formatação) diretamente do pacote de leiautes 2.1.2b.
3. Converter o arquivo `mar_todos.xlsx` em um XML válido do evento R-4080 (estrutura `Reinf > evtRetRec`) e validar o conteúdo antes de entregar.
4. Registrar o andamento em `/specs/task-milestones.md` e responder ao usuário com achados, dúvidas ou próximos passos.

## Escopo Técnico
- **Entrada principal:** `mar_todos.xlsx` (Planilha1, 398 linhas com período, CNPJ estabelecimento/fonte, natureza, valores e datas).
- **Conversão desejada:** gerar um documento `<Reinf><evtRetRec>...</evtRetRec></Reinf>` obedecendo ao leiaute oficial (versão 2.1.2b).
- **Ferramentas disponíveis:** Node + `xlsx`/`xmlbuilder2`, scripts auxiliares via CLI, certificados não necessários para conversão local.

## Fontes Oficiais (baixadas em `docs/source/`)
- `manual-desenvolvedor-efd-reinf-v2.7.pdf` – Manual de Orientação ao Desenvolvedor (publicado 12/11/2025). Contém capítulos sobre certificado digital, envio REST assíncrono e valores aceitos no campo “Aplicação de recepção”.
- `leiautes-efd-reinf-v2.1.2b/Leiautes da EFD-Reinf versão 2.1.2b.pdf` – Leiaute com o detalhamento do evento R-4080 (pp. 55-56) e anexos de regras/tabelas.
- `leiautes-efd-reinf-v2.1.2b/*.pdf` – anexos de tabelas e regras complementares.

## Fontes de Parceiros (blogs/doc bases)
- Contmatic (autoatendimento) – Tutorial “G5 | Evento da EFD Reinf – R-4080: Retenção no recebimento” descreve procedimentos no sistema e códigos de natureza (20001–20009) e rotinas de transmissão.
- TOTVS TDN – Artigo “R-4080 – Retenção no Recebimento - Linha RM” cobre parametrizações, origem de dados e fluxo de status (“Não transmitido”, “Rejeitado”, etc.).

## Entregáveis Planejados
- Resumo textual das formas de transmissão com citações das páginas do manual oficial.
- Resumo textual do leiaute R-4080 com referências ao PDF oficial e tabela 01.
- Arquivo XML pronto (ex.: `output/R4080_mar_todos.xml`) + notas de validação (contagem de registros, grouping, formatações).
- Atualização contínua de `/specs/task-milestones.md` com o status dos blocos de trabalho.
