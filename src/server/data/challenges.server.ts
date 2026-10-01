import type { ChallengeMeta, SeriesMeta } from "#/lib/types"

export type Challenge = Omit<ChallengeMeta, "length"> & {
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
      { id: "challenge-1", answer: "PARTY", category: "Warm up" },
      { id: "challenge-2", answer: "GAMES", category: "Warm up" },
      { id: "challenge-3", answer: "MUSIC", category: "Theme" },
      { id: "challenge-4", answer: "CANDLE", category: "Theme" },
      { id: "challenge-5", answer: "LANTERN", category: "Finale" },
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

export function toSeriesMeta(series: Series): SeriesMeta {
  return {
    id: series.id,
    title: series.title,
    subtitle: series.subtitle,
    maxAttempts: series.maxAttempts,
    challenges: series.challenges.map((challenge) => ({
      id: challenge.id,
      length: challenge.answer.length,
      category: challenge.category,
    })),
  }
}
