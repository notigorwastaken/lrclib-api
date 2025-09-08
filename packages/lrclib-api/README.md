[![npm version](https://img.shields.io/npm/v/lrclib-api.svg)](https://www.npmjs.com/package/lrclib-api)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

<!--[![Build Status](https://img.shields.io/travis/igorwastaken/lrclib-api.svg)](https://travis-ci.org/igorwastaken/lrclib-api)-->

**lrclib-api** is a TypeScript wrapper for the [lrclib.net](https://lrclib.net) API. It provides a simple, type-safe way to fetch song lyrics and metadata, supporting both plain (unsynced) and synchronized (timed) lyrics.

## Features

- **Easy Lyrics Retrieval:** Fetch song lyrics by track name, artist, or album.
- **Dual Mode:** Supports both plain (unsynced) and synced (timed) lyrics.
- **Instrumental Handling:** Gracefully handles instrumental tracks.
- **Rich Metadata:** Returns track details including track name, artist, album, and duration.
- **TypeScript First:** Enjoy complete type safety in your projects.

## Installation

Install the package via npm:

```bash
npm install lrclib-api
```

## Usage

### Basic Example

#### JavaScript

```js
const { Client } = require("lrclib-api");

const client = new Client();

(async () => {
  const query = {
    track_name: "The Chain",
    artist_name: "Fleetwood Mac",
  };

  try {
    const metadata = await client.findLyrics(query);
    console.log("Metadata:", metadata);

    const unsynced = await client.getUnsynced(query);
    console.log("Unsynced Lyrics:", unsynced);

    const synced = await client.getSynced(query);
    console.log("Synced Lyrics:", synced);
  } catch (error) {
    console.error("Error fetching lyrics:", error);
  }
})();
```

#### ES Module / TypeScript

```ts
import { Client } from "lrclib-api";

const client = new Client();

const query = {
  track_name: "The Chain",
  artist_name: "Fleetwood Mac",
};

async function fetchLyrics() {
  try {
    const metadata = await client.findLyrics(query);
    console.log("Metadata:", metadata);

    const unsynced = await client.getUnsynced(query);
    console.log("Unsynced Lyrics:", unsynced);

    const synced = await client.getSynced(query);
    console.log("Synced Lyrics:", synced);
  } catch (error) {
    console.error("Error fetching lyrics:", error);
  }
}

fetchLyrics();
```

## Example Response

### `findLyrics` Response

```json
{
  "id": 151738,
  "name": "The Chain",
  "trackName": "The Chain",
  "artistName": "Fleetwood Mac",
  "albumName": "Rumours",
  "duration": 271,
  "instrumental": false,
  "plainLyrics": "Listen to the wind blow\nWatch the sun rise...",
  "syncedLyrics": "[00:27.93] Listen to the wind blow\n[00:30.88] Watch the sun rise..."
}
```

### Unsynced Lyrics Example

```json
[{ "text": "Listen to the wind blow" }, { "text": "Watch the sun rise" }]
```

### Synced Lyrics Example

```json
[
  { "text": "Listen to the wind blow", "startTime": 27930 },
  { "text": "Watch the sun rise", "startTime": 30880 }
]
```

## Running Tests

To run the test suite:

1. **Clone the repository:**

   ```bash
   git clone https://github.com/igorwastaken/lrclib-api.git
   cd lrclib-api
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Run tests:**

   ```bash
   npm test
   ```

## Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository.
2. Create a new branch:

   ```bash
   git checkout -b my-new-feature
   ```

3. Make your changes and **commit**:

   ```bash
   git commit -m "Add new feature"
   ```

4. Push your branch to your fork:

   ```bash
   git push origin my-new-feature
   ```

5. Open a Pull Request describing your changes.

## License

This project is licensed under the [ISC License](https://opensource.org/licenses/ISC).

## Links

- **GitHub Repository:** [https://github.com/notigorwastaken/lrclib-api](https://github.com/notigorwastaken/lrclib-api)
- **NPM Package:** [lrclib-api](https://www.npmjs.com/package/lrclib-api)
- **lrclib.net:** [https://lrclib.net](https://lrclib.net)
