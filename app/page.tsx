"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ArrowRight,
  Download,
  FileSpreadsheet,
  Loader2,
  RefreshCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ConversionSummary = {
  fileName: string;
  sheetName: string;
  rowCount: number;
  columnCount: number;
  columns: string[];
};

type Status = "idle" | "uploading" | "success" | "error";

const statusCopy: Record<Status, string> = {
  idle: "Select a spreadsheet to start the conversion.",
  uploading: "Uploading and parsing workbook...",
  success: "Workbook converted. Review and use the XML payload below.",
  error: "We could not convert the spreadsheet. Check the details and try again.",
};

const MAX_FILE_SIZE_MB = 5;

const formatBytes = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

const StatusBadge = ({ status }: { status: Status }) => {
  const colorMap: Record<Status, string> = {
    idle: "bg-muted text-muted-foreground",
    uploading: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200",
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    error: "bg-destructive/10 text-destructive",
  };

  const labelMap: Record<Status, string> = {
    idle: "Idle",
    uploading: "Processing",
    success: "Ready",
    error: "Attention",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${colorMap[status]}`}>
      {labelMap[status]}
    </span>
  );
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [xml, setXml] = useState<string>("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>(statusCopy.idle);
  const [summary, setSummary] = useState<ConversionSummary | null>(null);

  const fileInsights = useMemo(() => {
    if (!file) return null;
    return {
      name: file.name,
      size: formatBytes(file.size),
      lastModified: new Date(file.lastModified).toLocaleString(),
    };
  }, [file]);

  const reset = useCallback(() => {
    setFile(null);
    setXml("");
    setSummary(null);
    setStatus("idle");
    setMessage(statusCopy.idle);
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0];

    if (!nextFile) {
      reset();
      return;
    }

    setFile(nextFile);
    setXml("");
    setSummary(null);
    setStatus("idle");
    setMessage(`Ready to convert "${nextFile.name}".`);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!file) {
      setStatus("error");
      setMessage("Please choose a spreadsheet before requesting a conversion.");
      return;
    }

    setStatus("uploading");
    setMessage(statusCopy.uploading);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/xls-to-xml", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to convert this spreadsheet.");
      }

      setXml(payload.xml);
      setSummary(payload.summary);
      setStatus("success");
      setMessage(statusCopy.success);
    } catch (error) {
      console.error(error);
      setStatus("error");
      setMessage(error instanceof Error ? error.message : statusCopy.error);
    }
  };

  const handleDownload = () => {
    if (!xml || !summary) return;
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${summary.sheetName || "workbook"}.xml`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    if (!xml) return;
    await navigator.clipboard.writeText(xml);
    setMessage("XML copied to the clipboard.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/50 px-4 py-12 font-sans text-foreground sm:px-6 lg:px-8">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="flex flex-col gap-4 text-center lg:text-left">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm lg:mx-0">
            <FileSpreadsheet className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">XLS + XLSX -&gt; XML</p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight sm:text-4xl">
              Minimal importer for operational file drops
            </h1>
          </div>
          <p className="text-base text-muted-foreground sm:text-lg">
            Upload a spreadsheet, let the Next.js API transform it into XML, and preview the result instantly--no login, no persistence.
            Built with shadcn/ui defaults so it is easy to extend across agents, pipelines, or R Jina AI orchestrations.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <StatusBadge status={status} />
            <span>{message}</span>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.25fr]">
          <Card>
            <form className="flex h-full flex-col gap-6" onSubmit={handleSubmit}>
              <CardHeader className="gap-6">
                <div>
                  <CardTitle>Spreadsheet intake</CardTitle>
                  <CardDescription>
                    Accepts .xls or .xlsx files up to {MAX_FILE_SIZE_MB}MB. Data remains within this
                    browser tab--perfect for non-login dropboxes.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-6">
                <div className="space-y-3">
                  <Label htmlFor="file">Source file</Label>
                  <Input
                    id="file"
                    name="file"
                    type="file"
                    accept=".xls,.xlsx"
                    onChange={handleFileChange}
                    disabled={status === "uploading"}
                  />
                  <p className="text-xs text-muted-foreground">
                    Only local parsing--no files are persisted on the server, matching data-min safety guidelines from the R Jina AI knowledge base.
                  </p>
                </div>

                {fileInsights && (
                  <div className="rounded-xl border bg-muted/40 p-4 text-sm">
                    <p className="text-sm font-medium text-foreground">{fileInsights.name}</p>
                    <dl className="mt-3 grid grid-cols-2 gap-2 text-muted-foreground">
                      <div>
                        <dt className="text-xs uppercase tracking-wide">Size</dt>
                        <dd>{fileInsights.size}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide">Updated</dt>
                        <dd>{fileInsights.lastModified}</dd>
                      </div>
                    </dl>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-3 sm:flex-row">
                <Button type="submit" className="flex-1 gap-2" disabled={!file || status === "uploading"}>
                  {status === "uploading" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  Convert to XML
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={reset}
                  disabled={status === "uploading"}
                >
                  <RefreshCcw className="h-4 w-4" />
                  Reset
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card className="flex h-full flex-col">
            <CardHeader className="gap-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>API response preview</CardTitle>
                  <CardDescription>
                    XML payload streamed directly from <code>/api/xls-to-xml</code>.
                  </CardDescription>
                </div>
                <StatusBadge status={status} />
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4">
              {summary ? (
                <div className="rounded-xl border bg-muted/40 p-4 text-sm">
                  <p className="font-medium text-foreground">{summary.sheetName}</p>
                  <dl className="mt-3 grid gap-2 text-muted-foreground sm:grid-cols-2">
                    <div>
                      <dt className="text-xs uppercase tracking-wide">File</dt>
                      <dd>{summary.fileName}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide">Rows</dt>
                      <dd>{summary.rowCount}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide">Columns</dt>
                      <dd>{summary.columnCount}</dd>
                    </div>
                  </dl>
                  {summary.columns.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Fields</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {summary.columns.slice(0, 8).map((column) => (
                          <span
                            key={column}
                            className="rounded-full border border-dashed px-3 py-1 text-xs text-muted-foreground"
                          >
                            {column}
                          </span>
                        ))}
                        {summary.columns.length > 8 && (
                          <span className="text-xs text-muted-foreground">
                            +{summary.columns.length - 8} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
                  Converted XML will appear here once you upload a workbook.
                </p>
              )}

              <Textarea value={xml} readOnly placeholder="<xml />" className="min-h-[280px] font-mono text-sm" />
            </CardContent>
            <CardFooter className="flex flex-col gap-3 sm:flex-row">
              <Button type="button" variant="secondary" onClick={handleCopy} disabled={!xml} className="flex-1 gap-2">
                Copy XML
              </Button>
              <Button type="button" onClick={handleDownload} disabled={!xml} className="flex-1 gap-2">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </CardFooter>
          </Card>
        </section>

        <section className="grid gap-4 rounded-2xl border bg-card/50 p-6 text-sm text-muted-foreground lg:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide">API strategy</p>
            <p className="mt-2 text-foreground">
              Request hits <code>POST /api/xls-to-xml</code>, which sanitizes the workbook, normalizes column names, and emits XML via{" "}
              <code>xmlbuilder2</code>.
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide">Excel coverage</p>
            <p className="mt-2 text-foreground">
              XLS and XLSX files up to {MAX_FILE_SIZE_MB}MB with blank row filtering. Dates are converted into ISO 8601 so downstream automations
              stay deterministic.
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide">UI baseline</p>
            <p className="mt-2 text-foreground">
              Components are powered by shadcn/ui and Tailwind v4 tokens, keeping the surface minimal while matching the Next.js 16 starter
              guidelines recommended by R Jina AI docs.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
