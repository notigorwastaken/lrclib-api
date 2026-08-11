import { Client, KeyError, NoResultError, RequestError } from "../src";

const LYRICS_RESPONSE = {
  id: 151738,
  name: "The Chain",
  trackName: "The Chain",
  artistName: "Fleetwood Mac",
  albumName: "Rumours",
  duration: 271,
  instrumental: false,
  plainLyrics: "Listen to the wind blow\nWatch the sun rise",
  syncedLyrics:
    "[ar:Fleetwood Mac]\n[00:27.93] Listen to the wind blow\n[00:30.88] Watch the sun rise",
};

function jsonResponse(
  body: unknown,
  status = 200,
  statusText = "OK",
): Response {
  return new Response(JSON.stringify(body), {
    status,
    statusText,
    headers: { "Content-Type": "application/json" },
  });
}

function fetchMock() {
  return jest.spyOn(globalThis, "fetch");
}

describe("Client", () => {
  afterEach(() => jest.restoreAllMocks());

  test("builds encoded metadata queries and converts duration to seconds", async () => {
    const mock = fetchMock().mockResolvedValueOnce(
      jsonResponse(LYRICS_RESPONSE),
    );
    const client = new Client();

    await client.findLyrics({
      track_name: "The Chain & More",
      artist_name: "Fleetwood Mac",
      album_name: "Rumours",
      duration: 271_000,
    });

    const url = new URL(String(mock.mock.calls[0]?.[0]));
    expect(url.origin + url.pathname).toBe("https://lrclib.net/api/get");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      track_name: "The Chain & More",
      artist_name: "Fleetwood Mac",
      album_name: "Rumours",
      duration: "271",
    });
  });

  test("gets lyrics by a positive numeric ID", async () => {
    const mock = fetchMock().mockResolvedValueOnce(
      jsonResponse(LYRICS_RESPONSE),
    );
    const client = new Client();

    await expect(client.findLyrics({ id: 151738 })).resolves.toEqual(
      LYRICS_RESPONSE,
    );
    expect(String(mock.mock.calls[0]?.[0])).toBe(
      "https://lrclib.net/api/get/151738",
    );
  });

  test("rejects malformed IDs and durations before requesting", async () => {
    const mock = fetchMock();
    const client = new Client();

    await expect(client.findLyrics({ id: -1 })).rejects.toBeInstanceOf(
      RangeError,
    );
    await expect(
      client.findLyrics({
        track_name: "Track",
        artist_name: "Artist",
        duration: Number.NaN,
      }),
    ).rejects.toBeInstanceOf(RangeError);
    expect(mock).not.toHaveBeenCalled();
  });

  test("exposes safe metadata for a missing track", async () => {
    fetchMock().mockResolvedValueOnce(
      jsonResponse({ message: "missing" }, 404, "Not Found"),
    );
    const client = new Client();

    await expect(client.findLyrics({ id: 999 })).rejects.toMatchObject({
      name: "NotFoundError",
      status: 404,
      statusText: "Not Found",
      url: "https://lrclib.net/api/get/999",
    });
  });

  test("rejects invalid success payloads", async () => {
    fetchMock().mockResolvedValueOnce(jsonResponse({ unexpected: true }));
    const client = new Client();

    await expect(client.findLyrics({ id: 151738 })).rejects.toMatchObject({
      name: "RequestError",
      message: "LRCLIB returned an invalid lyrics response",
    });
  });

  test("wraps network failures instead of silently returning null", async () => {
    fetchMock().mockRejectedValueOnce(new TypeError("network unavailable"));
    const client = new Client();

    await expect(client.getSynced({ id: 151738 })).rejects.toMatchObject({
      name: "RequestError",
      message: "LRCLIB network request failed",
    });
  });

  test("returns null for a missing optional lyric format", async () => {
    fetchMock().mockResolvedValueOnce(
      jsonResponse({ message: "missing" }, 404, "Not Found"),
    );
    const client = new Client();
    await expect(client.getSynced({ id: 999 })).resolves.toBeNull();
  });

  test("parses synced lyrics and ignores metadata", async () => {
    fetchMock().mockResolvedValueOnce(jsonResponse(LYRICS_RESPONSE));
    const client = new Client();

    await expect(client.getSynced({ id: 151738 })).resolves.toEqual([
      { text: "Listen to the wind blow", startTime: 27.93 },
      { text: "Watch the sun rise", startTime: 30.88 },
    ]);
  });

  test("parses plain lyrics into lines", async () => {
    fetchMock().mockResolvedValueOnce(jsonResponse(LYRICS_RESPONSE));
    const client = new Client();

    await expect(client.getUnsynced({ id: 151738 })).resolves.toEqual([
      { text: "Listen to the wind blow" },
      { text: "Watch the sun rise" },
    ]);
  });

  test("handles instrumental and unavailable lyrics", async () => {
    const mock = fetchMock();
    mock.mockResolvedValueOnce(
      jsonResponse({
        ...LYRICS_RESPONSE,
        instrumental: true,
        plainLyrics: null,
        syncedLyrics: null,
      }),
    );
    const client = new Client();
    await expect(client.getUnsynced({ id: 151738 })).resolves.toEqual([
      { text: "[Instrumental]" },
    ]);

    mock.mockResolvedValueOnce(
      jsonResponse({ ...LYRICS_RESPONSE, syncedLyrics: null }),
    );
    await expect(client.getSynced({ id: 151738 })).resolves.toBeNull();
  });

  test("rejects unsafe client configuration", () => {
    expect(() => new Client({ url: "not a URL" })).toThrow(
      "base URL is invalid",
    );
    expect(() => new Client({ url: "file:///tmp/api" })).toThrow(
      "must use HTTP or HTTPS",
    );
    expect(
      () => new Client({ url: "https://user:pass@example.com/api" }),
    ).toThrow("must not contain credentials");
    expect(() => new Client({ url: "https://example.com/api?q=1" })).toThrow(
      "must not contain a query or hash",
    );
    expect(
      () => new Client({ url: "http://example.com/api", key: "secret" }),
    ).toThrow("HTTPS is required");
    expect(() => new Client({ timeoutMs: -1 })).toThrow(
      "timeoutMs must be a non-negative finite number",
    );
  });

  test("supports a custom read-only HTTP endpoint", async () => {
    const customFetch = jest
      .fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
      .mockResolvedValueOnce(jsonResponse(LYRICS_RESPONSE));
    const client = new Client({
      url: "http://localhost:8080/custom/api/",
      fetch: customFetch,
    });

    await client.findLyrics({ id: 151738 });
    expect(String(customFetch.mock.calls[0]?.[0])).toBe(
      "http://localhost:8080/custom/api/get/151738",
    );
  });

  test("searches by free text and track name", async () => {
    const mock = fetchMock();
    mock.mockResolvedValueOnce(jsonResponse([LYRICS_RESPONSE]));
    const client = new Client();
    await expect(client.searchLyrics({ query: "The Chain" })).resolves.toEqual([
      LYRICS_RESPONSE,
    ]);

    mock.mockResolvedValueOnce(jsonResponse([]));
    await expect(
      client.searchLyrics({
        track_name: "The Chain",
        artist_name: "Fleetwood Mac",
      }),
    ).resolves.toEqual([]);
    const url = new URL(String(mock.mock.calls[1]?.[0]));
    expect(url.searchParams.get("track_name")).toBe("The Chain");
    expect(url.searchParams.has("q")).toBe(false);
  });

  test("rejects blank search input", async () => {
    const client = new Client();
    await expect(client.searchLyrics({ query: "  " })).rejects.toBeInstanceOf(
      TypeError,
    );
    await expect(client.searchLyrics({} as never)).rejects.toThrow(
      "A query or track_name must be provided",
    );
    await expect(
      client.searchLyrics({ query: 42 } as never),
    ).rejects.toBeInstanceOf(TypeError);
  });

  test("distinguishes empty and malformed search responses", async () => {
    const mock = fetchMock();
    mock.mockResolvedValueOnce(jsonResponse(null));
    const client = new Client();
    await expect(
      client.searchLyrics({ query: "Track" }),
    ).rejects.toBeInstanceOf(NoResultError);

    mock.mockResolvedValueOnce(jsonResponse([{}]));
    await expect(client.searchLyrics({ query: "Track" })).rejects.toMatchObject(
      {
        message: "LRCLIB returned an invalid search response",
      },
    );
  });

  test("preserves HTTP status without exposing response bodies", async () => {
    fetchMock().mockResolvedValueOnce(
      jsonResponse({ secret: "must-not-leak" }, 503, "Service Unavailable"),
    );
    const client = new Client();

    await expect(client.searchLyrics({ query: "Track" })).rejects.toMatchObject(
      {
        name: "RequestError",
        status: 503,
        message: "LRCLIB request failed with status 503 Service Unavailable",
      },
    );
  });

  test("publishes with a protected token and refuses redirects", async () => {
    const mock = fetchMock().mockResolvedValueOnce(
      new Response("created", { status: 201 }),
    );
    const client = new Client({ key: "publish-token" });

    await expect(
      client.publishLyrics({
        trackName: "The Chain",
        artistName: "Fleetwood Mac",
        albumName: "Rumours",
        duration: 271_000,
        plainLyrics: "Listen to the wind blow",
      }),
    ).resolves.toBe("created");

    const options = mock.mock.calls[0]?.[1];
    expect(new Headers(options?.headers).get("X-Publish-Token")).toBe(
      "publish-token",
    );
    expect(options).toMatchObject({ method: "POST", redirect: "error" });
    expect(JSON.parse(String(options?.body))).toMatchObject({
      duration: 271,
      track_name: "The Chain",
    });
  });

  test("requires a publish token and non-empty lyrics", async () => {
    await expect(
      new Client().publishLyrics({
        trackName: "Track",
        artistName: "Artist",
        albumName: "Album",
        duration: 1_000,
        plainLyrics: "Lyrics",
      }),
    ).rejects.toBeInstanceOf(KeyError);

    const mock = fetchMock();
    await expect(
      new Client({ key: "token" }).publishLyrics({
        trackName: "Track",
        artistName: "Artist",
        albumName: "Album",
        duration: 1_000,
        plainLyrics: "   ",
      }),
    ).rejects.toThrow("At least one lyrics field must not be empty");
    expect(mock).not.toHaveBeenCalled();
  });

  test("throws a structured publish error", async () => {
    fetchMock().mockResolvedValueOnce(
      new Response("rejected", { status: 403 }),
    );
    const client = new Client({ key: "token" });

    await expect(
      client.publishLyrics({
        trackName: "Track",
        artistName: "Artist",
        albumName: "Album",
        duration: 1_000,
        syncedLyrics: "[00:00.00] Line",
      }),
    ).rejects.toMatchObject({ name: "RequestError", status: 403 });
  });

  test("validates challenge responses", async () => {
    const mock = fetchMock();
    mock.mockResolvedValueOnce(jsonResponse({ prefix: "abc", target: "def" }));
    const client = new Client();
    await expect(client.requestChallenge()).resolves.toEqual({
      prefix: "abc",
      target: "def",
    });

    mock.mockResolvedValueOnce(jsonResponse({ prefix: "" }));
    await expect(client.requestChallenge()).rejects.toMatchObject({
      message: "LRCLIB returned an invalid challenge response",
    });
  });

  test("uses an injected fetch implementation", async () => {
    const customFetch = jest
      .fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
      .mockResolvedValueOnce(jsonResponse(LYRICS_RESPONSE));
    const client = new Client({ fetch: customFetch });
    await client.findLyrics({ id: 151738 });
    expect(customFetch).toHaveBeenCalledTimes(1);
  });

  test("wraps invalid JSON as RequestError", async () => {
    fetchMock().mockResolvedValueOnce(
      new Response("not-json", { status: 200 }),
    );
    const client = new Client();
    await expect(client.findLyrics({ id: 151738 })).rejects.toBeInstanceOf(
      RequestError,
    );
  });

  test("aborts requests after the configured timeout", async () => {
    const customFetch = jest.fn<
      ReturnType<typeof fetch>,
      Parameters<typeof fetch>
    >((_input, init) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    });
    const client = new Client({ fetch: customFetch, timeoutMs: 5 });

    await expect(client.findLyrics({ id: 151738 })).rejects.toMatchObject({
      message: "LRCLIB request timed out after 5 ms",
    });
  });

  test("honors an already-aborted caller signal", async () => {
    const controller = new AbortController();
    controller.abort();
    const customFetch = jest.fn<
      ReturnType<typeof fetch>,
      Parameters<typeof fetch>
    >((_input, init) => {
      return init?.signal?.aborted
        ? Promise.reject(new DOMException("Aborted", "AbortError"))
        : Promise.resolve(jsonResponse(LYRICS_RESPONSE));
    });
    const client = new Client({ fetch: customFetch });

    await expect(
      client.findLyrics({ id: 151738 }, { signal: controller.signal }),
    ).rejects.toMatchObject({ message: "LRCLIB request was aborted" });
  });
});
