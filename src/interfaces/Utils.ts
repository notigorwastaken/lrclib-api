type LyricLine = {
    text: string;
    startTime?: number; // Optional for unsynced lyrics
};

type KaraokeLine = {
    word: string;
    time: number; // Relative time in ms
};

type KaraokeLyric = {
    text: KaraokeLine[];
    startTime: number;
};

type ParsedLyrics = {
    synced: LyricLine[] | null;
    unsynced: LyricLine[];
    karaoke: KaraokeLyric[] | null;
};

function parseLocalLyrics(lyrics: string): ParsedLyrics {
    // Preprocess lyrics by removing [tags] and empty lines
    const lines = lyrics
        .replace(/\[[a-zA-Z]+:.+\]/g, "") // Removes metadata tags
        .trim()
        .split("\n");

    const syncedTimestamp = /\[([0-9:.]+)\]/;
    const karaokeTimestamp = /\<([0-9:.]+)\>/;

    const unsynced: LyricLine[] = [];
    const isSynced = !!lines[0].match(syncedTimestamp);
    const synced: LyricLine[] | null = isSynced ? [] : null;

    const isKaraoke = !!lines[0].match(karaokeTimestamp);
    const karaoke: KaraokeLyric[] | null = isKaraoke ? [] : null;

    function timestampToMs(timestamp: string): number {
        const [minutes, seconds] = timestamp.replace(/[<>\[\]]/g, "").split(":");
        return Number(minutes) * 60 * 1000 + Number(seconds) * 1000;
    }

    function parseKaraokeLine(line: string, startTime: string): KaraokeLine[] {
        let wordTime = timestampToMs(startTime);
        const karaokeLine: KaraokeLine[] = [];
        const karaokeMatches = line.matchAll(/(\S+ ?)\<([0-9:.]+)\>/g);
        for (const match of karaokeMatches) {
            const word = match[1];
            const time = match[2];
            karaokeLine.push({ word, time: timestampToMs(time) - wordTime });
            wordTime = timestampToMs(time);
        }
        return karaokeLine;
    }

    for (const [i, line] of lines.entries()) {
        const time = line.match(syncedTimestamp)?.[1] ?? null;
        let lyricContent = line.replace(syncedTimestamp, "").trim();
        const lyric = lyricContent.replace(/\<([0-9:.]+)\>/g, "").trim();

        if (line.trim() !== "") {
            if (isKaraoke && karaoke) {
                if (!lyricContent.endsWith(">")) {
                    // Adds end time if missing
                    const endTime =
                        lines[i + 1]?.match(syncedTimestamp)?.[1] ??
                        "00:00"; // Default to "00:00" if no duration available
                    lyricContent += `<${endTime}>`;
                }
                const karaokeLine = parseKaraokeLine(lyricContent, time!);
                karaoke.push({ text: karaokeLine, startTime: timestampToMs(time!) });
            }
            if (isSynced && time && synced) {
                synced.push({ text: lyric || "♪", startTime: timestampToMs(time) });
            }
            unsynced.push({ text: lyric || "♪" });
        }
    }

    return { synced, unsynced, karaoke };
}

export {
    LyricLine,
    KaraokeLine,
    KaraokeLyric,
    ParsedLyrics,
    parseLocalLyrics
}