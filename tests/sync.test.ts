import { getSynced, getUnsynced, findLyrics } from "../src"; // Adjust the path as necessary
import { parseLocalLyrics } from "../src";

jest.mock("../src", () => {
    const actual = jest.requireActual("../src");
    return {
        ...actual,
        findLyrics: jest.fn(),
    };
});

const mockFindLyrics = findLyrics as jest.MockedFunction<typeof findLyrics>;

describe("Lyrics API Wrapper", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("getUnsynced should return unsynced lyrics for a valid track", async () => {
        const mockResponse = {
            id: 151738,
            name: "The Chain",
            trackName: "The Chain",
            artistName: "Fleetwood Mac",
            albumName: "Rumours",
            duration: 271.0,
            instrumental: false,
            plainLyrics: "Line 1\nLine 2\nLine 3",
            syncedLyrics: "",
        };

        mockFindLyrics.mockResolvedValueOnce(mockResponse);

        const unsynced = await getUnsynced({
            track_name: "The Chain",
            artist_name: "Fleetwood Mac",
        });

        const expected = parseLocalLyrics(mockResponse.plainLyrics).unsynced;

        expect(unsynced).toEqual(expected);
    });

    test("getUnsynced should return instrumental placeholder if track is instrumental", async () => {
        const mockResponse = {
            id: 151738,
            name: "The Chain",
            trackName: "The Chain",
            artistName: "Fleetwood Mac",
            albumName: "Rumours",
            duration: 271.0,
            instrumental: true,
            plainLyrics: "",
            syncedLyrics: "",
        };

        mockFindLyrics.mockResolvedValueOnce(mockResponse);

        const unsynced = await getUnsynced({
            track_name: "The Chain",
            artist_name: "Fleetwood Mac",
        });

        expect(unsynced).toEqual([{ text: "♪ Instrumental ♪" }]);
    });

    test("getUnsynced should return null if no plain lyrics are found", async () => {
        const mockResponse = {
            id: 151738,
            name: "The Chain",
            trackName: "The Chain",
            artistName: "Fleetwood Mac",
            albumName: "Rumours",
            duration: 271.0,
            instrumental: false,
            plainLyrics: null,
            syncedLyrics: "",
        };

        mockFindLyrics.mockResolvedValueOnce(mockResponse);

        const unsynced = await getUnsynced({
            track_name: "The Chain",
            artist_name: "Fleetwood Mac",
        });

        expect(unsynced).toBeNull();
    });

    test("getSynced should return synced lyrics for a valid track", async () => {
        const mockResponse = {
            id: 151738,
            name: "The Chain",
            trackName: "The Chain",
            artistName: "Fleetwood Mac",
            albumName: "Rumours",
            duration: 271.0,
            instrumental: false,
            plainLyrics: "",
            syncedLyrics: "[00:01.00] Line 1\n[00:02.00] Line 2",
        };

        mockFindLyrics.mockResolvedValueOnce(mockResponse);

        const synced = await getSynced({
            track_name: "The Chain",
            artist_name: "Fleetwood Mac",
        });

        const expected = parseLocalLyrics(mockResponse.syncedLyrics).synced;

        expect(synced).toEqual(expected);
    });

    test("getSynced should return instrumental placeholder if track is instrumental", async () => {
        const mockResponse = {
            id: 151738,
            name: "The Chain",
            trackName: "The Chain",
            artistName: "Fleetwood Mac",
            albumName: "Rumours",
            duration: 271.0,
            instrumental: true,
            plainLyrics: "",
            syncedLyrics: "",
        };

        mockFindLyrics.mockResolvedValueOnce(mockResponse);

        const synced = await getSynced({
            track_name: "The Chain",
            artist_name: "Fleetwood Mac",
        });

        expect(synced).toEqual([{ text: "♪ Instrumental ♪" }]);
    });

    test("getSynced should return null if no synced lyrics are found", async () => {
        const mockResponse = {
            id: 151738,
            name: "The Chain",
            trackName: "The Chain",
            artistName: "Fleetwood Mac",
            albumName: "Rumours",
            duration: 271.0,
            instrumental: false,
            plainLyrics: "",
            syncedLyrics: null,
        };

        mockFindLyrics.mockResolvedValueOnce(mockResponse);

        const synced = await getSynced({
            track_name: "The Chain",
            artist_name: "Fleetwood Mac",
        });

        expect(synced).toBeNull();
    });
});
