type Query = {
    track_name: string;
    artist_name: string;
    album_name?: string;
    duration?: number;
}
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

export {
    Query,
    FindLyricsResponse
}