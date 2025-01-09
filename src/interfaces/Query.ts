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

type Search = SearchType & {
    artist_name?: string;
    duration?: number;
}

type SearchType = | {
    track_name?: never;
    query: string;
} | {
    track_name: string;
    query?: never;
};

export {
    Query,
    FindLyricsResponse,
    SearchType,
    Search
}