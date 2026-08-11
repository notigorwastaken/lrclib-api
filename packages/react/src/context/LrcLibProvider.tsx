import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { Client } from "lrclib-api";

const LrcLibContext = createContext<Client | null>(null);

export type LrcLibProviderProps = {
  children: ReactNode;
  apiKey?: string;
  baseUrl?: string;
  timeoutMs?: number;
};

/** Provides one stable LRCLIB client to all descendant hooks. */
export function LrcLibProvider({
  children,
  apiKey,
  baseUrl,
  timeoutMs,
}: LrcLibProviderProps) {
  const client = useMemo(
    () => new Client({ key: apiKey, url: baseUrl, timeoutMs }),
    [apiKey, baseUrl, timeoutMs],
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
