/** A fetch-compatible implementation, useful for testing or custom runtimes. */
type FetchImplementation = typeof globalThis.fetch;

type ClientOptions = {
  /** Publish token used only by {@link Client.publishLyrics}. */
  key?: string;
  /** LRCLIB API base URL. Only HTTP(S) URLs without credentials are accepted. */
  url?: string;
  /** Request timeout in milliseconds. Set to `0` to disable it. */
  timeoutMs?: number;
  /** Optional fetch-compatible implementation. */
  fetch?: FetchImplementation;
};

type ChallengeResponse = {
  prefix: string;
  target: string;
};

export { ChallengeResponse, ClientOptions, FetchImplementation };
