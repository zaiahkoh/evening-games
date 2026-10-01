import { RANK_ORDER } from "#/server/ranking"

export type RunRow = {
  id: string
  player_name: string
  series_id: string
  started_at_ms: number
  finished_at_ms: number | null
}

export type GuessRow = {
  run_id: string
  challenge_id: string
  attempt: number
  guess: string
  feedback: string
  created_at_ms: number
}

export type ScoreRow = {
  id: number
  run_id: string
  player_name: string
  series_id: string
  solved_count: number
  total_challenges: number
  total_guesses: number
  duration_ms: number
  created_at_ms: number
}

export async function getRun(db: D1Database, runId: string): Promise<RunRow | null> {
  return db
    .prepare(
      "SELECT id, player_name, series_id, started_at_ms, finished_at_ms FROM runs WHERE id = ?",
    )
    .bind(runId)
    .first<RunRow>()
}

export async function getRunGuesses(db: D1Database, runId: string): Promise<GuessRow[]> {
  const result = await db
    .prepare(
      "SELECT run_id, challenge_id, attempt, guess, feedback, created_at_ms FROM run_guesses WHERE run_id = ? ORDER BY attempt ASC",
    )
    .bind(runId)
    .all<GuessRow>()
  return result.results
}

export async function getScoreByRun(db: D1Database, runId: string): Promise<ScoreRow | null> {
  return db
    .prepare(
      "SELECT id, run_id, player_name, series_id, solved_count, total_challenges, total_guesses, duration_ms, created_at_ms FROM scores WHERE run_id = ?",
    )
    .bind(runId)
    .first<ScoreRow>()
}

export async function getRank(db: D1Database, score: ScoreRow): Promise<number> {
  const result = await db
    .prepare(`
      SELECT COUNT(*) AS better
      FROM (
        SELECT player_name, solved_count, total_guesses, duration_ms, created_at_ms,
               ROW_NUMBER() OVER (PARTITION BY player_name ORDER BY ${RANK_ORDER}) AS position
        FROM scores
        WHERE series_id = ?
      )
      WHERE position = 1
        AND (
          solved_count > ?
          OR (solved_count = ? AND total_guesses < ?)
          OR (solved_count = ? AND total_guesses = ? AND duration_ms < ?)
        )
    `)
    .bind(
      score.series_id,
      score.solved_count,
      score.solved_count,
      score.total_guesses,
      score.solved_count,
      score.total_guesses,
      score.duration_ms,
    )
    .first<{ better: number }>()
  return (result?.better ?? 0) + 1
}
