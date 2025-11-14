"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

type XMLPreviewProps = {
  columns: string[];
  mapping: Record<string, string>;
  fileName: string;
};

export function XMLPreview({ columns, mapping, fileName }: XMLPreviewProps) {
  // Helper to get mapped value or show placeholder
  const getMappedField = (reinfField: string, defaultValue = "...") => {
    const sourceColumn = Object.entries(mapping).find(
      ([, target]) => target === reinfField
    )?.[0];
    return sourceColumn ? `{${sourceColumn}}` : defaultValue;
  };

  // Generate a sample Reinf evt4010 XML structure with the current mappings
  const generateSampleXML = () => {
    const lines: string[] = [];
    lines.push('<?xml version="1.0"?>');
    lines.push('<Reinf>');
    lines.push('  <evt4010>');
    lines.push('    <ideEvento>');
    lines.push('      <indRetif>1</indRetif>');
    lines.push('      <perApur>2025-01</perApur>');
    lines.push('      <tpAmb>1</tpAmb>');
    lines.push('      ...');
    lines.push('    </ideEvento>');
    lines.push('    <ideContri>');
    lines.push('      <tpInsc>1</tpInsc>');
    lines.push('      <nrInsc>nan</nrInsc>');
    lines.push('    </ideContri>');
    lines.push('    <infoPgto>');
    lines.push('      <ideEstab>...');
    lines.push('      <ideBenef>');
    lines.push(`        <CNPJ_Benef>${getMappedField('CNPJ_Benef')}</CNPJ_Benef>`);
    lines.push(`        <nmBenef>${getMappedField('nmBenef')}</nmBenef>`);
    lines.push('        <infoRend>');
    lines.push(`          <tpRend>${getMappedField('tpRend', '1503')}</tpRend>`);
    lines.push(`          <descRend>${getMappedField('descRend', 'COMISSÃO...')}</descRend>`);
    lines.push(`          <vlrBruto>${getMappedField('vlrBruto')}</vlrBruto>`);
    lines.push(`          <vlrBaseIR>${getMappedField('vlrBaseIR')}</vlrBaseIR>`);
    lines.push(`          <vlrIR>${getMappedField('vlrIR')}</vlrIR>`);
    lines.push('        </infoRend>');
    lines.push('      </ideBenef>');
    lines.push('    </infoPgto>');
    lines.push('    <!-- One infoPgto per row -->');
    lines.push('  </evt4010>');
    lines.push('</Reinf>');

    return lines.join('\n');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pré-visualização Reinf</CardTitle>
        <CardDescription className="text-xs">
          Estrutura evt4010 com seus mapeamentos de colunas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <pre className="text-xs bg-slate-50 p-3 rounded-md overflow-x-auto border border-slate-200 max-h-60 overflow-y-auto">
          <code className="text-slate-700">{generateSampleXML()}</code>
        </pre>
      </CardContent>
    </Card>
  );
}
