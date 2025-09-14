import { Client } from "../src";

describe("song lyrics", () => {
  const client = new Client();
  test("get song lyrics", async () => {
    const result = await client.findLyrics({
      track_name: "The Chain",
      artist_name: "Fleetwood Mac",
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
      plainLyrics: expect.stringContaining(
        "Listen to the wind blow\nWatch the sun rise",
      ),
      syncedLyrics: expect.stringContaining(
        "[00:27.93] Listen to the wind blow\n[00:30.88] Watch the sun rise",
      ),
    };

    // Assert the structure
    expect(result).toEqual(expect.objectContaining(expectedResult));

    // Optionally, validate specific details
    expect(result.plainLyrics?.split("\n").length).toBeGreaterThan(10); // Ensure multiple lines in plain lyrics
    expect(result.syncedLyrics?.split("\n").length).toBeGreaterThan(10); // Ensure multiple lines in synced lyrics
    console.log(result);
  });

  test("get synced and unsynced lyrics", async () => {
    const result = await client.getSynced({
      track_name: "khkgkglfjhl",
      artist_name: "dhgghkbkgoh",
    });

    expect(result).toBeNull();
    console.log(result);
  });
});
describe("search song lyrics", () => {
  const client = new Client();
  /*test("search song lyrics", async () => {
    const result = await client.searchLyrics({
      query: "The Chain Fleetwood Mac",
    });

    const expectedResult = [
      {
        id: 151738,
        name: "The Chain",
        trackName: "The Chain",
        artistName: "Fleetwood Mac",
        albumName: "Rumours",
        duration: 271,
        instrumental: false,
        plainLyrics: expect.stringContaining(
          "Listen to the wind blow\nWatch the sun rise",
        ),
        syncedLyrics: expect.stringContaining(
          "[00:27.93] Listen to the wind blow\n[00:30.88] Watch the sun rise",
        ),
      },
    ];

    expect(result).toEqual(expect.arrayContaining(expectedResult));
    console.log(result);
  });*/

  test("get song lyrics by id", async () => {
    const result = await client.findLyrics({
      id: 151738,
    });

    const expectedResult = {
      id: 151738,
      name: "The Chain",
      trackName: "The Chain",
      artistName: "Fleetwood Mac",
      albumName: "Rumours",
      duration: 271,
      instrumental: false,
      plainLyrics: expect.stringContaining(
        "Listen to the wind blow\nWatch the sun rise",
      ),
      syncedLyrics: expect.stringContaining(
        "[00:27.93] Listen to the wind blow\n[00:30.88] Watch the sun rise",
      ),
    };
    /*
            // Assert the structure
            expect(result).toEqual(expect.objectContaining(expectedResult));
        
            // Optionally, validate specific details
            expect(result.plainLyrics?.split("\n").length).toBeGreaterThan(10); // Ensure multiple lines in plain lyrics
            expect(result.syncedLyrics?.split("\n").length).toBeGreaterThan(10); // Ensure multiple lines in synced lyrics
            */
  });/*
  test("If challenge key is returning something", async () => {
    const challenge = await client.requestChallenge();
    console.log(
      solveChallenge(challenge?.prefix as string, challenge?.target as string),
    );
  });*/
});
