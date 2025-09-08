import { useEffect, useState } from "react";
import { useLrcLib } from "../context/LrcLibProvider";

export function useUnsyncedLyrics(track: { artist: string; name: string }) {
  const client = useLrcLib();
  const [plainLyrics, setPlainLyrics] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!track.artist || !track.name) return;

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await client.getUnsynced({
          artist_name: track.artist,
          track_name: track.name,
        });
        setPlainLyrics(res);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [track.artist, track.name, client]);

  return { plainLyrics, loading, error };
}
