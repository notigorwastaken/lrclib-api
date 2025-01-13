// Represents a single line of lyrics with optional timing information
type LyricLine = {
  text: string; // The lyric text
  startTime?: number; // Optional timestamp indicating when this line starts in the song
};

// Represents a single word in a karaoke line with its timing
type KaraokeLine = {
  word: string; // A single word from the lyrics
  time: number; // Timestamp when this word is sung
};

// Represents a full karaoke lyric line with multiple words and an overall start time
type KaraokeLyric = {
  text: KaraokeLine[]; // Array of words and their timings
  startTime: number; // Timestamp indicating when the line starts in the song
};

/**
 * Represents parsed lyrics in different formats:
 * - `synced`: Array of lyric lines with start times (null if not available)
 * - `unsynced`: Array of lyric lines without timing information
 * - `karaoke`: Array of karaoke-style lyrics with word-level timings (null if not available)
 */
type ParsedLyrics = {
  synced: LyricLine[] | null; // Synchronized lyrics
  unsynced: LyricLine[]; // Unsynchronized lyrics
  karaoke: KaraokeLyric[] | null; // Karaoke-style lyrics
};

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
 *   unsynced: [],
 *   karaoke: null
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
  const karaokeTimestamp = /\<([0-9:.]+)\>/; // Matches <00:12.34>

  const unsynced: LyricLine[] = []; // Array to store unsynchronized lyrics
  const synced: LyricLine[] = []; // Array to store synchronized lyrics
  const karaoke: KaraokeLyric[] = []; // Array to store karaoke-style lyrics

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
    // Match karaoke lyrics (e.g., <00:12.34>word)
    else if (karaokeTimestamp.test(line)) {
      const words = line.split(" ").map((word) => {
        const match = word.match(karaokeTimestamp);
        return {
          word: word.replace(karaokeTimestamp, ""),
          time: match ? parseTime(match[1]) : 0,
        };
      });
      karaoke.push({ text: words, startTime: words[0].time });
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
    karaoke: karaoke.length > 0 ? karaoke : null,
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

export {
  LyricLine,
  KaraokeLine,
  KaraokeLyric,
  ParsedLyrics,
  parseTime,
  parseLocalLyrics,
};
