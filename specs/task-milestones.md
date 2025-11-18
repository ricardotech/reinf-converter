# Task Milestones

| # | Descrição | Status | Notas |
|---|-----------|--------|-------|
| 1 | Reconhecimento do repositório, leitura da planilha `mar_todos.xlsx` e revisão do conversor atual. | ✅ Concluído | Estrutura atual atende evt4010 com `lib/xls.ts`; planilha possui 398 linhas (8 colunas principais). |
| 2 | Levantamento de documentação oficial (Manual do Desenvolvedor 2.7 + Leiautes 2.1.2b) e blogs de parceiros (Contmatic, TOTVS) para o R-4080. | ✅ Concluído | PDFs baixados em `docs/source/`; artigos acessados via `r.jina.ai`. |
| 3 | Definir o mapeamento XLSX → XML específico para o evento R-4080 (grupos ideEstab/ideFont/ideRend/infoRec) e validar com o leiaute. | ✅ Concluído | Regras alinhadas ao Leiaute v2.1.2b (agrupamento por fonte + natureza + data, normalização de CNPJ/valores). |
| 4 | Gerar XML `evtRetRec` a partir do `mar_todos.xlsx`, validar (contagem, formato, campos obrigatórios) e registrar evidências. | ✅ Concluído | Script `scripts/generate-r4080.js` gera `output/R4080_mar_todos.xml` (342 fontes, 342 `infoRec`). |
| 5 | Redigir entrega textual (formas de transmissão, resumo do leiaute, validação do XML) e alinhar próximos passos/tests. | ⏳ Em andamento | Compilar achados + referências oficiais e explicar validações executadas. |
