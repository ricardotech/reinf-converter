import { create } from "xmlbuilder2";
import * as XLSX from "xlsx";

export type ConversionSummary = {
  fileName: string;
  sheetName: string;
  rowCount: number;
  columnCount: number;
  columns: string[];
};

export type ConversionPayload = {
  xml: string;
  summary: ConversionSummary;
};

export type ColumnMapping = Record<string, string>;

export type ValidationResult = {
  isValid: boolean;
  error?: string;
};

type RowRecord = Record<string, unknown>;

const sanitizeTagName = (value: string) => {
  const base = value
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9_.:-]/g, "")
    .replace(/^[^A-Za-z_]+/, "");

  return base.length > 0 ? base : "field";
};

export const validateXmlTagName = (tagName: string): ValidationResult => {
  if (!tagName || tagName.trim().length === 0) {
    return {
      isValid: false,
      error: "Tag name cannot be empty",
    };
  }

  const trimmed = tagName.trim();

  // XML tag names must start with a letter or underscore
  if (!/^[A-Za-z_]/.test(trimmed)) {
    return {
      isValid: false,
      error: "Tag must start with a letter or underscore",
    };
  }

  // Check for invalid characters
  if (/[^A-Za-z0-9_.:-]/.test(trimmed)) {
    return {
      isValid: false,
      error: "Tag contains invalid characters (only letters, numbers, _, -, :, . allowed)",
    };
  }

  // Check for reserved XML names (case-insensitive)
  if (/^xml/i.test(trimmed)) {
    return {
      isValid: false,
      error: 'Tag names cannot start with "xml" (reserved)',
    };
  }

  return { isValid: true };
};

const formatValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toString();
  }

  return String(value);
};

// Format number for Brazilian XML format (comma as decimal separator)
// Pattern: [0-9]{1,12}[,][0-9]{2}
const formatBrazilianNumber = (value: unknown): string => {
  if (value === null || value === undefined || value === "") {
    return "0,00";
  }

  let numValue: number;

  if (typeof value === "string") {
    // Remove any existing formatting
    const cleaned = value.replace(/[^\d.,-]/g, '').replace(',', '.');
    numValue = parseFloat(cleaned);
  } else if (typeof value === "number") {
    numValue = value;
  } else {
    return "0,00";
  }

  if (!Number.isFinite(numValue)) {
    return "0,00";
  }

  // Format to 2 decimal places and replace dot with comma
  return numValue.toFixed(2).replace('.', ',');
};

// Format CNPJ/CPF - remove dots, dashes, and slashes
// Pattern: [0-9]{11} for CPF or [0-9]{14} for CNPJ
const formatCNPJ = (value: unknown): string => {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const strValue = String(value);
  // Remove all non-digit characters
  const cleaned = strValue.replace(/\D/g, '');

  return cleaned;
};

// Helper function to get value from row using column mapping or fallback names
const getColumnValue = (
  row: RowRecord,
  reinfFieldName: string,
  fallbackNames: string[],
  columnMapping?: ColumnMapping
): unknown => {
  console.log(`  -> Looking for field: ${reinfFieldName}`);

  // If column mapping exists, look for the Reinf field name in the mapping
  if (columnMapping) {
    // Find which source column is mapped to this Reinf field
    const sourceColumn = Object.entries(columnMapping).find(
      ([, targetField]) => targetField === reinfFieldName
    )?.[0];

    console.log(`    Source column from mapping: ${sourceColumn}`);

    if (sourceColumn && row[sourceColumn] !== undefined) {
      console.log(`    Found value in mapping: ${row[sourceColumn]}`);
      return row[sourceColumn];
    }
  }

  // Fall back to checking standard field names
  console.log(`    Trying fallback names: ${[reinfFieldName, ...fallbackNames].join(", ")}`);
  for (const fieldName of [reinfFieldName, ...fallbackNames]) {
    if (row[fieldName] !== undefined) {
      console.log(`    Found value in fallback "${fieldName}": ${row[fieldName]}`);
      return row[fieldName];
    }
  }

  console.log(`    No value found, returning empty string`);
  return "";
};

