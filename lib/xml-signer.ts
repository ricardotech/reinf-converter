import * as forge from "node-forge";
import { SignedXml } from "xml-crypto";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

export type SignXmlOptions = {
  xml: string;
  pfxBase64: string;
  password: string;
};

export type SignXmlResult = {
  signedXml: string;
  success: boolean;
  error?: string;
};

export function signXml(options: SignXmlOptions): SignXmlResult {
  try {
    const { xml, pfxBase64, password } = options;

    // Parse PKCS#12
    const pfxDer = forge.util.decode64(pfxBase64);
    const p12Asn1 = forge.asn1.fromDer(pfxDer);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

    // Extract private key
    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag];
    if (!keyBag || keyBag.length === 0) {
      throw new Error("Chave privada não encontrada no certificado");
    }
    const privateKey = keyBag[0].key;
    if (!privateKey) {
      throw new Error("Chave privada inválida");
    }

    // Extract certificate
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const certBag = certBags[forge.pki.oids.certBag];
    if (!certBag || certBag.length === 0) {
      throw new Error("Certificado não encontrado");
    }
    const cert = certBag[0].cert;
    if (!cert) {
      throw new Error("Certificado inválido");
    }

    // Convert private key to PEM format
    const privateKeyPem = forge.pki.privateKeyToPem(privateKey);

    // Convert certificate to PEM format
    const certPem = forge.pki.certificateToPem(cert);

    // Parse XML
    const doc = new DOMParser().parseFromString(xml, "text/xml");

    // Find the root element to sign (should have an 'id' attribute)
    const elementToSign = doc.documentElement.getElementsByTagName("*")[0];

    if (!elementToSign) {
      throw new Error("Elemento para assinar não encontrado no XML");
    }

    const idAttr = elementToSign.getAttribute("id");
    if (!idAttr) {
      throw new Error("Atributo 'id' não encontrado no elemento raiz do evento");
    }

    // Create signature
    const sig = new SignedXml({
      privateKey: privateKeyPem,
      publicCert: certPem,
      signatureAlgorithm: "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256",
      canonicalizationAlgorithm: "http://www.w3.org/TR/2001/REC-xml-c14n-20010315",
    });

    // Add reference to the element with ID
    sig.addReference({
      xpath: `//*[@id='${idAttr}']`,
      digestAlgorithm: "http://www.w3.org/2001/04/xmlenc#sha256",
      transforms: [
        "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
        "http://www.w3.org/TR/2001/REC-xml-c14n-20010315",
      ],
    });

    // Compute signature
    sig.computeSignature(xml, {
      location: { reference: `//*[@id='${idAttr}']`, action: "append" },
    });

    // Get signed XML
    const signedXml = sig.getSignedXml();

    return {
      signedXml,
      success: true,
    };
  } catch (error) {
    console.error("XML signing error:", error);
    return {
      signedXml: "",
      success: false,
      error: error instanceof Error ? error.message : "Erro ao assinar XML",
    };
  }
}
