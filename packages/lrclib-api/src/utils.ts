import type { LyricLine, ParsedLyrics } from "./types/Utils";

const TIMESTAMP_SOURCE = String.raw`\[(\d+):([0-5]\d)(?:[.:](\d{1,3}))?\]`;
const METADATA_LINE = /^\[[a-z][a-z0-9_-]*:.*\]$/i;

function timestampPattern(): RegExp {
  return new RegExp(TIMESTAMP_SOURCE, "g");
}

/**
 * Converts an LRC timestamp (`mm:ss`, `mm:ss.xx`, or `mm:ss.xxx`) to seconds.
 *
 * @throws {TypeError} When the timestamp is malformed.
 */
function parseTime(time: string): number {
  const match = /^(\d+):([0-5]\d)(?:[.:](\d{1,3}))?$/.exec(time.trim());
  if (!match) {
    throw new TypeError(`Invalid LRC timestamp: ${time}`);
  }

  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  const fraction = match[3] ? Number(match[3]) / 10 ** match[3].length : 0;

  return minutes * 60 + seconds + fraction;
}

/**
 * Parses plain or synchronized LRC text without treating metadata tags as lyrics.
 * Multiple timestamps on the same line are supported.
 */
function parseLocalLyrics(lyrics: string): ParsedLyrics {
  const synced: LyricLine[] = [];
  const unsynced: LyricLine[] = [];

  for (const rawLine of lyrics.replace(/\r\n?/g, "\n").split("\n")) {
    const line = rawLine.trim();
    if (!line || METADATA_LINE.test(line)) continue;

    const matches = [...line.matchAll(timestampPattern())];
    if (matches.length === 0) {
      unsynced.push({ text: line });
      continue;
    }

    const text = line.replace(timestampPattern(), "").trim();
    if (!text) continue;

    for (const match of matches) {
      const timestamp = `${match[1]}:${match[2]}${match[3] ? `.${match[3]}` : ""}`;
      synced.push({ text, startTime: parseTime(timestamp) });
    }
  }

  return {
    synced: synced.length > 0 ? synced : null,
    unsynced,
  };
}

export { parseLocalLyrics, parseTime };
