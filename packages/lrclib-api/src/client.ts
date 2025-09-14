import { KeyError, NoResultError, NotFoundError, RequestError } from "./errors";
import { ChallengeResponse, ClientOptions } from "./types/Client";
import {
  FindLyricsResponse,
  PublishLyrics,
  Query,
  Search,
} from "./types/Lyrics";
import { LyricLine } from "./types/Utils";
import { parseLocalLyrics } from "./utils";

export class Client {
  private _url: string = "https://lrclib.net/api";
  private _key: string | undefined;
  /**
   * Creates a request client to api
   *
   * Example Usage;
   * ```typescript
   * const client = new Client();
   *
   * client.findLyrics({ track_name: "The Chain", artist_name: "Fleetwood Mac" }).then(console.log);
   * ```
   *
   * @notigorwastaken: I'm still working on it.
   *
   * @param options - An optional object containing Client Options
   *  - `url`: The base URL, e.g. you can set up a custom url that uses another lrclib.net instance
   *  - `key`: The token used to publish lyrics to the api. [click here for more info](https://lrclib.net/docs)
   */
  constructor(options?: ClientOptions) {
    this._url = options?.url || this._url;
    this._key = options?.key;
  }
  private async request(
    path: string,
    options?: RequestInit,
  ): Promise<Response> {
    return await fetch(this._url + path, options);
  }
  private async post(
    path: string,
    body: any,
    options?: RequestInit,
  ): Promise<string> {
    if (!this._key) throw new KeyError();
    const response = await fetch(this._url + path, {
      ...options,
      headers: {
        "X-Publish-Token": this._key,
      },
      body: JSON.stringify(body),
      method: "post",
    });
    if (response.status !== 201) throw await response.json();
    return await response.text();
  }
  private async postAlt(
    path: string,
    headers?: any,
    body?: any,
    options?: RequestInit,
  ): Promise<Response> {
    return await fetch(this._url + path, {
      method: "post",
      headers,
      body: body,
      ...options,
    });
  }
  /**
   * Sends a request to the lyrics search API at https://lrclib.net/api/search.
   *
   * Example Usage:
   * ```typescript
   * const search = await searchLyrics({ query: "The Chain" });
   * ```
   *
   * @param info - An object containing search parameters:
   *  - `query`: The search term (conditional | e.g., song title or lyrics fragment).
   *  - `track_name`: The name of the track (conditional).
   *  - `artist_name`: The artist's name (optional).
   *  - `duration`: The song duration in milliseconds (optional).
   *
   * @returns A promise that resolves to an array of {@link FindLyricsResponse | FindLyricsResponse[]}.
   */
  public async searchLyrics(
    info: Search,
    options?: RequestInit,
  ): Promise<FindLyricsResponse[]> {
    const baseURL = "/search";
    const params = {
      q: info.query || "",
      track_name: info.track_name || "",
      artist_name: info.artist_name || "",
      duration: info.duration ? info.duration / 1000 : "",
    };
    const finalURL = `${baseURL}?${Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== "")
      .map(([key, value]) => `${key}=${encodeURIComponent(value as string)}`)
      .join("&")}`;
    const response = await this.request(finalURL, options);

    if (!response.ok) {
      throw new RequestError();
    }
    const body = await response.json();

    if (!body) {
      throw new NoResultError();
    }

    return body;
  }

  /**
   * Finds lyrics for a given track using the API at https://lrclib.net/api/get.
   *
   * Example Usage:
   * ```typescript
   * const lyrics = await findLyrics({ track_name: "The Chain", artist_name: "Fleetwood Mac" });
   * ```
   *
   * @param info - An object containing query parameters:
   *  - `id`: The unique identifier of the track (conditional).
   *  - `track_name`: The name of the track (conditional).
   *  - `artist_name`: The artist's name (conditional).
   *  - `album_name`: The album's name (optional).
   *  - `duration`: The song duration in milliseconds (optional).
   *
   * @returns A promise that resolves to a {@link FindLyricsResponse | FindLyricsResponse} object containing the track's lyrics.
   * @throws Will throw an error if the request fails or the track is not found.
   */
  public async findLyrics(
    info: Query,
    options?: RequestInit,
  ): Promise<FindLyricsResponse> {
    const parseID = info.id ? `/${info.id}` : "?";
    const baseURL = "/get" + parseID;
    const durr = info?.duration ? info.duration / 1000 : undefined;
    const params = {
      track_name: info.track_name || "",
      artist_name: info.artist_name || "",
      album_name: info.album_name || "",
      duration: durr || "",
    };

    const finalURL = `${baseURL}${Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== "")
      .map(([key, value]) => `${key}=${encodeURIComponent(value as string)}`)
      .join("&")}`;

    const response = await this.request(finalURL, options);
    if (!response.ok && response.status === 404) {
      throw new NotFoundError();
    } else if (!response.ok && response.status !== 200) {
      throw new RequestError(response.statusText);
    }

    const body = await response.json();

    return body;
  }

