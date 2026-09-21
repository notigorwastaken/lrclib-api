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
    expect(JSON.parse(String(options?.body))).toEqual({
      trackName: "The Chain",
      artistName: "Fleetwood Mac",
      albumName: "Rumours",
      duration: 271,
      plainLyrics: "Listen to the wind blow",
      syncedLyrics: "",
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

  describe("lyricsfile", () => {
    const LYRICSFILE = "version: '1.0'\nmetadata:\n  title: The Chain\n";

    test("accepts records with a lyricsfile, a null one or none at all", async () => {
      const mock = fetchMock();
      const client = new Client();

      mock.mockResolvedValueOnce(
        jsonResponse({ ...LYRICS_RESPONSE, lyricsfile: LYRICSFILE }),
      );
      await expect(client.findLyrics({ id: 151738 })).resolves.toMatchObject({
        lyricsfile: LYRICSFILE,
      });

      mock.mockResolvedValueOnce(
        jsonResponse({ ...LYRICS_RESPONSE, lyricsfile: null }),
      );
      await expect(client.findLyrics({ id: 151738 })).resolves.toMatchObject({
        lyricsfile: null,
      });

      mock.mockResolvedValueOnce(jsonResponse(LYRICS_RESPONSE));
      await expect(client.findLyrics({ id: 151738 })).resolves.toEqual(
        LYRICS_RESPONSE,
      );
    });

    test("rejects a lyricsfile that is not a string", async () => {
      fetchMock().mockResolvedValueOnce(
        jsonResponse({ ...LYRICS_RESPONSE, lyricsfile: 42 }),
      );
      await expect(
        new Client().findLyrics({ id: 151738 }),
      ).rejects.toMatchObject({
        message: "LRCLIB returned an invalid lyrics response",
      });
    });

    test("validates lyricsfile in search results", async () => {
      fetchMock().mockResolvedValueOnce(
        jsonResponse([{ ...LYRICS_RESPONSE, lyricsfile: LYRICSFILE }]),
      );
      await expect(
        new Client().searchLyrics({ query: "The Chain" }),
      ).resolves.toHaveLength(1);
    });

    test("getLyricsfile returns the raw YAML or null", async () => {
      const mock = fetchMock();
      const client = new Client();

      mock.mockResolvedValueOnce(
        jsonResponse({ ...LYRICS_RESPONSE, lyricsfile: LYRICSFILE }),
      );
      await expect(client.getLyricsfile({ id: 151738 })).resolves.toBe(
        LYRICSFILE,
      );

      mock.mockResolvedValueOnce(
        jsonResponse({ ...LYRICS_RESPONSE, lyricsfile: null }),
      );
      await expect(client.getLyricsfile({ id: 151738 })).resolves.toBeNull();

      mock.mockResolvedValueOnce(jsonResponse(LYRICS_RESPONSE));
      await expect(client.getLyricsfile({ id: 151738 })).resolves.toBeNull();

      mock.mockResolvedValueOnce(jsonResponse({ code: 404 }, 404, "Not Found"));
      await expect(client.getLyricsfile({ id: 999 })).resolves.toBeNull();

      mock.mockResolvedValueOnce(new Response("nope", { status: 503 }));
      await expect(client.getLyricsfile({ id: 1 })).rejects.toMatchObject({
        status: 503,
      });
    });
  });

  test("passes album_name through to search", async () => {
    const mock = fetchMock().mockResolvedValueOnce(jsonResponse([]));
    await new Client().searchLyrics({
      track_name: "The Chain",
      artist_name: "Fleetwood Mac",
      album_name: "Rumours",
    });

    const url = new URL(String(mock.mock.calls[0]?.[0]));
    expect(url.searchParams.get("album_name")).toBe("Rumours");
  });

  describe("client identification", () => {
    test("sends Lrclib-Client on every request when configured", async () => {
      const mock = fetchMock()
        .mockResolvedValueOnce(jsonResponse(LYRICS_RESPONSE))
        .mockResolvedValueOnce(jsonResponse({ prefix: "a", target: "b" }));
      const client = new Client({
        clientName: "  MyPlayer v1.0 (https://x.y) ",
      });

      await client.findLyrics({ id: 151738 });
      await client.requestChallenge();

      for (const call of mock.mock.calls) {
        expect(new Headers(call[1]?.headers).get("Lrclib-Client")).toBe(
          "MyPlayer v1.0 (https://x.y)",
        );
      }
    });

    test("does not touch headers when no client name is set", async () => {
      const mock = fetchMock().mockResolvedValueOnce(
        jsonResponse(LYRICS_RESPONSE),
      );
      await new Client().findLyrics({ id: 151738 });
      expect(mock.mock.calls[0]?.[1]?.headers).toBeUndefined();
    });

    test("keeps a per-request Lrclib-Client override", async () => {
      const mock = fetchMock().mockResolvedValueOnce(
        jsonResponse(LYRICS_RESPONSE),
      );
      await new Client({ clientName: "Default" }).findLyrics(
        { id: 151738 },
        { headers: { "Lrclib-Client": "Override" } },
      );
      expect(
        new Headers(mock.mock.calls[0]?.[1]?.headers).get("Lrclib-Client"),
      ).toBe("Override");
    });

    test("ignores blank names and rejects unsafe ones", () => {
      expect(() => new Client({ clientName: "   " })).not.toThrow();
      expect(() => new Client({ clientName: "bad\r\nname" })).toThrow(
        "printable ASCII",
      );
      expect(() => new Client({ clientName: "ação" })).toThrow(
        "printable ASCII",
      );
      expect(() => new Client({ clientName: 7 as never })).toThrow(
        "clientName must be a string",
      );
    });
  });

  describe("publishLyrics with lyricsfile and instrumental tracks", () => {
    const TRACK = {
      trackName: "Track",
      artistName: "Artist",
      albumName: "Album",
      duration: 233_000,
    };

    function publishBody(mock: jest.SpiedFunction<typeof fetch>): unknown {
      return JSON.parse(String(mock.mock.calls[0]?.[1]?.body));
    }

    test("sends a lyricsfile alongside the legacy fields", async () => {
      const mock = fetchMock().mockResolvedValueOnce(
        new Response("", { status: 201 }),
      );
      await new Client({ key: "token" }).publishLyrics({
        ...TRACK,
        lyricsfile: "version: '1.0'",
        plainLyrics: "Line",
      });

      expect(publishBody(mock)).toEqual({
        trackName: "Track",
        artistName: "Artist",
        albumName: "Album",
        duration: 233,
        plainLyrics: "Line",
        syncedLyrics: "",
        lyricsfile: "version: '1.0'",
      });
    });

    test("marks a track as instrumental with every lyrics field empty", async () => {
      const mock = fetchMock().mockResolvedValueOnce(
        new Response("", { status: 201 }),
      );
      await new Client({ key: "token" }).publishLyrics({
        ...TRACK,
        instrumental: true,
      });

      expect(publishBody(mock)).toEqual({
        trackName: "Track",
        artistName: "Artist",
        albumName: "Album",
        duration: 233,
        plainLyrics: "",
        syncedLyrics: "",
      });
    });

    test("refuses instrumental tracks that also carry lyrics", async () => {
      const mock = fetchMock();
      await expect(
        new Client({ key: "token" }).publishLyrics({
          ...TRACK,
          instrumental: true,
          plainLyrics: "oops",
        } as never),
      ).rejects.toThrow("Instrumental tracks must not include lyrics");
      expect(mock).not.toHaveBeenCalled();
    });

    test("still refuses an accidentally empty payload", async () => {
      const mock = fetchMock();
      await expect(
        new Client({ key: "token" }).publishLyrics({
          ...TRACK,
          lyricsfile: "  ",
        }),
      ).rejects.toThrow("At least one lyrics field must not be empty");
      expect(mock).not.toHaveBeenCalled();
    });
  });

  describe("publish token provider", () => {
    test("asks for a fresh token per request and requires HTTPS", async () => {
      const mock = fetchMock()
        .mockResolvedValueOnce(new Response("", { status: 201 }))
        .mockResolvedValueOnce(new Response("", { status: 200 }));
      const provider = jest
        .fn<Promise<string>, []>()
        .mockResolvedValueOnce("prefix:1")
        .mockResolvedValueOnce("prefix:2");
      const client = new Client({ key: provider });

      await client.publishLyrics({
        trackName: "Track",
        artistName: "Artist",
        albumName: "Album",
        duration: 1_000,
        plainLyrics: "Lyrics",
      });
      await client.flagLyrics({ trackId: 7 });

      expect(provider).toHaveBeenCalledTimes(2);
      const tokens = mock.mock.calls.map((call) =>
        new Headers(call[1]?.headers).get("X-Publish-Token"),
      );
      expect(tokens).toEqual(["prefix:1", "prefix:2"]);

      expect(
        () => new Client({ url: "http://example.com/api", key: provider }),
      ).toThrow("HTTPS is required");
    });

    test("does not consume a token for invalid input", async () => {
      const provider = jest.fn<string, []>().mockReturnValue("prefix:1");
      const client = new Client({ key: provider });

      await expect(
        client.publishLyrics({
          trackName: "",
          artistName: "Artist",
          albumName: "Album",
          duration: 1_000,
          plainLyrics: "Lyrics",
        }),
      ).rejects.toBeInstanceOf(TypeError);
      await expect(client.flagLyrics({ trackId: 0 })).rejects.toBeInstanceOf(
        RangeError,
      );
      expect(provider).not.toHaveBeenCalled();
    });

    test("rejects an empty token from the provider", async () => {
      const mock = fetchMock();
      const client = new Client({ key: () => "   " });

      await expect(client.flagLyrics({ trackId: 7 })).rejects.toMatchObject({
        name: "KeyError",
        message: "The publish token provider returned an empty token",
      });
      expect(mock).not.toHaveBeenCalled();
    });
  });

  describe("flagLyrics", () => {
    test("posts the track ID and reason with a protected token", async () => {
      const mock = fetchMock().mockResolvedValueOnce(
        new Response("", { status: 200 }),
      );
      const client = new Client({ key: " prefix:nonce " });

      await expect(
        client.flagLyrics({ trackId: 3396226, content: "  Wrong lyrics  " }),
      ).resolves.toBeUndefined();

      const [target, init] = mock.mock.calls[0] ?? [];
      expect(String(target)).toBe("https://lrclib.net/api/flag");
      expect(init).toMatchObject({ method: "POST", redirect: "error" });
      expect(new Headers(init?.headers).get("X-Publish-Token")).toBe(
        "prefix:nonce",
      );
      expect(JSON.parse(String(init?.body))).toEqual({
        trackId: 3396226,
        content: "Wrong lyrics",
      });
    });

    test("omits a blank reason", async () => {
      const mock = fetchMock().mockResolvedValueOnce(
        new Response("", { status: 201 }),
      );
      await new Client({ key: "token" }).flagLyrics({
        trackId: 5,
        content: "   ",
      });
      expect(JSON.parse(String(mock.mock.calls[0]?.[1]?.body))).toEqual({
        trackId: 5,
      });
    });

    test("requires a token and a valid track ID", async () => {
      const mock = fetchMock();
      await expect(
        new Client().flagLyrics({ trackId: 1 }),
      ).rejects.toBeInstanceOf(KeyError);

      const client = new Client({ key: "token" });
      for (const trackId of [0, -3, 1.5, Number.NaN]) {
        await expect(client.flagLyrics({ trackId })).rejects.toBeInstanceOf(
          RangeError,
        );
      }
      await expect(
        client.flagLyrics({ trackId: 1, content: 5 as never }),
      ).rejects.toBeInstanceOf(TypeError);
      expect(mock).not.toHaveBeenCalled();
    });

    test("throws a structured error for rejected flags", async () => {
      fetchMock().mockResolvedValueOnce(new Response("no", { status: 400 }));
      await expect(
        new Client({ key: "token" }).flagLyrics({ trackId: 1 }),
      ).rejects.toMatchObject({
        name: "RequestError",
        status: 400,
        url: "https://lrclib.net/api/flag",
      });
    });
  });
});
