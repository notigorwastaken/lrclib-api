import { LyricLine, ParsedLyrics } from "./types/Utils";

/**
 * Parses song lyrics into a structured format by removing metadata tags and separating lines.
 *
 * Example Input:
 * ```
 * [00:27.93] Listen to the wind blow
 * [00:30.88] Watch the sun rise
 * ```
 *
 * Example Output:
 * {
 *   synced: [{ text: "Listen to the wind blow", startTime: 27930 }, { text: "Watch the sun rise", startTime: 30880 }],
 *   unsynced: []
 * }
 *
 * @param lyrics - The raw lyrics string with optional tags and timestamps
 * @returns A ParsedLyrics object containing structured lyric data
 */
function parseLocalLyrics(lyrics: string): ParsedLyrics {
  // Preprocess lyrics by removing [tags] (e.g., [artist:Name]) and trimming extra whitespace
  const lines = lyrics
    .replace(/\[[a-zA-Z]+:.+\]/g, "") // Removes metadata tags like [artist:Name]
    .trim()
    .split("\n"); // Splits the lyrics into an array of lines

  // Regular expressions for matching synced and karaoke timestamps
  const syncedTimestamp = /\[([0-9:.]+)\]/; // Matches [00:12.34]

  const unsynced: LyricLine[] = []; // Array to store unsynchronized lyrics
  const synced: LyricLine[] = []; // Array to store synchronized lyrics

  // Process each line to extract lyrics and timing information
  lines.forEach((line) => {
    // Match synchronized lyrics
    const syncMatch = line.match(syncedTimestamp);
    if (syncMatch) {
      const startTime = parseTime(syncMatch[1]);
      const text = line.replace(syncedTimestamp, "").trim();
      if (text) {
        synced.push({ text, startTime });
      }
    }
    // Add to unsynchronized lyrics if no timestamps are found
    else {
      const text = line.trim();
      if (text) {
        unsynced.push({ text });
      }
    }
  });

  return {
    synced: synced.length > 0 ? synced : null,
    unsynced,
  };
}

/**
 * Converts a timestamp string in the format "mm:ss" or "mm:ss.SSS" to a number in seconds.
 *
 * @param time - The timestamp string to parse
 * @returns The time in seconds as a number
 */
function parseTime(time: string): number {
  const [minutes, seconds] = time.split(":").map(Number);
  return minutes * 60 + seconds;
}

export { parseLocalLyrics, parseTime };
