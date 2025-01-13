import { FindLyricsResponse, Query, Search } from "./interfaces/Query";
import { LyricLine, parseLocalLyrics } from "./interfaces/Utils";

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
async function searchLyrics(info: Search): Promise<FindLyricsResponse[]> {
    const baseURL = "https://lrclib.net/api/search";
    const params = {
        q: info.query || "",
        track_name: info.track_name || "",
        artist_name: info.artist_name || "",
        duration: info.duration ? (info.duration / 1000) : ""
    };
    const finalURL = `${baseURL}?${Object.entries(params)
        .filter(([_, value]) => value !== undefined && value !== "")
        .map(([key, value]) => `${key}=${encodeURIComponent(value as string)}`)
        .join("&")}`;
    try {
        const response = await fetch(finalURL);

        if (!response.ok) {
            throw new Error("Request error: Track wasn't found");
        }

        return await response.json();
    } catch (error: unknown) {
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error("Unknown Error")
    }
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
async function findLyrics(info: Query): Promise<FindLyricsResponse> {
    const parseID = info.id ? `/${info.id}` : "?"
    const baseURL = "https://lrclib.net/api/get" + parseID;
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

    try {
        const response = await fetch(finalURL);

        if (!response.ok) {
            throw new Error("Request error: Track wasn't found");
        }

        return await response.json();
    } catch (error: any) {
        if (!error) throw new Error("Unknown Error");

        throw error?.message;
    }
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
async function getUnsynced(info: Query): Promise<LyricLine[] | null> {
    try {
        const body = await findLyrics(info);
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
async function getSynced(info: Query): Promise<LyricLine[] | null> {
    try {
        const body = await findLyrics(info);
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

export {
    findLyrics,
    getSynced,
    getUnsynced,
    searchLyrics
}