/** Query a track by metadata or by its numeric LRCLIB ID. */
type Query =
  | {
      id?: never;
      track_name: string;
      artist_name: string;
      album_name?: string;
      /** Track duration in milliseconds. */
      duration?: number;
    }
  | {
      id: number;
      track_name?: never;
      artist_name?: never;
      album_name?: never;
      duration?: never;
    };

/** A successful lyrics response returned by LRCLIB. */
type FindLyricsResponse = {
  id: number;
  name: string;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  plainLyrics: string | null;
  syncedLyrics: string | null;
};

/** The error payload shape used by LRCLIB. */
type ErrorResponse = {
  code: number;
  name: string;
  message: string;
};

type Search = SearchType & {
  artist_name?: string;
  /** Track duration in milliseconds. */
  duration?: number;
};

type SearchType =
  | {
      track_name?: never;
      query: string;
    }
  | {
      track_name: string;
      query?: never;
    };

type PublishLyricsBase = {
  trackName: string;
  artistName: string;
  albumName: string;
  /** Track duration in milliseconds. */
  duration: number;
};

/** A publish payload containing plain lyrics, synced lyrics, or both. */
type PublishLyrics = PublishLyricsBase &
  (
    | { plainLyrics: string; syncedLyrics?: string }
    | { plainLyrics?: string; syncedLyrics: string }
  );

export {
  ErrorResponse,
  FindLyricsResponse,
  PublishLyrics,
  Query,
  Search,
  SearchType,
};
