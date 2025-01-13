/**
 * Defines the query object used to search for lyrics.
 * 
 * This type is a union of two possible structures:
 * 1. Search by track details (e.g., track name and artist).
 * 2. Search by a unique track ID.
 */
type Query = | {
    id?: never;
    track_name: string;
    artist_name: string;
    album_name?: string;
    duration?: number;
} | {
    id: number;
    track_name?: never;
    artist_name?: never;
    album_name?: never;
    duration?: never;
};

/**
 * Represents the response returned from the lyrics API.
 */
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
} & ErrorResponse;

type ErrorResponse = {
    code: number;
    name: string;
    message: string;
}

/**
 * Defines the parameters for searching lyrics.
 * Combines the {@link SearchType} structure with additional optional parameters.
*/
type Search = SearchType & {
    artist_name?: string;
    duration?: number;
}

/**
 * Defines the parameters for searching lyrics.
 * Combines the {@link SearchType} structure with additional optional parameters.
 */
type SearchType = | {
    track_name?: never;
    query: string;
} | {
    track_name: string;
    query?: never;
};

export {
    Query,
    ErrorResponse,
    FindLyricsResponse,
    SearchType,
    Search
}