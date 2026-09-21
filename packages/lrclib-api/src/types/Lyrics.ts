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
  /**
   * Raw Lyricsfile YAML document. LRCLIB documents this field as always
   * present, but records without lyrics can return `null` and older or
   * self-hosted instances may omit it.
   */
  lyricsfile?: string | null;
};

/** The error payload shape used by LRCLIB. */
type ErrorResponse = {
  code: number;
  name: string;
  message: string;
};

type Search = SearchType & {
  artist_name?: string;
  album_name?: string;
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

/**
 * A publish payload. Provide plain lyrics, synced lyrics, a Lyricsfile, or set
 * `instrumental: true` to mark the track as instrumental (LRCLIB does this when
 * every lyrics field is empty).
 *
 * When a `lyricsfile` is sent, LRCLIB stores it as-is and ignores
 * `plainLyrics` and `syncedLyrics` from the same request.
 */
type PublishLyrics = PublishLyricsBase &
  (
    | {
        instrumental: true;
        plainLyrics?: never;
        syncedLyrics?: never;
        lyricsfile?: never;
      }
    | {
        instrumental?: false;
        plainLyrics: string;
        syncedLyrics?: string;
        lyricsfile?: string;
      }
    | {
        instrumental?: false;
        plainLyrics?: string;
        syncedLyrics: string;
        lyricsfile?: string;
      }
    | {
        instrumental?: false;
        plainLyrics?: string;
        syncedLyrics?: string;
        lyricsfile: string;
      }
  );

/** Reports the currently published lyrics of a track to LRCLIB moderators. */
type FlagLyrics = {
  /** LRCLIB track ID, as returned in the `id` field of a lyrics record. */
  trackId: number;
  /** Optional reason, for example wrong lyrics, wrong metadata or copyright. */
  content?: string;
};

export {
  ErrorResponse,
  FindLyricsResponse,
  FlagLyrics,
  PublishLyrics,
  Query,
  Search,
  SearchType,
};
