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
      { id: "party", answer: "PARTY", category: "Warm up", hint: "Get the night started" },
      { id: "games", answer: "GAMES", category: "Warm up", hint: "That is why you are here" },
      { id: "light", answer: "LIGHT", category: "Theme", hint: "Opposite of heavy" },
      { id: "music", answer: "MUSIC", category: "Theme", hint: "Turn it up" },
      { id: "laugh", answer: "LAUGH", category: "Finale", hint: "The goal of the night" },
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
      hint: challenge.hint,
      category: challenge.category,
    })),
  }
}
