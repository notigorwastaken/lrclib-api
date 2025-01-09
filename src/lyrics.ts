import { FindLyricsResponse, Query, Search } from "./interfaces/Query";
import { LyricLine, parseLocalLyrics } from "./interfaces/Utils";

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

        // Verifica o status da resposta
        if (!response.ok) {
            throw new Error("Request error: Track wasn't found");
        }

        // Retorna os dados JSON
        return await response.json();
    } catch (error: unknown) {
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error("Unknown Error")
    }
}

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

    // Constrói a URL com validação adicional
    const finalURL = `${baseURL}${Object.entries(params)
        .filter(([_, value]) => value !== undefined && value !== "")
        .map(([key, value]) => `${key}=${encodeURIComponent(value as string)}`)
        .join("&")}`;

    try {
        const response = await fetch(finalURL);

        // Verifica o status da resposta
        if (!response.ok) {
            throw new Error("Request error: Track wasn't found");
        }

        // Retorna os dados JSON
        return await response.json();
    } catch (error: any) {
        if(!error) throw new Error("Unknown Error");

        throw error?.message;
       // throw new Error("Unknown Error")
    }
}
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