import { useEffect, useState } from "react";
import { useLrcLib } from "../context/LrcLibProvider";

export function useFindLyrics(track: { artist: string; name: string }) {
  const client = useLrcLib();
  const [result, setResult] = useState<{
    metadata?: any;
    plainLyrics?: string | null;
    syncedLyrics?: string | null;
  }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!track.artist || !track.name) return;

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await client.findLyrics({
          artist_name: track.artist,
          track_name: track.name,
        });
        setResult({
          metadata: res,
          plainLyrics: res.plainLyrics,
          syncedLyrics: res.syncedLyrics,
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [track.artist, track.name, client]);

  return { ...result, loading, error };
}
