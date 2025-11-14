import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

const sanitizeTagName = (value: string) => {
  const base = value
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9_.:-]/g, "")
    .replace(/^[^A-Za-z_]+/, "");

  return base.length > 0 ? base : "field";
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file extension
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".xls") && !fileName.endsWith(".xlsx")) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload an .xls or .xlsx file." },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit" },
        { status: 400 }
      );
    }

    // Parse workbook
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON to extract column names
    const rows = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Spreadsheet is empty" },
        { status: 400 }
      );
    }

    // Extract unique column names
    const columnSet = new Set<string>();
    rows.forEach((row) => {
      Object.keys(row).forEach((key) => {
        const normalizedKey = key?.trim() || "column";
        columnSet.add(normalizedKey);
      });
    });

    const columns = Array.from(columnSet);

    // Create sanitized mappings
    const sanitizedColumns: Record<string, string> = {};
    columns.forEach((col) => {
      sanitizedColumns[col] = sanitizeTagName(col);
    });

    return NextResponse.json({
      columns,
      sanitizedColumns,
      sheetName,
      rowCount: rows.length,
    });
  } catch (error) {
    console.error("Error extracting columns:", error);
    return NextResponse.json(
      { error: "Failed to extract columns from file" },
      { status: 500 }
    );
  }
}
