# @lrclib-api/react

React provider and request hooks for [`lrclib-api`](../lrclib-api).

## Installation

```bash
npm install lrclib-api @lrclib-api/react react
```

## Usage

```tsx
import { LrcLibProvider, useSyncedLyrics } from "@lrclib-api/react";

function Lyrics() {
  const { syncedLyrics, loading, error } = useSyncedLyrics({
    artist: "Fleetwood Mac",
    name: "The Chain",
  });

  if (loading) return <p>Loading…</p>;
  if (error) return <p>{error}</p>;

  return (
    <ol>
      {syncedLyrics?.map((line) => (
        <li key={`${line.startTime}-${line.text}`}>{line.text}</li>
      ))}
    </ol>
  );
}

export function App() {
  return (
    <LrcLibProvider
      timeoutMs={10_000}
      clientName="MyPlayer v1.2.0 (https://example.com)"
    >
      <Lyrics />
    </LrcLibProvider>
  );
}
```

Available hooks:

- `useFindLyrics` returns metadata, raw plain/synchronized lyric strings, and the raw `lyricsfile` YAML when the server provides one.
- `useUnsyncedLyrics` returns parsed `{ text }` lines.
- `useSyncedLyrics` returns parsed `{ text, startTime }` lines.

`clientName` is sent as the `Lrclib-Client` header so LRCLIB can identify your application.

Requests are cancelled when a component unmounts or its track changes, preventing stale responses from overwriting newer state.

## License

ISC © Igor Figueiredo.
