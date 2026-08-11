# LRCLIB API

TypeScript libraries for reading and parsing lyrics from [LRCLIB](https://lrclib.net).

## Packages

| Package                                 | Purpose                                                      |
| --------------------------------------- | ------------------------------------------------------------ |
| [`lrclib-api`](./packages/lrclib-api)   | Type-safe API client and LRC parser for Node.js and browsers |
| [`@lrclib-api/react`](./packages/react) | React provider and hooks built on `lrclib-api`               |

## Quick start

```bash
npm install lrclib-api
```

```ts
import { Client } from "lrclib-api";

const client = new Client();
const lyrics = await client.findLyrics({
  track_name: "The Chain",
  artist_name: "Fleetwood Mac",
});

console.log(lyrics.plainLyrics);
```

See the [`lrclib-api` documentation](./packages/lrclib-api/README.md) for all client methods and parsing helpers.

## Development

The repository requires Node.js 20 or newer.

```bash
npm ci
npm run check
```

`npm run check` runs formatting/lint checks, TypeScript validation, deterministic unit tests, and production builds for every workspace.

## Security

Please report vulnerabilities privately according to the [security policy](./SECURITY.md). Do not include tokens or private lyrics in issues, logs, or test fixtures.

## License

ISC © Igor Figueiredo. See [LICENSE](./LICENSE).
