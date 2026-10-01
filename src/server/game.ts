import { env } from "cloudflare:workers"
import { createServerFn } from "@tanstack/react-start"
import type {
  ChallengeStatus,
  GuessFailureReason,
  GuessResponse,
  RunState,
  RunSummary,
  ScoreSummary,
} from "#/lib/types"
import {
  decodeFeedback,
  encodeFeedback,
  evaluateGuess,
  isWellFormedGuess,
  normalizeGuess,
} from "#/lib/wordle"
import {
  getActiveSeries,
  getSeriesById,
  type Series,
  toSeriesMeta,
} from "#/server/data/challenges.server"
import {
  type GuessRow,
  getRank,
  getRun,
  getRunGuesses,
  getScoreByRun,
  type RunRow,
  type ScoreRow,
} from "#/server/db"
import { isAllowedGuess } from "#/server/dictionary"

const MAX_NAME_LENGTH = 24

function sanitizePlayerName(input: unknown): string {
  if (typeof input !== "string") throw new Error("Player name is required")
  const name = input
    .replace(/\p{Cc}/gu, "")
    .replace(/\s+/g, " ")
    .trim()
  const characters = Array.from(name).slice(0, MAX_NAME_LENGTH)
  const sanitized = characters.join("").trim()
  if (sanitized.length === 0) throw new Error("Player name is required")
  return sanitized
}

function parseRunId(input: unknown): { runId: string } {
  if (typeof input !== "object" || input === null || !("runId" in input)) {
    throw new Error("Invalid input")
  }
  const { runId } = input as { runId: unknown }
  if (typeof runId !== "string" || runId.length === 0 || runId.length > 64) {
    throw new Error("Invalid input")
  }
  return { runId }
}

function toScoreSummary(row: ScoreRow): ScoreSummary {
  return {
    solvedCount: row.solved_count,
    totalChallenges: row.total_challenges,
    totalGuesses: row.total_guesses,
    durationMs: row.duration_ms,
  }
}

function challengeGuessesFor(guesses: GuessRow[], challengeId: string) {
  return guesses
    .filter((row) => row.challenge_id === challengeId)
    .sort((a, b) => a.attempt - b.attempt)
}

function isChallengeSolved(guesses: { guess: string }[], answer: string): boolean {
  return guesses.some((row) => row.guess === answer)
}

export const getSeriesMeta = createServerFn().handler(async () => {
  return toSeriesMeta(getActiveSeries())
})

export const startRun = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    if (typeof input !== "object" || input === null || !("playerName" in input)) {
      throw new Error("Invalid input")
    }
    return { playerName: sanitizePlayerName((input as { playerName: unknown }).playerName) }
  })
  .handler(async ({ data }) => {
    const series = getActiveSeries()
    const runId = crypto.randomUUID()
    const startedAtMs = Date.now()
    await env.DB.prepare(
      "INSERT INTO runs (id, player_name, series_id, started_at_ms) VALUES (?, ?, ?, ?)",
    )
      .bind(runId, data.playerName, series.id, startedAtMs)
      .run()
    return {
      runId,
      playerName: data.playerName,
      startedAtMs,
      series: toSeriesMeta(series),
    }
  })

async function loadRunContext(runId: string): Promise<{ run: RunRow; series: Series } | null> {
  const run = await getRun(env.DB, runId)
  if (!run) return null
  const series = getSeriesById(run.series_id)
  if (!series) return null
  return { run, series }
}

export const getRunState = createServerFn()
  .validator(parseRunId)
  .handler(async ({ data }): Promise<RunState | null> => {
    const context = await loadRunContext(data.runId)
    if (!context) return null
    const { run, series } = context
    const guesses = await getRunGuesses(env.DB, run.id)

    const challenges = series.challenges.map((challenge) => {
      const challengeGuesses = challengeGuessesFor(guesses, challenge.id)
      const solved = isChallengeSolved(challengeGuesses, challenge.answer)
      const failed = !solved && challengeGuesses.length >= series.maxAttempts
      const status: ChallengeStatus = solved
        ? "solved"
        : failed
          ? "failed"
          : challengeGuesses.length > 0
            ? "playing"
            : "unplayed"
      return {
        id: challenge.id,
        length: challenge.answer.length,
        category: challenge.category,
        status,
        guesses: challengeGuesses.map((row) => row.guess),
        feedback: challengeGuesses.map((row) => decodeFeedback(row.feedback)),
      }
    })

    const firstOpen = challenges.findIndex(
      (challenge) => challenge.status === "playing" || challenge.status === "unplayed",
    )

    return {
      runId: run.id,
      playerName: run.player_name,
      series: toSeriesMeta(series),
      startedAtMs: run.started_at_ms,
      finished: run.finished_at_ms !== null,
      currentIndex: firstOpen === -1 ? Math.max(0, challenges.length - 1) : firstOpen,
      challenges,
    }
  })

function fail(reason: GuessFailureReason): GuessResponse {
  return { ok: false, reason }
}

