"use client";

import { useState } from "react";
import { Shield, Upload, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCertificate } from "@/contexts/certificate-context";

export function CertificateUpload() {
  const { certificate, setCertificate, clearCertificate } = useCertificate();
  const [pfxFile, setPfxFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".pfx") && !file.name.endsWith(".p12")) {
        setError("Por favor, selecione um arquivo .pfx ou .p12");
        setPfxFile(null);
        return;
      }
      setPfxFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!pfxFile || !password) {
      setError("Por favor, selecione um certificado e digite a senha");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Convert file to base64
      const arrayBuffer = await pfxFile.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");

      // Validate certificate by calling API
      const response = await fetch("/api/validate-certificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pfxBase64: base64, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao validar certificado");
      }

      // Store in context (browser memory)
      setCertificate({
        pfxFile,
        password,
        pfxBase64: base64,
        info: result.info,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar certificado");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setPfxFile(null);
    setPassword("");
    setError(null);
    clearCertificate();
  };

  if (certificate) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              <CardTitle>Certificado Digital A1</CardTitle>
            </div>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
          <CardDescription>Certificado carregado e validado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-green-50 p-4 dark:bg-green-950/20">
            <p className="text-sm font-medium text-green-900 dark:text-green-100">
              {certificate.pfxFile.name}
            </p>
            {certificate.info && (
              <dl className="mt-3 space-y-1 text-xs text-green-800 dark:text-green-200">
                {certificate.info.subject && (
                  <div>
                    <dt className="inline font-medium">Titular: </dt>
                    <dd className="inline">{certificate.info.subject}</dd>
                  </div>
                )}
                {certificate.info.issuer && (
                  <div>
                    <dt className="inline font-medium">Emissor: </dt>
                    <dd className="inline">{certificate.info.issuer}</dd>
                  </div>
                )}
                {certificate.info.validTo && (
                  <div>
                    <dt className="inline font-medium">Válido até: </dt>
                    <dd className="inline">{certificate.info.validTo}</dd>
                  </div>
                )}
              </dl>
            )}
          </div>
          <Button type="button" variant="outline" onClick={handleClear} className="w-full gap-2">
            <X className="h-4 w-4" />
            Remover Certificado
          </Button>
          <p className="text-xs text-muted-foreground">
            O certificado está armazenado apenas na memória do navegador e será removido ao fechar a aba.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <CardTitle>Certificado Digital A1</CardTitle>
        </div>
        <CardDescription>
          Faça upload do seu certificado digital ICP-Brasil (A1) para assinar e transmitir o XML
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="certificate">Arquivo do Certificado (.pfx ou .p12)</Label>
          <Input
            id="certificate"
            type="file"
            accept=".pfx,.p12"
            onChange={handleFileChange}
            disabled={isLoading}
          />
        </div>

        {pfxFile && (
          <div className="space-y-2">
            <Label htmlFor="password">Senha do Certificado</Label>
            <Input
              id="password"
              type="password"
              placeholder="Digite a senha do certificado"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/20 dark:text-red-200">
            {error}
          </div>
        )}

        <Button
          type="button"
          onClick={handleUpload}
          disabled={!pfxFile || !password || isLoading}
          className="w-full gap-2"
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Validando...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Carregar e Validar Certificado
            </>
          )}
        </Button>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
          <p className="font-medium">Segurança:</p>
          <ul className="ml-4 mt-1 list-disc space-y-1">
            <li>O certificado permanece apenas na memória do navegador</li>
            <li>Não é armazenado em disco ou banco de dados</li>
            <li>É removido automaticamente ao fechar a aba</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
