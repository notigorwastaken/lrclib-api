# lrclib-api

[![npm version](https://img.shields.io/npm/v/lrclib-api.svg)](https://www.npmjs.com/package/lrclib-api)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](./LICENSE)

A type-safe, dependency-light TypeScript client for the [LRCLIB](https://lrclib.net) API. It supports exact lookups, search, plain and synchronized lyrics, raw Lyricsfile documents, publishing, flagging, LRC parsing, custom instances, request cancellation, and configurable timeouts.

## Installation

```bash
npm install lrclib-api
```

Node.js 20 or newer is supported. The package also works in modern browsers with `fetch`, `URL`, and `AbortController`.

## Basic usage

```ts
import { Client } from "lrclib-api";

const client = new Client();

const result = await client.findLyrics({
  track_name: "The Chain",
  artist_name: "Fleetwood Mac",
});

console.log(result.plainLyrics);
```

CommonJS is supported too:

```js
const { Client } = require("lrclib-api");
```

## Search and parsed lyrics

```ts
const matches = await client.searchLyrics({
  query: "The Chain Fleetwood Mac",
});

const plainLines = await client.getUnsynced({ id: matches[0].id });
const timedLines = await client.getSynced({ id: matches[0].id });
```

`getUnsynced` returns `{ text }` lines. `getSynced` returns `{ text, startTime }` lines, where `startTime` is measured in seconds:

```json
[
  { "text": "Listen to the wind blow", "startTime": 27.93 },
  { "text": "Watch the sun rise", "startTime": 30.88 }
]
```

Query and publish durations are supplied in milliseconds and converted to LRCLIB's seconds format. `searchLyrics` also accepts `artist_name` and `album_name` to narrow a search.

## Lyricsfile

Every LRCLIB record carries a [Lyricsfile](https://lrclib.net/docs), a YAML document that is the most complete lyric representation. `findLyrics` and `searchLyrics` expose it as `lyricsfile`, and `getLyricsfile` returns just that document:

```ts
const record = await client.findLyrics({ id: 151738 });
record.lyricsfile; // raw YAML, or null/undefined when unavailable

const yaml = await client.getLyricsfile({ id: 151738 }); // string | null
```

The document is returned unparsed to keep this package dependency-free; use the YAML parser of your choice. Older or self-hosted instances may not send the field, so treat it as optional.

## Client options

```ts
const client = new Client({
  url: "https://lrclib.example/api",
  timeoutMs: 10_000,
  clientName: "MyPlayer v1.2.0 (https://example.com)",
});
```

| Option       | Description                                                                                                       |
| ------------ | ----------------------------------------------------------------------------------------------------------------- |
| `url`        | HTTP(S) base URL for an LRCLIB-compatible API                                                                     |
| `timeoutMs`  | Per-request timeout in milliseconds; defaults to 15 seconds, or `0` to disable                                    |
| `key`        | Publish token, or a function returning a fresh one; sent only by `publishLyrics` and `flagLyrics`; HTTPS required |
| `clientName` | Application name, version and link, sent as the `Lrclib-Client` header on every request                           |
| `fetch`      | Optional fetch-compatible implementation for custom runtimes or tests                                             |

LRCLIB asks applications to identify themselves. `clientName` uses the `Lrclib-Client` header, which LRCLIB accepts in place of `User-Agent` so it also works in browsers.

Every request method accepts a `RequestInit`, including an abort signal:

```ts
const controller = new AbortController();

const request = client.findLyrics(
  { id: 151738 },
  { signal: controller.signal },
);

controller.abort();
await request;
```

## Errors

- `NotFoundError` is thrown by `findLyrics` for HTTP 404 responses.
- `RequestError` wraps HTTP errors, invalid API responses, network failures, aborts, and timeouts. It exposes safe `status`, `statusText`, and `url` metadata without copying response bodies into logs.
- `getSynced` and `getUnsynced` return `null` when a track or lyric format is absent, but propagate operational failures.
- `KeyError` is thrown when `publishLyrics` or `flagLyrics` is called without a token, or when a token provider returns an empty string.

## Publishing lyrics

Publishing and flagging need a proof-of-work publish token, obtained according to the [LRCLIB API documentation](https://lrclib.net/docs). A token has the form `{prefix}:{nonce}`, comes from a challenge that expires after five minutes, and **can only be used once**. Pass a function as `key` so every request gets a fresh token:

```ts
const reader = new Client();

const client = new Client({
  clientName: "MyPlayer v1.2.0 (https://example.com)",
  key: async () => {
    const { prefix, target } = await reader.requestChallenge();
    const nonce = await solveChallenge(prefix, target); // your proof-of-work solver
    return `${prefix}:${nonce}`;
  },
});

await client.publishLyrics({
  trackName: "Example",
  artistName: "Example Artist",
  albumName: "Example Album",
  duration: 180_000,
  plainLyrics: "First line\nSecond line",
  syncedLyrics: "[00:01.00] First line\n[00:04.50] Second line",
});
```

A fixed string still works for a single request (`key: process.env.LRCLIB_PUBLISH_TOKEN`). The token provider is not called when the input is invalid, so a bad payload never burns a token.

Lyrics can be sent as `plainLyrics`, `syncedLyrics`, or a `lyricsfile`. When a `lyricsfile` is present LRCLIB stores it as-is and ignores the other two fields in the same request, so send them together only if you also target older servers. To mark a track as instrumental, set `instrumental: true` instead of any lyrics:

```ts
await client.publishLyrics({
  trackName: "Example",
  artistName: "Example Artist",
  albumName: "Example Album",
  duration: 180_000,
  instrumental: true,
});
```

A payload with no lyrics and no `instrumental: true` is rejected before any request is made, so an empty field cannot mark a track as instrumental by accident.

## Flagging lyrics

Report the currently published lyrics of a track (wrong lyrics, wrong metadata, or a copyright issue). The reason is optional:

```ts
await client.flagLyrics({
  trackId: 3396226,
  content: "The lyrics don't match the audio",
});
```

Flagging uses the same single-use publish token as publishing. Redirects are rejected for publish and flag requests so the token cannot be forwarded to another origin.

## Local LRC parsing

```ts
import { parseLocalLyrics, parseTime } from "lrclib-api";

parseTime("00:27.93"); // 27.93
parseLocalLyrics("[00:27.93] Listen to the wind blow");
```

Metadata tags and blank lines are ignored, CRLF input is normalized, and repeated timestamps on a single line are supported.

## Development

```bash
git clone https://github.com/notigorwastaken/lrclib-api.git
cd lrclib-api
npm ci
npm run check
```

## Security

Do not construct a custom `url` from untrusted input. Publish tokens must be kept secret and are only accepted with HTTPS URLs. Report vulnerabilities through the repository's [security policy](../../SECURITY.md).

## License

ISC © Igor Figueiredo.
