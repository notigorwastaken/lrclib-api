import { FindLyricsResponse, Query, Search } from "./interfaces/Query";
import { LyricLine, parseLocalLyrics } from "./interfaces/Utils";

/**
 * This function sends request to https://lrclib.net/api/search
 * 
 * Example:
 * ```js
 * const search = await searchLyrics({ query: "The Chain" });
 * ```
 * Should return {@link FindLyricsResponse | `FindLyricsResponse[]`}
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
 * This function sends request to https://lrclib.net/api/get or https://lrclib.net/api/get/:id
 * 
 * Example:
 * ```js
 * const lyrics = await findLyrics({
 *   track_name: "The Chain",
 *   artist_name: "Fleetwood Mac"
 * });
 * ```
 * Should return {@link FindLyricsResponse | `FindLyricsResponse[]`}
*/
async function findLyrics(info: Query): Promise<FindLyricsResponse> {
    const parseID = info.id?`/${info.id}`:"?"
    const baseURL = "https://lrclib.net/api/get"+parseID;
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
        if(!error) throw new Error("Unknown Error");

        throw error?.message;
    }
}

/**
 * This function reuses `findLyrics()` to get plain lyrics
 * 
 * Example:
 * ```js
 * const unsynced = await getUnsynced({ track_name: "The Chain", artist_name: "Fleetwood Mac" })
 * ```
 * Should return {@link FindLyricsResponse | `LyricLine[]`} or `[null](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/null)`
 */
async function getUnsynced(info: Query): Promise<LyricLine[] | null> {
    try {
        const body = await findLyrics(info);
        if ("error" in body) return null;

        const unsyncedLyrics = body?.plainLyrics;
        const isInstrumental = body.instrumental;
        if (isInstrumental) return [{ text: "♪ Instrumental ♪" }];

        if (!unsyncedLyrics) return null;

        return parseLocalLyrics(unsyncedLyrics).unsynced;
    } catch (e) {
        console.error(e);
        return null;
    }
}

async function getSynced(info: Query): Promise<LyricLine[] | null> {
    try {
        const body = await findLyrics(info);
        const syncedLyrics = body?.syncedLyrics;
        const isInstrumental = body.instrumental;
        if (isInstrumental) return [{ text: "♪ Instrumental ♪" }];

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