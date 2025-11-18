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
import { ColumnMapper } from "@/components/column-mapper";
import { XMLPreview } from "@/components/xml-preview";
import { CertificateUpload } from "@/components/certificate-upload";
import { XmlTransmission } from "@/components/xml-transmission";

type ConversionSummary = {
  fileName: string;
  sheetName: string;
  rowCount: number;
  columnCount: number;
  columns: string[];
  eventType?: "evt4010" | "evt4080";
  stats?: {
    totalFonts?: number;
    totalInfoRec?: number;
  };
};

type EventType = "evt4010" | "evt4080";

type Status = "idle" | "extracting" | "ready" | "uploading" | "success" | "error";

const statusCopy: Record<Status, string> = {
  idle: "Selecione uma planilha para iniciar a conversão.",
  extracting: "Extraindo colunas da planilha...",
  ready: "Configure os nomes das tags XML e clique em Converter.",
  uploading: "Enviando e processando planilha...",
  success: "Planilha convertida. Revise e use o XML abaixo.",
  error: "Não foi possível converter a planilha. Verifique os detalhes e tente novamente.",
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
    extracting: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200",
    ready: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-200",
    uploading: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200",
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    error: "bg-destructive/10 text-destructive",
  };

  const labelMap: Record<Status, string> = {
    idle: "Inativo",
    extracting: "Analisando",
    ready: "Pronto",
    uploading: "Processando",
    success: "Concluído",
    error: "Atenção",
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
  const [columns, setColumns] = useState<string[]>([]);
  const [sanitizedColumns, setSanitizedColumns] = useState<Record<string, string>>({});
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [showMapper, setShowMapper] = useState(false);
  const [eventType, setEventType] = useState<EventType>("evt4010");

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
    setColumns([]);
    setSanitizedColumns({});
    setColumnMapping({});
    setShowMapper(false);
    setEventType("evt4010");
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0];

    if (!nextFile) {
      reset();
      return;
    }

    setFile(nextFile);
    setXml("");
    setSummary(null);
    setStatus("extracting");
    setMessage(statusCopy.extracting);

    // Extract columns from the file
    const formData = new FormData();
    formData.append("file", nextFile);

    try {
      const response = await fetch("/api/extract-columns", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Não foi possível extrair colunas.");
      }

      setColumns(payload.columns);
      setSanitizedColumns(payload.sanitizedColumns);
      setColumnMapping(payload.sanitizedColumns); // Initialize with sanitized values
      setShowMapper(true);
      setStatus("ready");
      setMessage(statusCopy.ready);
    } catch (error) {
      console.error(error);
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Erro ao extrair colunas.");
      setShowMapper(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!file) {
      setStatus("error");
      setMessage("Por favor, escolha uma planilha antes de solicitar a conversão.");
      return;
    }

    setStatus("uploading");
    setMessage(statusCopy.uploading);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("eventType", eventType);

    // Include column mapping if configured
    if (Object.keys(columnMapping).length > 0) {
      formData.append("mapping", JSON.stringify(columnMapping));
    }

    try {
      const response = await fetch("/api/xls-to-xml", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Não foi possível converter esta planilha.");
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
    setMessage("XML copiado para a área de transferência.");
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
              Importador minimalista para arquivos operacionais
            </h1>
          </div>
          <p className="text-base text-muted-foreground sm:text-lg">
            Carregue uma planilha, deixe a API Next.js transformá-la em XML e visualize o resultado instantaneamente--sem login, sem persistência.
            Construído com padrões shadcn/ui para facilitar a extensão em agentes, pipelines ou orquestrações R Jina AI.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <StatusBadge status={status} />
            <span>{message}</span>
          </div>
        </section>

        <section className={`grid grid-cols-1 gap-6 ${showMapper && !xml ? "lg:grid-cols-[1fr_1fr_1.25fr]" : xml ? "lg:grid-cols-[1fr_1.25fr]" : "lg:grid-cols-[1fr_1.25fr]"}`}>
          <Card>
            <form className="flex h-full flex-col gap-6" onSubmit={handleSubmit}>
              <CardHeader className="gap-6">
                <div>
                  <CardTitle>Entrada de planilha</CardTitle>
                  <CardDescription>
                    Aceita arquivos .xls ou .xlsx até {MAX_FILE_SIZE_MB}MB. Os dados permanecem nesta
                    aba do navegador--perfeito para dropboxes sem login.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-6">
                <div className="space-y-3">
                  <Label htmlFor="file">Arquivo de origem</Label>
                  <Input
                    id="file"
                    name="file"
                    type="file"
                    accept=".xls,.xlsx"
                    onChange={handleFileChange}
                    disabled={status === "uploading" || status === "extracting"}
                  />
                  <p className="text-xs text-muted-foreground">
                    Apenas processamento local--nenhum arquivo é persistido no servidor, seguindo as diretrizes de segurança de dados mínimos da base de conhecimento R Jina AI.
                  </p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="eventType">Tipo de Evento EFD-Reinf</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="eventType"
                        value="evt4010"
                        checked={eventType === "evt4010"}
                        onChange={(e) => setEventType(e.target.value as EventType)}
                        disabled={status === "uploading" || status === "extracting"}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">
                        <strong>R-4010</strong> (evt4010 - Retenção na Fonte)
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="eventType"
                        value="evt4080"
                        checked={eventType === "evt4080"}
                        onChange={(e) => setEventType(e.target.value as EventType)}
                        disabled={status === "uploading" || status === "extracting"}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">
                        <strong>R-4080</strong> (evtRetRec - Recebimentos)
                      </span>
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Selecione o tipo de evento EFD-Reinf que deseja gerar a partir da planilha.
                  </p>
                </div>

                {fileInsights && (
                  <div className="rounded-xl border bg-muted/40 p-4 text-sm">
                    <p className="text-sm font-medium text-foreground">{fileInsights.name}</p>
                    <dl className="mt-3 grid grid-cols-2 gap-2 text-muted-foreground">
                      <div>
                        <dt className="text-xs uppercase tracking-wide">Tamanho</dt>
                        <dd>{fileInsights.size}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide">Atualizado</dt>
                        <dd>{fileInsights.lastModified}</dd>
                      </div>
                    </dl>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="submit"
                  className="flex-1 gap-2"
                  disabled={!file || status === "uploading" || status === "extracting" || status === "idle"}
                >
                  {status === "uploading" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : status === "extracting" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  Converter para XML
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={reset}
                  disabled={status === "uploading" || status === "extracting"}
                >
                  <RefreshCcw className="h-4 w-4" />
                  Resetar
                </Button>
              </CardFooter>
            </form>
          </Card>

          {showMapper && (
            <div className="flex flex-col gap-6">
              <ColumnMapper
                columns={columns}
                sanitizedColumns={sanitizedColumns}
                onMappingChange={setColumnMapping}
              />
              <XMLPreview
                columns={columns}
                mapping={columnMapping}
                fileName={file?.name || "workbook.xlsx"}
              />
            </div>
          )}

          <Card className="flex h-full flex-col">
            <CardHeader className="gap-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Pré-visualização da resposta da API</CardTitle>
                  <CardDescription>
                    Payload XML transmitido diretamente de <code>/api/xls-to-xml</code>.
                  </CardDescription>
                </div>
                <StatusBadge status={status} />
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4">
              {summary ? (
                <div className="rounded-xl border bg-muted/40 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground">{summary.sheetName}</p>
                    {summary.eventType && (
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        {summary.eventType === "evt4010" ? "R-4010" : "R-4080"}
                      </span>
                    )}
                  </div>
                  <dl className="mt-3 grid gap-2 text-muted-foreground sm:grid-cols-2">
                    <div>
                      <dt className="text-xs uppercase tracking-wide">Arquivo</dt>
                      <dd>{summary.fileName}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide">Linhas</dt>
                      <dd>{summary.rowCount}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide">Colunas</dt>
                      <dd>{summary.columnCount}</dd>
                    </div>
                    {summary.eventType === "evt4080" && summary.stats && (
                      <>
                        <div>
                          <dt className="text-xs uppercase tracking-wide">Fontes únicas</dt>
                          <dd>{summary.stats.totalFonts || 0}</dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-wide">Registros infoRec</dt>
                          <dd>{summary.stats.totalInfoRec || 0}</dd>
                        </div>
                      </>
                    )}
                  </dl>
                  {summary.columns.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Campos</p>
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
                            +{summary.columns.length - 8} mais
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
                  O XML convertido aparecerá aqui assim que você enviar uma planilha.
                </p>
              )}

              <Textarea value={xml} readOnly placeholder="<xml />" className="max-h-[280px] min-h-[280px] font-mono text-sm" />
            </CardContent>
            <CardFooter className="flex flex-col gap-3 sm:flex-row">
              <Button type="button" variant="secondary" onClick={handleCopy} disabled={!xml} className="flex-1 gap-2">
                Copiar XML
              </Button>
              <Button type="button" onClick={handleDownload} disabled={!xml} className="flex-1 gap-2">
                <Download className="h-4 w-4" />
                Baixar
              </Button>
            </CardFooter>
          </Card>
        </section>

        {/* Certificate and Transmission Section */}
        {status === "success" && xml && (
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <CertificateUpload />
            <XmlTransmission xml={xml} eventType={summary?.eventType || "evt4010"} />
          </section>
        )}

        <section className="grid gap-4 rounded-2xl border bg-card/50 p-6 text-sm text-muted-foreground lg:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide">Estratégia da API</p>
            <p className="mt-2 text-foreground">
              A requisição acessa <code>POST /api/xls-to-xml</code>, que sanitiza a planilha, normaliza os nomes das colunas e emite XML via{" "}
              <code>xmlbuilder2</code>.
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide">Cobertura Excel</p>
            <p className="mt-2 text-foreground">
              Arquivos XLS e XLSX até {MAX_FILE_SIZE_MB}MB com filtragem de linhas em branco. Datas são convertidas para ISO 8601 para que automações downstream
              permaneçam determinísticas.
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide">Base da UI</p>
            <p className="mt-2 text-foreground">
              Os componentes são alimentados por shadcn/ui e tokens Tailwind v4, mantendo a superfície minimalista enquanto corresponde às diretrizes
              iniciais do Next.js 16 recomendadas pela documentação R Jina AI.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