  /**
   * Retrieves unsynchronized (plain) lyrics for a given track.
   *
   * Example Usage:
   * ```typescript
   * const unsyncedLyrics = await getUnsynced({ track_name: "The Chain", artist_name: "Fleetwood Mac" });
   * ```
   *
   * @param info - An object containing query parameters:
   *  - `id`: The unique identifier of the track (conditional).
   *  - `track_name`: The name of the track (conditional).
   *  - `artist_name`: The artist's name (conditional).
   *  - `album_name`: The album's name (optional).
   *  - `duration`: The song duration in milliseconds (optional).
   *
   * @returns A promise that resolves to an array of {@link LyricLine | LyricLine[]} objects
   *          containing unsynchronized lyrics or `null` if no lyrics are found.
   */
  public async getUnsynced(info: Query): Promise<LyricLine[] | null> {
    try {
      const body = await this.findLyrics(info);
      if ("error" in body) return null;

      const unsyncedLyrics = body?.plainLyrics;
      const isInstrumental = body.instrumental;
      if (isInstrumental) return [{ text: "[Instrumental]" }];

      if (!unsyncedLyrics) return null;

      return parseLocalLyrics(unsyncedLyrics).unsynced;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  /**
   * Retrieves synchronized (timed) lyrics for a given track.
   *
   * Example Usage:
   * ```typescript
   * const syncedLyrics = await getSynced({ track_name: "The Chain", artist_name: "Fleetwood Mac" });
   * ```
   *
   * @param info - An object containing query parameters:
   *  - `id`: The unique identifier of the track (conditional).
   *  - `track_name`: The name of the track (conditional).
   *  - `artist_name`: The artist's name (conditional).
   *  - `album_name`: The album's name (optional).
   *  - `duration`: The song duration in milliseconds (optional).
   *
   * @returns A promise that resolves to an array of {@link LyricLine | LyricLine[]} objects
   *          containing synchronized lyrics or `null` if no lyrics are found.
   */
  public async getSynced(info: Query): Promise<LyricLine[] | null> {
    try {
      const body = await this.findLyrics(info);
      const syncedLyrics = body?.syncedLyrics;
      const isInstrumental = body.instrumental;
      if (isInstrumental) return [{ text: "[Instrumental]" }];

      if (!syncedLyrics) return null;

      return parseLocalLyrics(syncedLyrics).synced;
    } catch (e) {
      console.error(e);
      return null;
    }
  }
  public async requestChallenge(): Promise<ChallengeResponse | null> {
    try {
      const challenge = await this.postAlt("/request-challenge");
      if (!challenge.ok) throw new RequestError(challenge.statusText);
      const response = await challenge.json();
      if (!response.prefix || !response.target) return null;
      return {
        prefix: response.prefix,
        target: response.target,
      };
    } catch (e: any) {
      throw new Error(e?.message ?? "Unknown Error");
    }
  }
  /**
   * This is an experimental function / API.
   
  public async publishLyrics(info: PublishLyrics) {
    try {
      const challenge = await this.requestChallenge();
      const response = await this.postAlt(
        "/publish",
        {
          "X-Publish-Token":
            challenge?.prefix +
            ":" +
            solveChallenge(
              challenge?.prefix as string,
              challenge?.target as string,
            ),
          "content-type": "application/json",
          Accept: "application/json",
        },
        {
          track_name: info.trackName,
          artist_name: info.artistName,
          album_name: info.albumName,
          duration: info.duration,
          plain_lyrics: info.plainLyrics,
          synced_lyrics: "",
        },
      );
      return response;
    } catch (e: any) {
      throw new Error(e?.message ?? "Unknown Error");
    }
  }*/
}
