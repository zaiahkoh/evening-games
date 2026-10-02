import type { ChallengeMeta, SeriesMeta } from "#/lib/types"
import { splitAnswerWords, wordLengthsOf } from "#/lib/wordle"
import { MAX_WORD_LENGTH, MIN_WORD_LENGTH } from "#/server/dictionary"

export type Challenge = Omit<ChallengeMeta, "length" | "wordLengths"> & {
  answer: string
}

export type Series = {
  id: string
  title: string
  subtitle?: string
  maxAttempts: number
  challenges: Challenge[]
}

export const SERIES: Series[] = [
  {
    id: "evening-1",
    title: "Evening Games",
    subtitle: "Five words between you and the leaderboard.",
    maxAttempts: 6,
    challenges: [
      { id: "challenge-1", answer: "READ BOOKS", category: "Hobbies" },
      { id: "challenge-2", answer: "VIDEO GAMES", category: "Hobbies" },
      { id: "challenge-3", answer: "CLIMBING", category: "Hobbies" },
      { id: "challenge-4", answer: "HOT HIDEOUT", category: "Restaurant" },
      { id: "challenge-5", answer: "PILLOW", category: "Valued Possession" },
    ],
  },
]

export function getActiveSeries(): Series {
  const [series] = SERIES
  if (!series) throw new Error("No series configured")
  return series
}

export function getSeriesById(id: string): Series | undefined {
  return SERIES.find((series) => series.id === id)
}

export function getAnswerWords(challenge: Challenge, seriesId: string, index: number): string[] {
  const words = splitAnswerWords(challenge.answer)
  const label = `${seriesId} challenge ${index + 1} (${challenge.id})`

  if (words.length === 0) {
    throw new Error(`Invalid config: ${label} has an empty answer`)
  }

  for (const word of words) {
    if (word.length < MIN_WORD_LENGTH || word.length > MAX_WORD_LENGTH) {
      throw new Error(
        `Invalid config: ${label} word "${word}" must be between ${MIN_WORD_LENGTH} and ${MAX_WORD_LENGTH} letters`,
      )
    }
  }

  return words
}

export function toSeriesMeta(series: Series): SeriesMeta {
  return {
    id: series.id,
    title: series.title,
    subtitle: series.subtitle,
    maxAttempts: series.maxAttempts,
    challenges: series.challenges.map((challenge, index) => {
      const words = getAnswerWords(challenge, series.id, index)
      return {
        id: challenge.id,
        length: words.join("").length,
        wordLengths: wordLengthsOf(words),
        category: challenge.category,
      }
    }),
  }
}
