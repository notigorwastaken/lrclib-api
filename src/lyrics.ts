import Query from "./interfaces/Query";
import { parseLocalLyrics } from "./interfaces/Utils";

export async function findLyrics(info: Query) {
    const baseURL = "https://lrclib.net/api/get";
    const durr = info?.duration ? info.duration / 1000 : undefined;
    const params = {
        track_name: info.track_name || "",
        artist_name: info.artist_name || "",
        album_name: info.album_name || "",
        duration: durr || "",
    };

    // Constrói a URL com validação adicional
    const finalURL = `${baseURL}?${Object.entries(params)
        .filter(([_, value]) => value !== undefined && value !== "")
        .map(([key, value]) => `${key}=${encodeURIComponent(value as string)}`)
        .join("&")}`;

    try {
        const response = await fetch(finalURL);

        // Verifica o status da resposta
        if (!response.ok) {
            return {
                status: response.statusText,
                error: "Request error: Track wasn't found",
                debug: await response.text(),
            };
        }

        // Retorna os dados JSON
        return await response.json();
    } catch (error: unknown) {
        if (error instanceof Error) {
            return {
                status: "Network Error",
                error: error.message,
            };
        }
        return {
            status: "Unknown Error",
            error: "An unexpected error occurred",
        };
    }
}
async function getUnsynced(info: Query) {
    const body = await findLyrics(info);
    const unsyncedLyrics = body?.plainLyrics;
    const isInstrumental = body.instrumental;
    if (isInstrumental) return [{ text: "♪ Instrumental ♪" }];

    if (!unsyncedLyrics) return null;

    return parseLocalLyrics(unsyncedLyrics).unsynced;
}

async function getSynced(info: Query) {
    const body = await findLyrics(info);
    const syncedLyrics = body?.syncedLyrics;
    const isInstrumental = body.instrumental;
    if (isInstrumental) return [{ text: "♪ Instrumental ♪" }];

    if (!syncedLyrics) return null;

    return parseLocalLyrics(syncedLyrics).synced;
}