export const submitGuess = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    if (typeof input !== "object" || input === null) throw new Error("Invalid input")
    const { runId, challengeId, guess } = input as {
      runId?: unknown
      challengeId?: unknown
      guess?: unknown
    }
    if (
      typeof runId !== "string" ||
      runId.length === 0 ||
      runId.length > 64 ||
      typeof challengeId !== "string" ||
      challengeId.length === 0 ||
      challengeId.length > 64 ||
      typeof guess !== "string" ||
      guess.length > 32
    ) {
      throw new Error("Invalid input")
    }
    return { runId, challengeId, guess }
  })
  .handler(async ({ data }): Promise<GuessResponse> => {
    const context = await loadRunContext(data.runId)
    if (!context) return fail("unknown-run")
    const { run, series } = context
    if (run.finished_at_ms !== null) return fail("run-finished")

    const challengeIndex = series.challenges.findIndex((c) => c.id === data.challengeId)
    if (challengeIndex === -1) return fail("unknown-challenge")

    const guesses = await getRunGuesses(env.DB, run.id)

    for (let index = 0; index < challengeIndex; index += 1) {
      const challenge = series.challenges[index]
      const previousGuesses = challengeGuessesFor(guesses, challenge.id)
      const solved = isChallengeSolved(previousGuesses, challenge.answer)
      const terminal = solved || previousGuesses.length >= series.maxAttempts
      if (!terminal) return fail("out-of-order")
    }

    const challenge = series.challenges[challengeIndex]
    const challengeGuesses = challengeGuessesFor(guesses, challenge.id)
    if (isChallengeSolved(challengeGuesses, challenge.answer)) return fail("challenge-finished")
    if (challengeGuesses.length >= series.maxAttempts) return fail("no-attempts-left")

    const guess = normalizeGuess(data.guess)
    if (!isWellFormedGuess(guess, challenge.answer.length)) return fail("invalid-format")
    if (guess !== challenge.answer && !isAllowedGuess(guess, challenge.answer.length)) {
      return fail("not-in-dictionary")
    }

    const tiles = evaluateGuess(challenge.answer, guess)
    const solved = guess === challenge.answer
    const attemptsUsed = challengeGuesses.length + 1
    const dead = !solved && attemptsUsed >= series.maxAttempts

    await env.DB.prepare(
      "INSERT INTO run_guesses (run_id, challenge_id, attempt, guess, feedback, created_at_ms) VALUES (?, ?, ?, ?, ?, ?)",
    )
      .bind(run.id, challenge.id, challengeGuesses.length, guess, encodeFeedback(tiles), Date.now())
      .run()

    const nextChallenge = series.challenges[challengeIndex + 1]

    return {
      ok: true,
      tiles,
      solved,
      dead,
      attemptsUsed,
      solution: solved || dead ? challenge.answer : null,
      nextChallengeId: solved || dead ? (nextChallenge?.id ?? null) : null,
    }
  })

export const finishRun = createServerFn({ method: "POST" })
  .validator(parseRunId)
  .handler(
    async ({
      data,
    }): Promise<{ ok: true; summary: RunSummary } | { ok: false; reason: string }> => {
      const context = await loadRunContext(data.runId)
      if (!context) return { ok: false, reason: "unknown-run" }
      const { run, series } = context

      const existing = await getScoreByRun(env.DB, run.id)
      if (!existing) {
        const guesses = await getRunGuesses(env.DB, run.id)
        let solvedCount = 0
        let totalGuesses = 0

        for (const challenge of series.challenges) {
          const challengeGuesses = challengeGuessesFor(guesses, challenge.id)
          const solved = isChallengeSolved(challengeGuesses, challenge.answer)
          if (!solved && challengeGuesses.length < series.maxAttempts) {
            return { ok: false, reason: "incomplete" }
          }
          if (solved) solvedCount += 1
          totalGuesses += challengeGuesses.length
        }

        const finishedAtMs = Date.now()
        const durationMs = Math.max(0, finishedAtMs - run.started_at_ms)
        await env.DB.batch([
          env.DB.prepare("UPDATE runs SET finished_at_ms = ? WHERE id = ?").bind(
            finishedAtMs,
            run.id,
          ),
          env.DB.prepare(
            `INSERT INTO scores (run_id, player_name, series_id, solved_count, total_challenges, total_guesses, duration_ms, created_at_ms)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          ).bind(
            run.id,
            run.player_name,
            run.series_id,
            solvedCount,
            series.challenges.length,
            totalGuesses,
            durationMs,
            finishedAtMs,
          ),
        ])
      }

      const summary = await buildRunSummary(run, series)
      if (!summary) return { ok: false, reason: "unknown-run" }
      return { ok: true, summary }
    },
  )

async function buildRunSummary(run: RunRow, series: Series): Promise<RunSummary | null> {
  const score = await getScoreByRun(env.DB, run.id)
  if (!score) return null
  const guesses = await getRunGuesses(env.DB, run.id)
  const rank = await getRank(env.DB, score)

  return {
    runId: run.id,
    playerName: run.player_name,
    series: toSeriesMeta(series),
    startedAtMs: run.started_at_ms,
    rank,
    score: toScoreSummary(score),
    challenges: series.challenges.map((challenge) => {
      const challengeGuesses = challengeGuessesFor(guesses, challenge.id)
      const solved = isChallengeSolved(challengeGuesses, challenge.answer)
      return {
        id: challenge.id,
        length: challenge.answer.length,
        category: challenge.category,
        status: solved ? "solved" : "failed",
        guessesUsed: challengeGuesses.length,
        solution: challenge.answer,
      }
    }),
  }
}

export const getRunSummary = createServerFn()
  .validator(parseRunId)
  .handler(async ({ data }): Promise<RunSummary | null> => {
    const context = await loadRunContext(data.runId)
    if (!context) return null
    return buildRunSummary(context.run, context.series)
  })
