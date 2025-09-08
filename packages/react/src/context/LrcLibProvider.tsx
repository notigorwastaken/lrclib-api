import React, { createContext, useContext } from "react";
import { Client } from "lrclib-api";

type LrcLibContextValue = Client;

const LrcLibContext = createContext<LrcLibContextValue | null>(null);

export function LrcLibProvider({
  children,
  apiKey,
  baseUrl,
}: {
  children: React.ReactNode;
  apiKey?: string;
  baseUrl?: string;
}) {
  const client = new Client({ key: apiKey, url: baseUrl });
  return <LrcLibContext.Provider value={client}>{children}</LrcLibContext.Provider>;
}

export function useLrcLib() {
  const ctx = useContext(LrcLibContext);
  if (!ctx) {
    throw new Error("useLrcLib must be used within an LrcLibProvider");
  }
  return ctx;
}
