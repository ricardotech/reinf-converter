import { NextRequest, NextResponse } from "next/server";

import { convertWorkbookToXmlByType, type ColumnMapping, type EventType } from "@/lib/xls";

const ACCEPTED_EXTENSIONS = new Set([".xls", ".xlsx"]);
const ACCEPTED_MIME_TYPES = new Set([
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // ~5MB

const getExtension = (fileName: string) => {
  const match = /\.[0-9a-z]+$/i.exec(fileName);
  return match ? match[0].toLowerCase() : "";
};

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A spreadsheet file is required." }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "The uploaded file is empty." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: "The file is larger than the 5MB safety limit.",
        },
        { status: 400 },
      );
    }

    const extension = getExtension(file.name);

    if (!ACCEPTED_EXTENSIONS.has(extension)) {
      return NextResponse.json(
        { error: "Unsupported file extension. Please upload .xls or .xlsx files." },
        { status: 400 },
      );
    }

    if (file.type && !ACCEPTED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Unsupported MIME type. Please upload an Excel spreadsheet." },
        { status: 400 },
      );
    }

    // Extract optional column mapping from form data
    const mappingJson = formData.get("mapping");
    let columnMapping: ColumnMapping | undefined;

    if (mappingJson && typeof mappingJson === "string") {
      try {
        columnMapping = JSON.parse(mappingJson);
      } catch (error) {
        return NextResponse.json(
          { error: "Invalid column mapping format" },
          { status: 400 }
        );
      }
    }

    // Extract optional event type from form data
    const eventTypeParam = formData.get("eventType");
    let eventType: EventType = "evt4010"; // default to R-4010

    if (eventTypeParam && typeof eventTypeParam === "string") {
      if (eventTypeParam === "evt4010" || eventTypeParam === "evt4080") {
        eventType = eventTypeParam;
      } else {
        return NextResponse.json(
          { error: "Invalid event type. Must be 'evt4010' or 'evt4080'" },
          { status: 400 }
        );
      }
    }

    const result = convertWorkbookToXmlByType(
      await file.arrayBuffer(),
      file.name,
      eventType,
      columnMapping
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("XLS to XML conversion failed", error);
    return NextResponse.json(
      {
        error: "We could not convert the spreadsheet. Please validate the file and try again.",
      },
      { status: 500 },
    );
  }
}
