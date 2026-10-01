import { describe, expect, it } from "vitest"
import { buildDictionary, getDictionary, isAllowedGuess } from "#/server/dictionary"

describe("buildDictionary", () => {
  it("keeps only five-letter alphabetic words, uppercased and deduped", () => {
    const dictionary = buildDictionary(["party", " PARTY ", "too-long", "abcd", "CRANE"].join("\n"))
    expect(dictionary.has("PARTY")).toBe(true)
    expect(dictionary.has("CRANE")).toBe(true)
    expect(dictionary.size).toBe(2)
  })
})

describe("bundled dictionary", () => {
  it("loads a reasonable number of words", () => {
    expect(getDictionary().size).toBeGreaterThan(10_000)
  })

  it("accepts a common word and rejects a made-up one", () => {
    expect(isAllowedGuess("CRANE")).toBe(true)
    expect(isAllowedGuess("ZZZZZ")).toBe(false)
  })
})
