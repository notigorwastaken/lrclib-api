# lrclib-api

[![npm version](https://img.shields.io/npm/v/lrclib-api.svg)](https://www.npmjs.com/package/lrclib-api)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](./LICENSE)

A type-safe, dependency-light TypeScript client for the [LRCLIB](https://lrclib.net) API. It supports exact lookups, search, plain and synchronized lyrics, LRC parsing, custom instances, request cancellation, and configurable timeouts.

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

Query and publish durations are supplied in milliseconds and converted to LRCLIB's seconds format.

## Client options

```ts
const client = new Client({
  url: "https://lrclib.example/api",
  timeoutMs: 10_000,
  key: process.env.LRCLIB_PUBLISH_TOKEN,
});
```

| Option      | Description                                                                    |
| ----------- | ------------------------------------------------------------------------------ |
| `url`       | HTTP(S) base URL for an LRCLIB-compatible API                                  |
| `timeoutMs` | Per-request timeout in milliseconds; defaults to 15 seconds, or `0` to disable |
| `key`       | Publish token sent only by `publishLyrics`; HTTPS is required                  |
| `fetch`     | Optional fetch-compatible implementation for custom runtimes or tests          |

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
- `KeyError` is thrown when `publishLyrics` is called without a token.

## Publishing lyrics

Pass a proof-of-work publish token obtained according to the [LRCLIB API documentation](https://lrclib.net/docs):

```ts
const publishingClient = new Client({
  key: process.env.LRCLIB_PUBLISH_TOKEN,
});

await publishingClient.publishLyrics({
  trackName: "Example",
  artistName: "Example Artist",
  albumName: "Example Album",
  duration: 180_000,
  plainLyrics: "First line\nSecond line",
});
```

Redirects are rejected for publish requests so the token cannot be forwarded to another origin.

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
