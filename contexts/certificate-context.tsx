"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type CertificateData = {
  pfxFile: File;
  password: string;
  pfxBase64: string;
  info?: {
    issuer?: string;
    subject?: string;
    validFrom?: string;
    validTo?: string;
  };
};

type CertificateContextType = {
  certificate: CertificateData | null;
  setCertificate: (cert: CertificateData | null) => void;
  clearCertificate: () => void;
  hasCertificate: boolean;
};

const CertificateContext = createContext<CertificateContextType | undefined>(undefined);

export function CertificateProvider({ children }: { children: ReactNode }) {
  const [certificate, setCertificateState] = useState<CertificateData | null>(null);

  const setCertificate = useCallback((cert: CertificateData | null) => {
    setCertificateState(cert);
  }, []);

  const clearCertificate = useCallback(() => {
    setCertificateState(null);
  }, []);

  const hasCertificate = certificate !== null;

  return (
    <CertificateContext.Provider
      value={{
        certificate,
        setCertificate,
        clearCertificate,
        hasCertificate,
      }}
    >
      {children}
    </CertificateContext.Provider>
  );
}

export function useCertificate() {
  const context = useContext(CertificateContext);
  if (context === undefined) {
    throw new Error("useCertificate must be used within a CertificateProvider");
  }
  return context;
}
