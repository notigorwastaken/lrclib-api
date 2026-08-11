import { useEffect, useState } from "react";
import type { LyricLine } from "lrclib-api";
import { useLrcLib } from "../context/LrcLibProvider";
import { errorMessage } from "./error";

type Track = { artist: string; name: string };

export function useUnsyncedLyrics(track: Track) {
  const client = useLrcLib();
  const [plainLyrics, setPlainLyrics] = useState<LyricLine[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    if (!track.artist.trim() || !track.name.trim()) {
      setPlainLyrics(null);
      setLoading(false);
      setError(null);
      return () => controller.abort();
    }

    setPlainLyrics(null);
    setLoading(true);
    setError(null);

    void client
      .getUnsynced(
        { artist_name: track.artist, track_name: track.name },
        { signal: controller.signal },
      )
      .then((lyrics) => {
        if (!controller.signal.aborted) setPlainLyrics(lyrics);
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) setError(errorMessage(requestError));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [track.artist, track.name, client]);

  return { plainLyrics, loading, error };
}
