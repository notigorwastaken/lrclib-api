/** A fetch-compatible implementation, useful for testing or custom runtimes. */
type FetchImplementation = typeof globalThis.fetch;

/**
 * Supplies a fresh publish token. LRCLIB publish tokens are single-use, so a
 * provider is the safest way to send several `publishLyrics` / `flagLyrics`
 * requests from one client.
 */
type PublishTokenProvider = () => string | Promise<string>;

/** A fixed publish token, or a provider that returns a fresh one per request. */
type PublishTokenSource = string | PublishTokenProvider;

type ClientOptions = {
  /**
   * Publish token used by {@link Client.publishLyrics} and
   * {@link Client.flagLyrics}. Pass a function to get a fresh token for every
   * request, because LRCLIB tokens can only be used once.
   */
  key?: PublishTokenSource;
  /** LRCLIB API base URL. Only HTTP(S) URLs without credentials are accepted. */
  url?: string;
  /** Request timeout in milliseconds. Set to `0` to disable it. */
  timeoutMs?: number;
  /** Optional fetch-compatible implementation. */
  fetch?: FetchImplementation;
  /**
   * Application identifier sent as the `Lrclib-Client` header on every request,
   * for example `"MyPlayer v1.2.0 (https://example.com)"`. LRCLIB asks apps to
   * identify themselves; this header works in browsers, where `User-Agent`
   * cannot be set.
   */
  clientName?: string;
};

type ChallengeResponse = {
  prefix: string;
  target: string;
};

export {
  ChallengeResponse,
  ClientOptions,
  FetchImplementation,
  PublishTokenProvider,
  PublishTokenSource,
};
