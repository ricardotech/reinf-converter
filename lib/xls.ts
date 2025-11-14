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

type RowRecord = Record<string, unknown>;

const sanitizeTagName = (value: string) => {
  const base = value
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9_.:-]/g, "")
    .replace(/^[^A-Za-z_]+/, "");

  return base.length > 0 ? base : "field";
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

export const convertWorkbookToXml = (
  buffer: ArrayBuffer,
  fileName: string,
): ConversionPayload => {
  const data = new Uint8Array(buffer);
  const workbook = XLSX.read(data, {
    type: "array",
    cellDates: true,
    cellStyles: false,
  });

  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("The spreadsheet does not contain any worksheets.");
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<RowRecord>(sheet, {
    defval: "",
    raw: false,
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
  const root = create({ version: "1.0", encoding: "UTF-8" })
    .ele("workbook", { source: fileName })
    .ele("sheet", { name: sheetName });

  rows.forEach((row, index) => {
    const rowElement = root.ele("row", { index: index + 1 });
    const localTagUsage = new Map<string, number>();

    Object.entries(row).forEach(([key, value]) => {
      const normalizedKey = key?.trim() || "column";
      const sanitized = sanitizeTagName(normalizedKey);
      const currentCount = localTagUsage.get(sanitized) ?? 0;
      localTagUsage.set(sanitized, currentCount + 1);

      const tagName = currentCount === 0 ? sanitized : `${sanitized}_${currentCount + 1}`;

      rowElement.ele(tagName).txt(formatValue(value)).up();
    });

    rowElement.up();
  });

  const xml = root.end({ prettyPrint: true });

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
