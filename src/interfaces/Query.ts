export default interface Query {
    track_name: string;
    artist_name: string;
    album_name?: string;
    duration?: number;
}