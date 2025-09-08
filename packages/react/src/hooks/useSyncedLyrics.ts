import { useEffect, useState } from "react";
import { useLrcLib } from "../context/LrcLibProvider";
import { LyricLine } from "lrclib-api";

export function useSyncedLyrics(track: { artist: string; name: string }) {
  const client = useLrcLib();
  const [syncedLyrics, setSyncedLyrics] = useState<LyricLine[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!track.artist || !track.name) return;

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await client.getSynced({
          artist_name: track.artist,
          track_name: track.name,
        });
        setSyncedLyrics(res);
      } catch (err: any | unknown) {  
        setError(err?.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [track.artist, track.name, client]);

  return { syncedLyrics, loading, error };
}
