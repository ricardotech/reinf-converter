"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { validateXmlTagName, type ValidationResult } from "@/lib/xls";

type ColumnMapperProps = {
  columns: string[];
  sanitizedColumns: Record<string, string>;
  onMappingChange: (mapping: Record<string, string>) => void;
};

// Reinf evt4010 field definitions with descriptions
const REINF_FIELDS = {
  "CNPJ_Benef": "CNPJ do beneficiário (obrigatório)",
  "nmBenef": "Nome do beneficiário (obrigatório)",
  "vlrBruto": "Valor bruto do pagamento (obrigatório)",
  "vlrBaseIR": "Base de cálculo do IR (opcional)",
  "vlrIR": "Valor do IR retido (opcional)",
  "tpRend": "Tipo de rendimento (opcional, padrão: 1503)",
  "descRend": "Descrição do rendimento (opcional)",
};

export function ColumnMapper({
  columns,
  sanitizedColumns,
  onMappingChange,
}: ColumnMapperProps) {
  const [mapping, setMapping] = useState<Record<string, string>>(sanitizedColumns);
  const [validation, setValidation] = useState<Record<string, ValidationResult>>({});
  const [modified, setModified] = useState<Record<string, boolean>>({});
  const [showReinfHelp, setShowReinfHelp] = useState(true);

  // Initialize validation for all columns
  useEffect(() => {
    const initialValidation: Record<string, ValidationResult> = {};
    columns.forEach((col) => {
      initialValidation[col] = validateXmlTagName(sanitizedColumns[col]);
    });
    setValidation(initialValidation);
  }, [columns, sanitizedColumns]);

  // Notify parent of mapping changes
  useEffect(() => {
    onMappingChange(mapping);
  }, [mapping, onMappingChange]);

  const handleChange = (column: string, value: string) => {
    const newMapping = { ...mapping, [column]: value };
    setMapping(newMapping);

    // Mark as modified if different from sanitized default
    const isModified = value !== sanitizedColumns[column];
    setModified({ ...modified, [column]: isModified });

    // Validate the new value
    const validationResult = validateXmlTagName(value);
    setValidation({ ...validation, [column]: validationResult });
  };

  const handleReset = (column: string) => {
    const newMapping = { ...mapping, [column]: sanitizedColumns[column] };
    setMapping(newMapping);
    setModified({ ...modified, [column]: false });

    // Re-validate with default value
    const validationResult = validateXmlTagName(sanitizedColumns[column]);
    setValidation({ ...validation, [column]: validationResult });
  };

  const handleResetAll = () => {
    setMapping(sanitizedColumns);
    setModified({});

    // Re-validate all with default values
    const newValidation: Record<string, ValidationResult> = {};
    columns.forEach((col) => {
      newValidation[col] = validateXmlTagName(sanitizedColumns[col]);
    });
    setValidation(newValidation);
  };

  // Quick fill with Reinf field name
  const handleQuickFill = (column: string, reinfField: string) => {
    handleChange(column, reinfField);
  };

  // Get suggested Reinf fields for a column based on similarity
  const getSuggestedReinfFields = (columnName: string): string[] => {
    const lower = columnName.toLowerCase();
    const suggestions: string[] = [];

    if (lower.includes('cnpj')) suggestions.push('CNPJ_Benef');
    if (lower.includes('nome') || lower.includes('name') || lower.includes('benef')) suggestions.push('nmBenef');
    if (lower.includes('bruto') || lower.includes('gross') || lower.includes('valor')) suggestions.push('vlrBruto');
    if (lower.includes('base') && lower.includes('ir')) suggestions.push('vlrBaseIR');
    if (lower.includes('ir') || lower.includes('irrf') || lower.includes('retido')) suggestions.push('vlrIR');
    if (lower.includes('tipo') && lower.includes('rend')) suggestions.push('tpRend');
    if (lower.includes('desc') && lower.includes('rend')) suggestions.push('descRend');

    return suggestions;
  };

  const hasModifications = Object.values(modified).some((m) => m);
  const hasErrors = Object.values(validation).some((v) => !v.isValid);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Mapeamento Reinf evt4010</CardTitle>
            <CardDescription>
              Mapeie suas colunas para os campos obrigatórios do Reinf
            </CardDescription>
          </div>
          {hasModifications && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetAll}
            >
              Resetar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        {showReinfHelp && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-blue-900 mb-1">Campos Reinf evt4010</p>
                <ul className="text-xs text-blue-800 space-y-0.5">
                  {Object.entries(REINF_FIELDS).map(([field, desc]) => (
                    <li key={field}>
                      <code className="bg-blue-100 px-1 rounded">{field}</code>: {desc}
                    </li>
                  ))}
                </ul>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReinfHelp(false)}
                className="h-6 px-2 text-xs"
              >
                ✕
              </Button>
            </div>
          </div>
        )}
        {hasErrors && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
            Alguns nomes de tags são inválidos. Corrija os erros abaixo.
          </div>
        )}
        <div className="space-y-4">
          {columns.map((column) => {
            const isInvalid = !validation[column]?.isValid;
            const isModified = modified[column];
            const suggestions = getSuggestedReinfFields(column);

            return (
              <div key={column} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`map-${column}`} className="text-sm font-medium">
                    {column}
                  </Label>
                  {isModified && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReset(column)}
                      className="h-6 px-2 text-xs"
                    >
                      Resetar
                    </Button>
                  )}
                </div>
                <Input
                  id={`map-${column}`}
                  value={mapping[column] || ""}
                  onChange={(e) => handleChange(column, e.target.value)}
                  className={`font-mono text-sm ${
                    isInvalid
                      ? "border-red-500 focus-visible:ring-red-500"
                      : isModified
                      ? "border-blue-500 focus-visible:ring-blue-500"
                      : ""
                  }`}
                  placeholder="Digite o nome do campo Reinf"
                />
                {suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {suggestions.map((reinfField) => (
                      <Button
                        key={reinfField}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickFill(column, reinfField)}
                        className="h-6 px-2 text-xs"
                      >
                        {reinfField}
                      </Button>
                    ))}
                  </div>
                )}
                {isInvalid && validation[column]?.error && (
                  <p className="text-xs text-red-600">
                    {validation[column].error}
                  </p>
                )}
                {!isInvalid && mapping[column] && REINF_FIELDS[mapping[column] as keyof typeof REINF_FIELDS] && (
                  <p className="text-xs text-green-600">
                    ✓ {REINF_FIELDS[mapping[column] as keyof typeof REINF_FIELDS]}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
