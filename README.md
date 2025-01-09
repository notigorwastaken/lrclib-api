# lrclib-api

**lrclib-api** is a TypeScript-based wrapper for the [lrclib.net](https://lrclib.net) API, designed to fetch song lyrics and metadata. It supports both plain and synchronized lyrics, providing a simple and type-safe interface for integration with your music applications.

---

## Features

- Retrieve song lyrics by track name, artist name, and album name.
- Supports both plain (unsynced) and synchronized (timed) lyrics.
- Handles instrumental tracks gracefully.
- Provides metadata such as track name, artist, album, and duration.
- Fully type-safe with TypeScript.

---

## Installation

Install the package via npm:

```bash
npm install lrclib-api
```

---

## Usage

### Basic Example

```ts
import { findLyrics, getSynced, getUnsynced } from "lrclib-api";

(async () => {
    const query = {
        track_name: "The Chain",
        artist_name: "Fleetwood Mac",
    };

    const lyrics = await findLyrics(query);
    console.log("Metadata:", lyrics);

    const unsyncedLyrics = await getUnsynced(query);
    console.log("Unsynced Lyrics:", unsyncedLyrics);

    const syncedLyrics = await getSynced(query);
    console.log("Synced Lyrics:", syncedLyrics);
})();
```

---

## API Reference

### `findLyrics(query: Query): Promise<FindLyricsResponse>`

Fetches lyrics and metadata for a specific song.

- **Parameters**:
  - `query`: An object of type `Query`:
    ```ts
    type Query = {
        track_name: string;
        artist_name?: string; // Optional
        album_name?: string;  // Optional
        duration?: number;    // Optional, in milliseconds
    };
    ```

- **Returns**:
  A `Promise` resolving to a `FindLyricsResponse` object:
  ```ts
  type FindLyricsResponse = {
      id: number;
      name: string;
      trackName: string;
      artistName: string;
      albumName: string;
      duration: number; // Duration in seconds
      instrumental: boolean; // True if the track is instrumental
      plainLyrics: string | null; // Plain (unsynced) lyrics
      syncedLyrics: string | null; // Timed lyrics
  };
  ```

---

### `getUnsynced(query: Query): Promise<LyricLine[] | null>`

Fetches unsynced (plain) lyrics for a specific song.

- **Returns**:
  - An array of `LyricLine` objects:
    ```ts
    type LyricLine = {
        text: string;
    };
    ```
  - `null` if no plain lyrics are available.

---

### `getSynced(query: Query): Promise<LyricLine[] | null>`

Fetches synchronized (timed) lyrics for a specific song.

- **Returns**:
  - An array of `LyricLine` objects:
    ```ts
    type LyricLine = {
        text: string;
        startTime?: number; // Optional timestamp in milliseconds
    };
    ```
  - `null` if no synced lyrics are available.

---

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
[
  { "text": "Listen to the wind blow" },
  { "text": "Watch the sun rise" }
]
```

### Synced Lyrics Example

```json
[
  { "text": "Listen to the wind blow", "startTime": 27930 },
  { "text": "Watch the sun rise", "startTime": 30880 }
]
```

---

## Running Tests

To run the test suite:

1. Clone the repository:
   ```bash
   git clone https://github.com/igorwastaken/lrclib-api.git
   cd lrclib-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run tests:
   ```bash
   npm test
   ```

---

## Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b my-feature
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add my feature"
   ```
4. Push to your branch:
   ```bash
   git push origin my-feature
   ```
5. Open a pull request.

---

## License

This project is licensed under the [ISC License](https://opensource.org/licenses/ISC).

---

## Links

- **GitHub Repository**: [https://github.com/igorwastaken/lrclib-api](https://github.com/igorwastaken/lrclib-api)
- **NPM Package**: [lrclib-api](https://www.npmjs.com/package/lrclib-api)
- **lrclib.net**: [https://lrclib.net](https://lrclib.net)
