// Represents a single line of lyrics with optional timing information
type LyricLine = {
  text: string; // The lyric text
  startTime?: number; // Optional timestamp indicating when this line starts in the song
};

/**
 * Represents parsed lyrics in different formats:
 * - `synced`: Array of lyric lines with start times (null if not available)
 * - `unsynced`: Array of lyric lines without timing information
 */
type ParsedLyrics = {
  synced: LyricLine[] | null; // Synchronized lyrics
  unsynced: LyricLine[]; // Unsynchronized lyrics
};
export { LyricLine, ParsedLyrics };