export const convertWorkbookToXml = (
  buffer: ArrayBuffer,
  fileName: string,
  columnMapping?: ColumnMapping
): ConversionPayload => {
  const data = new Uint8Array(buffer);
  const workbook = XLSX.read(data, {
    type: "array",
    cellDates: true,
    cellStyles: false,
    raw: true,
  });

  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("The spreadsheet does not contain any worksheets.");
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<RowRecord>(sheet, {
    defval: "",
    raw: true,
    blankrows: false,
  });

  console.log("=== EXCEL DATA READ ===");
  console.log("Total rows:", rows.length);
  console.log("First row data:", JSON.stringify(rows[0], null, 2));
  if (rows.length > 1) {
    console.log("Second row data:", JSON.stringify(rows[1], null, 2));
  }

  const columnSet = new Set<string>();
  rows.forEach((row) => {
    Object.keys(row).forEach((key) => {
      const normalizedKey = key?.trim() || "column";
      columnSet.add(normalizedKey);
    });
  });

  const columns = Array.from(columnSet);
  console.log("Detected columns:", JSON.stringify(columns, null, 2));

  // Create Reinf XML structure
  const root = create({ version: "1.0" });
  const reinf = root.ele("Reinf");
  const evt4010 = reinf.ele("evt4010");

  // Extract period from first row if available
  const firstRow = rows[0] || {};
  const perApur = firstRow["Período de apuração"] || firstRow["Perodo_de_apurao"] || "2025-01";

  // Format period to YYYY-MM format if it's a date
  let formattedPerApur = String(perApur);
  if (perApur instanceof Date) {
    const year = perApur.getFullYear();
    const month = String(perApur.getMonth() + 1).padStart(2, '0');
    formattedPerApur = `${year}-${month}`;
  }

  console.log("Period from Excel:", perApur, "Formatted:", formattedPerApur);

  // Add ideEvento (event identification) - using first row or defaults
  const ideEvento = evt4010.ele("ideEvento");
  ideEvento.ele("indRetif").txt("1").up();
  ideEvento.ele("perApur").txt(formattedPerApur).up();
  ideEvento.ele("tpAmb").txt("1").up();
  ideEvento.ele("procEmi").txt("1").up();
  ideEvento.ele("verProc").txt("1.0").up();
  ideEvento.up();

  // Add ideContri (contributor identification)
  const ideContri = evt4010.ele("ideContri");
  ideContri.ele("tpInsc").txt("1").up();
  ideContri.ele("nrInsc").txt("nan").up();
  ideContri.up();

  // Add infoPgto for each row
  rows.forEach((row, index) => {
    console.log(`\n=== PROCESSING ROW ${index} ===`);
    console.log("Raw row data:", JSON.stringify(row, null, 2));
    console.log("Column mapping:", JSON.stringify(columnMapping, null, 2));

    const infoPgto = evt4010.ele("infoPgto");

    // ideEstab (establishment identification)
    const ideEstab = infoPgto.ele("ideEstab");
    const nrInscEstab = getColumnValue(row, "nrInscEstab", ["CNPJ do Estabelecimento", "CNPJ_do_Estabelecimento"], columnMapping) || "";

    const formattedNrInscEstab = formatCNPJ(nrInscEstab) || "nan";

    ideEstab.ele("tpInscEstab").txt("1").up();
    ideEstab.ele("nrInscEstab").txt(formattedNrInscEstab).up();
    ideEstab.up();

    // ideBenef (beneficiary identification) - using column mapping if available
    const ideBenef = infoPgto.ele("ideBenef");

    // Map Excel columns to Reinf fields
    const cnpj = getColumnValue(row, "CNPJ_Benef", ["CNPJ", "CNPJ da fonte pagadora", "CNPJ_da_fonte_pagadora"], columnMapping);
    const nmBenef = getColumnValue(row, "nmBenef", ["Nome", "Nome do beneficiário", "Razão Social"], columnMapping);

    const formattedCNPJ = formatCNPJ(cnpj);

    console.log("Extracted CNPJ:", cnpj);
    console.log("Formatted CNPJ:", formattedCNPJ);
    console.log("Extracted nmBenef:", nmBenef);

    ideBenef.ele("CNPJ_Benef").txt(formattedCNPJ).up();
    ideBenef.ele("nmBenef").txt(String(nmBenef)).up();

    // infoRend (income information) - using column mapping if available
    const infoRend = ideBenef.ele("infoRend");
    const tpRend = getColumnValue(row, "tpRend", ["Nat Rend Rec p Bem", "Nat_Rend_Rec_p_Bem", "Natureza"], columnMapping) || "1503";
    const descRend = getColumnValue(row, "descRend", ["Descrição", "Descricao"], columnMapping) || "COMISSÃO ADMINISTRAÇÃO DE CARTÕES";
    const vlrBruto = getColumnValue(row, "vlrBruto", ["Valor bruto", "Valor_bruto", "Valor Bruto", "Valor", "Bruto"], columnMapping) || 0;
    const vlrBaseIR = getColumnValue(row, "vlrBaseIR", ["Valor da base de cálculo do IRRF", "Valor_da_base_de_clculo_do_IRRF", "Base IR", "Base"], columnMapping) || vlrBruto;
    const vlrIR = getColumnValue(row, "vlrIR", ["Valor do IRRF", "Valor_do_IRRF", "Valor IR", "IR", "IRRF"], columnMapping) || 0;

    console.log("Extracted tpRend:", tpRend);
    console.log("Extracted descRend:", descRend);
    console.log("Extracted vlrBruto:", vlrBruto);
    console.log("Extracted vlrBaseIR:", vlrBaseIR);
    console.log("Extracted vlrIR:", vlrIR);

    // Format numeric values with Brazilian format (comma decimal separator)
    const formattedVlrBruto = formatBrazilianNumber(vlrBruto);
    const formattedVlrBaseIR = formatBrazilianNumber(vlrBaseIR);
    const formattedVlrIR = formatBrazilianNumber(vlrIR);

    console.log("Formatted vlrBruto:", formattedVlrBruto);
    console.log("Formatted vlrBaseIR:", formattedVlrBaseIR);
    console.log("Formatted vlrIR:", formattedVlrIR);

    infoRend.ele("tpRend").txt(String(tpRend)).up();
    infoRend.ele("descRend").txt(String(descRend)).up();
    infoRend.ele("vlrBruto").txt(formattedVlrBruto).up();
    infoRend.ele("vlrBaseIR").txt(formattedVlrBaseIR).up();
    infoRend.ele("vlrIR").txt(formattedVlrIR).up();
    infoRend.up();

    ideBenef.up();
    infoPgto.up();
  });

  evt4010.up();
  reinf.up();

  const xml = root.end({
    prettyPrint: true,
    indent: "  ",
    newline: "\n"
  });

  return {
    xml,
    summary: {
      fileName,
      sheetName,
      rowCount: rows.length,
      columnCount: columns.length,
      columns,
    },
  };
};
