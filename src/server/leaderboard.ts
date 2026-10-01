import { env } from "cloudflare:workers"
import { createServerFn } from "@tanstack/react-start"
import type { LeaderboardEntry } from "#/lib/types"
import { getActiveSeries } from "#/server/data/challenges.server"
import { RANK_ORDER } from "#/server/ranking"

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100

type LeaderboardRow = {
  player_name: string
  solved_count: number
  total_challenges: number
  total_guesses: number
  duration_ms: number
  created_at_ms: number
}

export const getLeaderboard = createServerFn()
  .validator((input: unknown) => {
    let limit = DEFAULT_LIMIT
    if (typeof input === "object" && input !== null && "limit" in input) {
      const raw = (input as { limit?: unknown }).limit
      if (typeof raw === "number" && Number.isFinite(raw)) {
        limit = Math.min(MAX_LIMIT, Math.max(1, Math.floor(raw)))
      }
    }
    return { limit }
  })
  .handler(async ({ data }): Promise<LeaderboardEntry[]> => {
    const series = getActiveSeries()
    const result = await env.DB.prepare(`
      SELECT player_name, solved_count, total_challenges, total_guesses, duration_ms, created_at_ms
      FROM (
        SELECT player_name, solved_count, total_challenges, total_guesses, duration_ms, created_at_ms,
               ROW_NUMBER() OVER (PARTITION BY player_name ORDER BY ${RANK_ORDER}) AS position
        FROM scores
        WHERE series_id = ?
      )
      WHERE position = 1
      ORDER BY ${RANK_ORDER}
      LIMIT ?
    `)
      .bind(series.id, data.limit)
      .all<LeaderboardRow>()

    return result.results.map((row, index) => ({
      rank: index + 1,
      playerName: row.player_name,
      solvedCount: row.solved_count,
      totalChallenges: row.total_challenges,
      totalGuesses: row.total_guesses,
      durationMs: row.duration_ms,
      createdAtMs: row.created_at_ms,
    }))
  })
