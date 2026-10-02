import { describe, expect, it } from "vitest"
import { splitAnswerWords } from "#/lib/wordle"
import { SERIES, toSeriesMeta } from "#/server/data/challenges.server"
import { MAX_WORD_LENGTH, MIN_WORD_LENGTH } from "#/server/dictionary"

describe("series configuration", () => {
  it("has unique series and challenge ids", () => {
    const seriesIds = new Set<string>()
    for (const series of SERIES) {
      expect(seriesIds.has(series.id)).toBe(false)
      seriesIds.add(series.id)

      const challengeIds = new Set<string>()
      for (const challenge of series.challenges) {
        expect(challengeIds.has(challenge.id)).toBe(false)
        challengeIds.add(challenge.id)
      }
    }
  })

  it("uses supported uppercase words and sane attempt limits", () => {
    for (const series of SERIES) {
      expect(series.challenges.length).toBeGreaterThan(0)
      expect(series.maxAttempts).toBeGreaterThan(0)
      for (const challenge of series.challenges) {
        const words = splitAnswerWords(challenge.answer)
        expect(words.length).toBeGreaterThan(0)
        for (const word of words) {
          expect(word).toMatch(/^[A-Z]+$/)
          expect(word.length).toBeGreaterThanOrEqual(MIN_WORD_LENGTH)
          expect(word.length).toBeLessThanOrEqual(MAX_WORD_LENGTH)
        }
      }
    }
  })

  it("exposes consistent letter and word lengths", () => {
    for (const series of SERIES) {
      const meta = toSeriesMeta(series)
      meta.challenges.forEach((challenge, index) => {
        const words = splitAnswerWords(series.challenges[index].answer)
        expect(challenge.length).toBe(words.join("").length)
        expect(challenge.wordLengths).toEqual(words.map((word) => word.length))
      })
    }
  })

  it("never exposes answers in the public metadata", () => {
    for (const series of SERIES) {
      const meta = toSeriesMeta(series)
      for (const challenge of meta.challenges) {
        expect(challenge).not.toHaveProperty("answer")
      }
    }
  })
})
