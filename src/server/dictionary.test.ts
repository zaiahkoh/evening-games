import { describe, expect, it } from "vitest"
import {
  buildDictionary,
  getDictionary,
  isAllowedGuess,
  MAX_WORD_LENGTH,
  MIN_WORD_LENGTH,
} from "#/server/dictionary"

describe("buildDictionary", () => {
  it("groups words by length and drops invalid entries", () => {
    const dictionary = buildDictionary(
      ["party", " PARTY ", "candle", "no", "toolongword", "crane"].join("\n"),
    )
    expect(dictionary.get(5)?.has("PARTY")).toBe(true)
    expect(dictionary.get(5)?.has("CRANE")).toBe(true)
    expect(dictionary.get(6)?.has("CANDLE")).toBe(true)
    expect(dictionary.get(2)).toBeUndefined()
    expect(dictionary.get(11)).toBeUndefined()
  })
})

describe("bundled dictionary", () => {
  it("covers every supported word length", () => {
    const dictionary = getDictionary()
    for (let length = MIN_WORD_LENGTH; length <= MAX_WORD_LENGTH; length += 1) {
      expect(dictionary.get(length)?.size ?? 0).toBeGreaterThan(100)
    }
  })

  it("accepts common words of different lengths", () => {
    expect(isAllowedGuess("CRANE", 5)).toBe(true)
    expect(isAllowedGuess("CANDLE", 6)).toBe(true)
    expect(isAllowedGuess("LANTERN", 7)).toBe(true)
  })

  it("rejects made-up words and length mismatches", () => {
    expect(isAllowedGuess("ZZZZZ", 5)).toBe(false)
    expect(isAllowedGuess("ZZZZZZZ", 7)).toBe(false)
    expect(isAllowedGuess("CRANE", 6)).toBe(false)
  })
})
