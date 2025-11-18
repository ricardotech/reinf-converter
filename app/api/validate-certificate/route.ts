import { NextRequest, NextResponse } from "next/server";
import * as forge from "node-forge";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { pfxBase64, password } = await request.json();

    if (!pfxBase64 || !password) {
      return NextResponse.json(
        { error: "Certificado e senha são obrigatórios" },
        { status: 400 }
      );
    }

    // Convert base64 to binary
    const pfxDer = forge.util.decode64(pfxBase64);

    // Parse PKCS#12
    let p12Asn1;
    try {
      p12Asn1 = forge.asn1.fromDer(pfxDer);
    } catch (error) {
      return NextResponse.json(
        { error: "Formato de certificado inválido" },
        { status: 400 }
      );
    }

    // Decrypt PKCS#12 with password
    let p12;
    try {
      p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);
    } catch (error) {
      return NextResponse.json(
        { error: "Senha incorreta ou certificado corrompido" },
        { status: 400 }
      );
    }

    // Extract certificate
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const certBag = certBags[forge.pki.oids.certBag];

    if (!certBag || certBag.length === 0) {
      return NextResponse.json(
        { error: "Nenhum certificado encontrado no arquivo" },
        { status: 400 }
      );
    }

    const cert = certBag[0].cert;
    if (!cert) {
      return NextResponse.json(
        { error: "Certificado inválido" },
        { status: 400 }
      );
    }

    // Check if certificate is valid (not expired)
    const now = new Date();
    const notBefore = cert.validity.notBefore;
    const notAfter = cert.validity.notAfter;

    if (now < notBefore) {
      return NextResponse.json(
        { error: "Certificado ainda não é válido" },
        { status: 400 }
      );
    }

    if (now > notAfter) {
      return NextResponse.json(
        { error: "Certificado expirado" },
        { status: 400 }
      );
    }

    // Extract certificate info
    const subject = cert.subject.attributes
      .map((attr) => `${attr.shortName}=${attr.value}`)
      .join(", ");
    const issuer = cert.issuer.attributes
      .map((attr) => `${attr.shortName}=${attr.value}`)
      .join(", ");

    return NextResponse.json({
      valid: true,
      info: {
        subject,
        issuer,
        validFrom: notBefore.toISOString(),
        validTo: notAfter.toISOString(),
      },
    });
  } catch (error) {
    console.error("Certificate validation error:", error);
    return NextResponse.json(
      { error: "Erro ao validar certificado" },
      { status: 500 }
    );
  }
}
