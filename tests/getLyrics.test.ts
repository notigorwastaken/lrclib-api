import { findLyrics } from '../src'

test("get song lyrics", async () => {
    const result = await findLyrics({
        track_name: "The Chain",
        artist_name: "Fleetwood Mac"
    });

    // Expected result structure and values
    const expectedResult = {
        id: 151738,
        name: "The Chain",
        trackName: "The Chain",
        artistName: "Fleetwood Mac",
        albumName: "Rumours",
        duration: 271,
        instrumental: false,
        plainLyrics: expect.stringContaining("Listen to the wind blow\nWatch the sun rise"),
        syncedLyrics: expect.stringContaining("[00:27.93] Listen to the wind blow\n[00:30.88] Watch the sun rise"),
    };

    // Assert the structure
    expect(result).toEqual(expect.objectContaining(expectedResult));

    // Optionally, validate specific details
    expect(result.plainLyrics.split("\n").length).toBeGreaterThan(10); // Ensure multiple lines in plain lyrics
    expect(result.syncedLyrics.split("\n").length).toBeGreaterThan(10); // Ensure multiple lines in synced lyrics
});