import { useEffect, useState } from "react";
import type { FindLyricsResponse } from "lrclib-api";
import { useLrcLib } from "../context/LrcLibProvider";
import { errorMessage } from "./error";

type Track = { artist: string; name: string };

type FindLyricsState = {
  metadata?: FindLyricsResponse;
  plainLyrics?: string | null;
  syncedLyrics?: string | null;
};

export function useFindLyrics(track: Track) {
  const client = useLrcLib();
  const [result, setResult] = useState<FindLyricsState>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    if (!track.artist.trim() || !track.name.trim()) {
      setResult({});
      setLoading(false);
      setError(null);
      return () => controller.abort();
    }

    setResult({});
    setLoading(true);
    setError(null);

    void client
      .findLyrics(
        { artist_name: track.artist, track_name: track.name },
        { signal: controller.signal },
      )
      .then((response) => {
        if (controller.signal.aborted) return;
        setResult({
          metadata: response,
          plainLyrics: response.plainLyrics,
          syncedLyrics: response.syncedLyrics,
        });
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) setError(errorMessage(requestError));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [track.artist, track.name, client]);

  return { ...result, loading, error };
}
