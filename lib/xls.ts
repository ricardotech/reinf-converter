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

// Helper function to get value from row using column mapping or fallback names
const getColumnValue = (
  row: RowRecord,
  reinfFieldName: string,
  fallbackNames: string[],
  columnMapping?: ColumnMapping
): unknown => {
  // If column mapping exists, look for the Reinf field name in the mapping
  if (columnMapping) {
    // Find which source column is mapped to this Reinf field
    const sourceColumn = Object.entries(columnMapping).find(
      ([, targetField]) => targetField === reinfFieldName
    )?.[0];

    if (sourceColumn && row[sourceColumn] !== undefined) {
      return row[sourceColumn];
    }
  }

  // Fall back to checking standard field names
  for (const fieldName of [reinfFieldName, ...fallbackNames]) {
    if (row[fieldName] !== undefined) {
      return row[fieldName];
    }
  }

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

  const columnSet = new Set<string>();
  rows.forEach((row) => {
    Object.keys(row).forEach((key) => {
      const normalizedKey = key?.trim() || "column";
      columnSet.add(normalizedKey);
    });
  });

  const columns = Array.from(columnSet);

  // Create Reinf XML structure
  const root = create({ version: "1.0" });
  const reinf = root.ele("Reinf");
  const evt4010 = reinf.ele("evt4010");

  // Add ideEvento (event identification) - using first row or defaults
  const ideEvento = evt4010.ele("ideEvento");
  ideEvento.ele("indRetif").txt("1").up();
  ideEvento.ele("perApur").txt("2025-01").up();
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
  rows.forEach((row) => {
    const infoPgto = evt4010.ele("infoPgto");

    // ideEstab (establishment identification)
    const ideEstab = infoPgto.ele("ideEstab");
    ideEstab.ele("tpInscEstab").txt("1").up();
    ideEstab.ele("nrInscEstab").txt("nan").up();
    ideEstab.up();

    // ideBenef (beneficiary identification) - using column mapping if available
    const ideBenef = infoPgto.ele("ideBenef");
    const cnpj = getColumnValue(row, "CNPJ_Benef", ["CNPJ"], columnMapping);
    const nmBenef = getColumnValue(row, "nmBenef", ["Nome"], columnMapping);

    ideBenef.ele("CNPJ_Benef").txt(String(cnpj)).up();
    ideBenef.ele("nmBenef").txt(String(nmBenef)).up();

    // infoRend (income information) - using column mapping if available
    const infoRend = ideBenef.ele("infoRend");
    const tpRend = getColumnValue(row, "tpRend", [], columnMapping) || "1503";
    const descRend = getColumnValue(row, "descRend", [], columnMapping) || "COMISSÃO ADMINISTRAÇÃO DE CARTÕES";
    const vlrBruto = getColumnValue(row, "vlrBruto", ["Valor Bruto", "Valor", "Bruto"], columnMapping) || 0;
    const vlrBaseIR = getColumnValue(row, "vlrBaseIR", ["Base IR", "Base"], columnMapping) || vlrBruto;
    const vlrIR = getColumnValue(row, "vlrIR", ["Valor IR", "IR", "IRRF"], columnMapping) || 0;

    infoRend.ele("tpRend").txt(String(tpRend)).up();
    infoRend.ele("descRend").txt(String(descRend)).up();
    infoRend.ele("vlrBruto").txt(String(vlrBruto)).up();
    infoRend.ele("vlrBaseIR").txt(String(vlrBaseIR)).up();
    infoRend.ele("vlrIR").txt(String(vlrIR)).up();
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
