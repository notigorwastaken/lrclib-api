import { KeyError, NoResultError, NotFoundError, RequestError } from "./errors";
import type {
  ChallengeResponse,
  ClientOptions,
  FetchImplementation,
  PublishTokenSource,
} from "./types/Client";
import type {
  FindLyricsResponse,
  FlagLyrics,
  PublishLyrics,
  Query,
  Search,
} from "./types/Lyrics";
import type { LyricLine } from "./types/Utils";
import { parseLocalLyrics } from "./utils";

const DEFAULT_BASE_URL = "https://lrclib.net/api";
const DEFAULT_TIMEOUT_MS = 15_000;
const CLIENT_HEADER = "Lrclib-Client";

type QueryValue = string | number | undefined;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function isLyricsResponse(value: unknown): value is FindLyricsResponse {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === "number" &&
    Number.isSafeInteger(value.id) &&
    typeof value.name === "string" &&
    typeof value.trackName === "string" &&
    typeof value.artistName === "string" &&
    typeof value.albumName === "string" &&
    typeof value.duration === "number" &&
    Number.isFinite(value.duration) &&
    typeof value.instrumental === "boolean" &&
    isNullableString(value.plainLyrics) &&
    isNullableString(value.syncedLyrics) &&
    (value.lyricsfile === undefined || isNullableString(value.lyricsfile))
  );
}

function normalizeBaseUrl(value: string, hasPublishToken: boolean): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch (cause) {
    throw new TypeError("The LRCLIB base URL is invalid", { cause });
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new TypeError("The LRCLIB base URL must use HTTP or HTTPS");
  }
  if (url.username || url.password) {
    throw new TypeError("The LRCLIB base URL must not contain credentials");
  }
  if (url.search || url.hash) {
    throw new TypeError("The LRCLIB base URL must not contain a query or hash");
  }
  if (hasPublishToken && url.protocol !== "https:") {
    throw new TypeError("HTTPS is required when a publish token is configured");
  }

  url.pathname = `${url.pathname.replace(/\/+$/, "")}/`;
  return url;
}

function durationInSeconds(durationMs: number | undefined): number | undefined {
  if (durationMs === undefined) return undefined;
  if (!Number.isFinite(durationMs) || durationMs < 0) {
    throw new RangeError("Track duration must be a non-negative finite number");
  }
  return durationMs / 1000;
}

function validateText(value: unknown, field: string): asserts value is string {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError(`${field} must not be empty`);
  }
}

function normalizeTokenSource(
  key: ClientOptions["key"],
): PublishTokenSource | undefined {
  if (typeof key === "function") return key;
  return key?.trim() || undefined;
}

function normalizeClientName(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new TypeError("clientName must be a string");
  }

  const name = value.trim();
  if (!name) return undefined;
  if (!/^[\x20-\x7e]+$/.test(name)) {
    throw new TypeError(
      "clientName must contain only printable ASCII characters",
    );
  }
  return name;
}

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim() !== "";
}

/** A type-safe client for the LRCLIB API. */
export class Client {
  private readonly baseUrl: URL;
  private readonly tokenSource?: PublishTokenSource;
  private readonly clientName?: string;
  private readonly timeoutMs: number;
  private readonly fetchImplementation: FetchImplementation;

  constructor(options: ClientOptions = {}) {
    const tokenSource = normalizeTokenSource(options.key);
    this.baseUrl = normalizeBaseUrl(
      options.url ?? DEFAULT_BASE_URL,
      tokenSource !== undefined,
    );
    this.clientName = normalizeClientName(options.clientName);

    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    if (!Number.isFinite(timeoutMs) || timeoutMs < 0) {
      throw new RangeError("timeoutMs must be a non-negative finite number");
    }

    const fetchImplementation = options.fetch ?? globalThis.fetch;
    if (typeof fetchImplementation !== "function") {
      throw new TypeError(
        "No fetch implementation is available; pass one in ClientOptions",
      );
    }

    this.tokenSource = tokenSource;
    this.timeoutMs = timeoutMs;
    this.fetchImplementation = fetchImplementation;
  }

  private createUrl(path: string, query: Record<string, QueryValue> = {}): URL {
    const url = new URL(path.replace(/^\/+/, ""), this.baseUrl);

    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }

