import { NextRequest, NextResponse } from "next/server";
import https from "https";
import * as forge from "node-forge";
import { signXml } from "@/lib/xml-signer";

export const runtime = "nodejs";

type Environment = "sandbox" | "production";

const ENDPOINTS = {
  sandbox: "https://pre-reinf.receita.economia.gov.br/recepcao/lotes",
  production: "https://reinf.receita.economia.gov.br/recepcao/lotes",
};

export async function POST(request: NextRequest) {
  try {
    const { xml, pfxBase64, password, environment } = await request.json();

    if (!xml || !pfxBase64 || !password || !environment) {
      return NextResponse.json(
        { error: "XML, certificado, senha e ambiente são obrigatórios" },
        { status: 400 }
      );
    }

    if (environment !== "sandbox" && environment !== "production") {
      return NextResponse.json(
        { error: "Ambiente deve ser 'sandbox' ou 'production'" },
        { status: 400 }
      );
    }

    // Step 1: Sign XML
    console.log("Assinando XML...");
    const signResult = signXml({ xml, pfxBase64, password });

    if (!signResult.success) {
      return NextResponse.json(
        { error: `Erro ao assinar XML: ${signResult.error}` },
        { status: 400 }
      );
    }

    const signedXml = signResult.signedXml;
    console.log("XML assinado com sucesso");

    // Step 2: Prepare certificate for TLS
    const pfxDer = forge.util.decode64(pfxBase64);
    const pfxBuffer = Buffer.from(pfxDer, "binary");

    // Step 3: Send to Receita Federal
    const endpoint = ENDPOINTS[environment as Environment];
    console.log(`Enviando para ${environment}: ${endpoint}`);

    const transmissionResult = await transmitToReceita(
      endpoint,
      signedXml,
      pfxBuffer,
      password
    );

    return NextResponse.json(transmissionResult);
  } catch (error) {
    console.error("Transmission error:", error);
    return NextResponse.json(
      {
        error: "Erro ao transmitir XML",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

async function transmitToReceita(
  url: string,
  signedXml: string,
  pfxBuffer: Buffer,
  password: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);

    const options: https.RequestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Content-Length": Buffer.byteLength(signedXml, "utf8"),
      },
      pfx: pfxBuffer,
      passphrase: password,
      rejectUnauthorized: true,
    };

    const req = https.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        console.log(`Response status: ${res.statusCode}`);
        console.log(`Response body: ${responseData.substring(0, 500)}`);

        // Parse response
        try {
          if (res.statusCode === 201 || res.statusCode === 200) {
            // Success - parse protocol from response
            const protocolMatch = responseData.match(
              /<numeroProtocolo>([^<]+)<\/numeroProtocolo>/
            );
            const statusMatch = responseData.match(/<status>([^<]+)<\/status>/);

            resolve({
              success: true,
              statusCode: res.statusCode,
              protocol: protocolMatch ? protocolMatch[1] : null,
              status: statusMatch ? statusMatch[1] : null,
              responseXml: responseData,
              environment: url.includes("pre-reinf") ? "sandbox" : "production",
            });
          } else if (res.statusCode === 422 || res.statusCode === 400) {
            // Validation error
            const errorMatch = responseData.match(
              /<mensagem>([^<]+)<\/mensagem>/
            );
            resolve({
              success: false,
              statusCode: res.statusCode,
              error: errorMatch
                ? errorMatch[1]
                : "Erro de validação no XML enviado",
              responseXml: responseData,
            });
          } else {
            // Other error
            resolve({
              success: false,
              statusCode: res.statusCode,
              error: `Erro HTTP ${res.statusCode}`,
              responseXml: responseData,
            });
          }
        } catch (parseError) {
          reject(
            new Error(
              `Erro ao processar resposta: ${parseError instanceof Error ? parseError.message : "Erro desconhecido"}`
            )
          );
        }
      });
    });

    req.on("error", (error) => {
      console.error("Request error:", error);
      reject(
        new Error(
          `Erro na conexão com a Receita Federal: ${error.message}`
        )
      );
    });

    req.write(signedXml, "utf8");
    req.end();
  });
}
