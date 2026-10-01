import { describe, expect, it } from "vitest"
import { SERIES, toSeriesMeta } from "#/server/data/challenges.server"

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

  it("uses five-letter uppercase answers and sane attempt limits", () => {
    for (const series of SERIES) {
      expect(series.challenges.length).toBeGreaterThan(0)
      expect(series.maxAttempts).toBeGreaterThan(0)
      for (const challenge of series.challenges) {
        expect(challenge.answer).toMatch(/^[A-Z]{5}$/)
      }
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
