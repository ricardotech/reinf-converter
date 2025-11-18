"use client";

import { useState } from "react";
import { Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCertificate } from "@/contexts/certificate-context";

type TransmissionResult = {
  success: boolean;
  statusCode?: number;
  protocol?: string;
  status?: string;
  error?: string;
  responseXml?: string;
  environment?: string;
};

type Props = {
  xml: string;
  eventType: string;
};

export function XmlTransmission({ xml, eventType }: Props) {
  const { certificate } = useCertificate();
  const [environment, setEnvironment] = useState<"sandbox" | "production">("sandbox");
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [result, setResult] = useState<TransmissionResult | null>(null);

  const handleTransmit = async () => {
    if (!certificate) {
      alert("Por favor, carregue um certificado digital primeiro");
      return;
    }

    setIsTransmitting(true);
    setResult(null);

    try {
      const response = await fetch("/api/transmit-xml", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          xml,
          pfxBase64: certificate.pfxBase64,
          password: certificate.password,
          environment,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Erro ao transmitir",
      });
    } finally {
      setIsTransmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transmissão para Receita Federal</CardTitle>
        <CardDescription>
          Assine e transmita o XML para a Receita Federal usando seu certificado digital A1
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Label>Ambiente de Transmissão</Label>
          <div className="flex gap-4">
            <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input
                type="radio"
                name="environment"
                value="sandbox"
                checked={environment === "sandbox"}
                onChange={(e) => setEnvironment(e.target.value as "sandbox")}
                disabled={isTransmitting || !certificate}
                className="h-4 w-4"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">Sandbox (Testes)</p>
                <p className="text-xs text-muted-foreground">
                  Ambiente de produção restrita para testes
                </p>
              </div>
            </label>
            <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input
                type="radio"
                name="environment"
                value="production"
                checked={environment === "production"}
                onChange={(e) => setEnvironment(e.target.value as "production")}
                disabled={isTransmitting || !certificate}
                className="h-4 w-4"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">Produção</p>
                <p className="text-xs text-muted-foreground">
                  Envio oficial para a Receita Federal
                </p>
              </div>
            </label>
          </div>
        </div>

        {!certificate && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
            Por favor, carregue um certificado digital A1 antes de transmitir
          </div>
        )}

        <Button
          onClick={handleTransmit}
          disabled={!certificate || isTransmitting}
          className="w-full gap-2"
        >
          {isTransmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Transmitindo para {environment === "sandbox" ? "Sandbox" : "Produção"}...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Assinar e Transmitir para {environment === "sandbox" ? "Sandbox" : "Produção"}
            </>
          )}
        </Button>

        {result && (
          <div
            className={`rounded-lg border p-4 ${
              result.success
                ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20"
                : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
            }`}
          >
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}
              <div className="flex-1 space-y-2">
                <p
                  className={`font-medium ${
                    result.success
                      ? "text-green-900 dark:text-green-100"
                      : "text-red-900 dark:text-red-100"
                  }`}
                >
                  {result.success ? "Transmissão realizada com sucesso!" : "Erro na transmissão"}
                </p>

                {result.protocol && (
                  <div className="space-y-1 text-sm">
                    <p className="text-green-800 dark:text-green-200">
                      <strong>Número do Protocolo:</strong> {result.protocol}
                    </p>
                    {result.status && (
                      <p className="text-green-800 dark:text-green-200">
                        <strong>Status:</strong> {result.status}
                      </p>
                    )}
                    {result.environment && (
                      <p className="text-green-800 dark:text-green-200">
                        <strong>Ambiente:</strong>{" "}
                        {result.environment === "sandbox" ? "Sandbox (Testes)" : "Produção"}
                      </p>
                    )}
                  </div>
                )}

                {result.error && (
                  <p className="text-sm text-red-800 dark:text-red-200">{result.error}</p>
                )}

                {result.statusCode && (
                  <p className="text-xs text-muted-foreground">
                    Código HTTP: {result.statusCode}
                  </p>
                )}
              </div>
            </div>

            {result.protocol && (
              <div className="mt-3 rounded-md border border-green-300 bg-white/50 p-3 dark:bg-green-950/40">
                <p className="text-xs text-green-800 dark:text-green-200">
                  <strong>Próximos passos:</strong>
                </p>
                <ul className="ml-4 mt-1 list-disc space-y-1 text-xs text-green-800 dark:text-green-200">
                  <li>Anote o número do protocolo para consultas futuras</li>
                  <li>
                    Consulte o status em: GET /consulta/lotes/{result.protocol}
                  </li>
                  {environment === "sandbox" && (
                    <li>Após validar no sandbox, você pode enviar para produção</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
