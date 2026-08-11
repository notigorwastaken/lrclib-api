/** A parsed lyric line. `startTime` is expressed in seconds. */
type LyricLine = {
  text: string;
  startTime?: number;
};

type ParsedLyrics = {
  /** Synchronized lines, or `null` when the input contains no timestamps. */
  synced: LyricLine[] | null;
  /** Lines that do not contain timestamps. */
  unsynced: LyricLine[];
};

export { LyricLine, ParsedLyrics };