    return url;
  }

  private safeUrl(url: URL): string {
    return `${url.origin}${url.pathname}`;
  }

  private async request(
    url: URL,
    options: RequestInit = {},
  ): Promise<Response> {
    const controller = new AbortController();
    let timedOut = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const abortFromCaller = (): void => controller.abort();
    if (options.signal?.aborted) {
      controller.abort();
    } else {
      options.signal?.addEventListener("abort", abortFromCaller, {
        once: true,
      });
    }

    if (this.timeoutMs > 0) {
      timeout = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, this.timeoutMs);
    }

    const init: RequestInit = { ...options, signal: controller.signal };
    if (this.clientName) {
      const headers = new Headers(options.headers);
      if (!headers.has(CLIENT_HEADER))
        headers.set(CLIENT_HEADER, this.clientName);
      init.headers = headers;
    }

    try {
      return await this.fetchImplementation(url, init);
    } catch (cause) {
      const message = timedOut
        ? `LRCLIB request timed out after ${this.timeoutMs} ms`
        : options.signal?.aborted
          ? "LRCLIB request was aborted"
          : "LRCLIB network request failed";

      throw new RequestError(message, {
        cause,
        url: this.safeUrl(url),
      });
    } finally {
      if (timeout !== undefined) clearTimeout(timeout);
      options.signal?.removeEventListener("abort", abortFromCaller);
    }
  }

  private httpError(response: Response, url: URL): RequestError {
    const suffix = response.statusText ? ` ${response.statusText}` : "";
    return new RequestError(
      `LRCLIB request failed with status ${response.status}${suffix}`,
      {
        status: response.status,
        statusText: response.statusText,
        url: this.safeUrl(url),
      },
    );
  }

  private async readJson(response: Response, url: URL): Promise<unknown> {
    try {
      return await response.json();
    } catch (cause) {
      throw new RequestError("LRCLIB returned an invalid JSON response", {
        cause,
        status: response.status,
        statusText: response.statusText,
        url: this.safeUrl(url),
      });
    }
  }

  /** Searches LRCLIB by free text or track metadata. */
  public async searchLyrics(
    info: Search,
    options?: RequestInit,
  ): Promise<FindLyricsResponse[]> {
    if ("query" in info) {
      validateText(info.query, "query");
    } else if ("track_name" in info) {
      validateText(info.track_name, "track_name");
    } else {
      throw new TypeError("A query or track_name must be provided");
    }

    const url = this.createUrl("search", {
      q: "query" in info ? info.query : undefined,
      track_name: "track_name" in info ? info.track_name : undefined,
      artist_name: info.artist_name,
      album_name: info.album_name,
      duration: durationInSeconds(info.duration),
    });
    const response = await this.request(url, options);
    if (!response.ok) throw this.httpError(response, url);

    const body = await this.readJson(response, url);
    if (body === null) throw new NoResultError();
    if (!Array.isArray(body) || !body.every(isLyricsResponse)) {
      throw new RequestError("LRCLIB returned an invalid search response", {
        status: response.status,
        url: this.safeUrl(url),
      });
    }

    return body;
  }

  /** Gets a track by LRCLIB ID or exact metadata. */
  public async findLyrics(
    info: Query,
    options?: RequestInit,
  ): Promise<FindLyricsResponse> {
    let url: URL;

    if ("id" in info && info.id !== undefined) {
      if (!Number.isSafeInteger(info.id) || info.id <= 0) {
        throw new RangeError("Track ID must be a positive safe integer");
      }
      url = this.createUrl(`get/${info.id}`);
    } else {
      validateText(info.track_name, "track_name");
      validateText(info.artist_name, "artist_name");
      url = this.createUrl("get", {
        track_name: info.track_name,
        artist_name: info.artist_name,
        album_name: info.album_name,
        duration: durationInSeconds(info.duration),
      });
    }

    const response = await this.request(url, options);
    if (response.status === 404) {
      throw new NotFoundError("Track was not found", {
        statusText: response.statusText,
        url: this.safeUrl(url),
      });
    }
    if (!response.ok) throw this.httpError(response, url);

    const body = await this.readJson(response, url);
    if (!isLyricsResponse(body)) {
      throw new RequestError("LRCLIB returned an invalid lyrics response", {
        status: response.status,
        url: this.safeUrl(url),
      });
    }

    return body;
  }

  /** Gets plain lyrics parsed into individual lines. */
  public async getUnsynced(
    info: Query,
    options?: RequestInit,
  ): Promise<LyricLine[] | null> {
    try {
      const body = await this.findLyrics(info, options);
      if (body.instrumental) return [{ text: "[Instrumental]" }];
      if (!body.plainLyrics) return null;
      return parseLocalLyrics(body.plainLyrics).unsynced;
    } catch (error) {
      if (error instanceof NotFoundError) return null;
      throw error;
    }
  }

  /** Gets synchronized lyrics parsed into lines with start times in seconds. */
  public async getSynced(
    info: Query,
    options?: RequestInit,
  ): Promise<LyricLine[] | null> {
    try {
      const body = await this.findLyrics(info, options);
      if (body.instrumental) return [{ text: "[Instrumental]" }];
      if (!body.syncedLyrics) return null;
      return parseLocalLyrics(body.syncedLyrics).synced;
    } catch (error) {
      if (error instanceof NotFoundError) return null;
      throw error;
    }
  }

  /**
   * Gets the raw Lyricsfile YAML document of a track, or `null` when the track
   * or its Lyricsfile is unavailable. The YAML is returned unparsed so the
   * client stays dependency-free; use the YAML parser of your choice.
   */
  public async getLyricsfile(
    info: Query,
    options?: RequestInit,
  ): Promise<string | null> {
    try {
      const body = await this.findLyrics(info, options);
      return hasText(body.lyricsfile) ? (body.lyricsfile ?? null) : null;
    } catch (error) {
      if (error instanceof NotFoundError) return null;
      throw error;
    }
  }

  /**
   * Requests the proof-of-work challenge used to obtain a publish token.
   * Challenges expire after five minutes; the token is `{prefix}:{nonce}` and
   * can only be used once.
   */
  public async requestChallenge(
    options?: RequestInit,
  ): Promise<ChallengeResponse> {
    const url = this.createUrl("request-challenge");
    const headers = new Headers(options?.headers);
    headers.set("Accept", "application/json");

    const response = await this.request(url, {
      ...options,
      method: "POST",
      headers,
    });
    if (!response.ok) throw this.httpError(response, url);

    const body = await this.readJson(response, url);
    if (
      !isRecord(body) ||
      typeof body.prefix !== "string" ||
      !body.prefix ||
      typeof body.target !== "string" ||
      !body.target
    ) {
      throw new RequestError("LRCLIB returned an invalid challenge response", {
        status: response.status,
        url: this.safeUrl(url),
      });
    }

    return { prefix: body.prefix, target: body.target };
  }

  private async resolvePublishToken(): Promise<string> {
    const source = this.tokenSource;
    if (source === undefined) throw new KeyError();

    const token = typeof source === "function" ? await source() : source;
    if (!hasText(token)) {
      throw new KeyError("The publish token provider returned an empty token");
    }
    return token.trim();
  }

  /**
   * Sends a JSON POST authenticated with a publish token. Redirects are
   * rejected so the token cannot be forwarded to another origin.
   */
  private async postWithToken(
    path: string,
    payload: Record<string, unknown>,
    options?: RequestInit,
  ): Promise<{ response: Response; url: URL }> {
    const token = await this.resolvePublishToken();

    const headers = new Headers(options?.headers);
    headers.set("Accept", "application/json");
    headers.set("Content-Type", "application/json");
    headers.set("X-Publish-Token", token);

    const url = this.createUrl(path);
    const response = await this.request(url, {
      ...options,
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      redirect: "error",
    });

    return { response, url };
  }

  /**
   * Publishes lyrics with the token supplied in `ClientOptions.key`.
   *
   * Send plain lyrics, synced lyrics or a Lyricsfile (which LRCLIB stores as-is
   * and prefers over the other two), or set `instrumental: true` to mark the
   * track as instrumental. Redirects are rejected so the token cannot be
   * forwarded to another origin.
   */
  public async publishLyrics(
    info: PublishLyrics,
    options?: RequestInit,
  ): Promise<string> {
    if (this.tokenSource === undefined) throw new KeyError();

    validateText(info.trackName, "trackName");
    validateText(info.artistName, "artistName");
    validateText(info.albumName, "albumName");

    const hasLyrics =
      hasText(info.plainLyrics) ||
      hasText(info.syncedLyrics) ||
      hasText(info.lyricsfile);
    if (info.instrumental === true) {
      if (hasLyrics) {
        throw new TypeError("Instrumental tracks must not include lyrics");
      }
    } else if (!hasLyrics) {
      throw new TypeError(
        "At least one lyrics field must not be empty (or set instrumental: true)",
      );
    }

    const payload: Record<string, unknown> = {
      trackName: info.trackName,
      artistName: info.artistName,
      albumName: info.albumName,
      duration: durationInSeconds(info.duration),
      plainLyrics: info.plainLyrics ?? "",
      syncedLyrics: info.syncedLyrics ?? "",
    };
    if (hasText(info.lyricsfile)) payload.lyricsfile = info.lyricsfile;

    const { response, url } = await this.postWithToken(
      "publish",
      payload,
      options,
    );
    if (response.status !== 201) throw this.httpError(response, url);
    return await response.text();
  }

  /**
   * Reports the currently published lyrics of a track (wrong lyrics, wrong
   * metadata, copyright issues). Requires a fresh publish token, so prefer a
   * token provider in `ClientOptions.key` when the client also publishes.
   */
  public async flagLyrics(
    info: FlagLyrics,
    options?: RequestInit,
  ): Promise<void> {
    if (this.tokenSource === undefined) throw new KeyError();

    if (!Number.isSafeInteger(info.trackId) || info.trackId <= 0) {
      throw new RangeError("Track ID must be a positive safe integer");
    }
    if (info.content !== undefined && typeof info.content !== "string") {
      throw new TypeError("content must be a string");
    }

    const payload: Record<string, unknown> = { trackId: info.trackId };
    const content = info.content?.trim();
    if (content) payload.content = content;

    const { response, url } = await this.postWithToken(
      "flag",
      payload,
      options,
    );
    if (!response.ok) throw this.httpError(response, url);
  }
}
