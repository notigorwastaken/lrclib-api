import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { Client } from "lrclib-api";

const LrcLibContext = createContext<Client | null>(null);

export type LrcLibProviderProps = {
  children: ReactNode;
  apiKey?: string;
  baseUrl?: string;
  timeoutMs?: number;
  /** Sent as the `Lrclib-Client` header, e.g. "MyPlayer v1.2.0 (https://example.com)". */
  clientName?: string;
};

/** Provides one stable LRCLIB client to all descendant hooks. */
export function LrcLibProvider({
  children,
  apiKey,
  baseUrl,
  timeoutMs,
  clientName,
}: LrcLibProviderProps) {
  const client = useMemo(
    () => new Client({ key: apiKey, url: baseUrl, timeoutMs, clientName }),
    [apiKey, baseUrl, timeoutMs, clientName],
  );

  return (
    <LrcLibContext.Provider value={client}>{children}</LrcLibContext.Provider>
  );
}

export function useLrcLib(): Client {
  const context = useContext(LrcLibContext);
  if (!context) {
    throw new Error("useLrcLib must be used within an LrcLibProvider");
  }
  return context;
}
