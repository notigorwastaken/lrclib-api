import { parseLocalLyrics, parseTime } from "../src";

describe("LRC parsing", () => {
  test.each([
    ["00:27.93", 27.93],
    ["01:02.003", 62.003],
    ["120:00", 7200],
    ["00:01:5", 1.5],
  ])("parses %s as %d seconds", (timestamp, expected) => {
    expect(parseTime(timestamp)).toBe(expected);
  });

  test.each(["", "1", "1:99", "ab:cd", "01:02.1234"])(
    "rejects malformed timestamp %p",
    (timestamp) => {
      expect(() => parseTime(timestamp)).toThrow(TypeError);
    },
  );

  test("normalizes newlines, skips metadata, and supports repeated timestamps", () => {
    const result = parseLocalLyrics(
      "[ar:Artist]\r\n[00:10.00][00:20.50] Chorus\r\nA plain line\r\n",
    );

    expect(result).toEqual({
      synced: [
        { text: "Chorus", startTime: 10 },
        { text: "Chorus", startTime: 20.5 },
      ],
      unsynced: [{ text: "A plain line" }],
    });
  });

  test("keeps bracketed section labels that are not metadata", () => {
    expect(parseLocalLyrics("[Verse 1]\nHello").unsynced).toEqual([
      { text: "[Verse 1]" },
      { text: "Hello" },
    ]);
  });
});
