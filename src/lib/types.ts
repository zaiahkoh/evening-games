export type TileState = "correct" | "present" | "absent"

export type ChallengeMeta = {
  id: string
  length: number
  wordLengths: number[]
  category?: string
}

export type SeriesMeta = {
  id: string
  title: string
  subtitle?: string
  maxAttempts: number
  challenges: ChallengeMeta[]
}

export type ChallengeStatus = "unplayed" | "playing" | "solved" | "failed"

export type RunChallengeState = ChallengeMeta & {
  status: ChallengeStatus
  guesses: string[]
  feedback: TileState[][]
}

export type RunState = {
  runId: string
  playerName: string
  series: SeriesMeta
  startedAtMs: number
  finished: boolean
  currentIndex: number
  challenges: RunChallengeState[]
}

export type ScoreSummary = {
  solvedCount: number
  totalChallenges: number
  totalGuesses: number
  durationMs: number
}

export type LeaderboardEntry = ScoreSummary & {
  rank: number
  playerName: string
  createdAtMs: number
}

export type GuessFailureReason =
  | "unknown-run"
  | "unknown-challenge"
  | "run-finished"
  | "out-of-order"
  | "challenge-finished"
  | "no-attempts-left"
  | "invalid-format"
  | "not-in-dictionary"

export type GuessSuccess = {
  ok: true
  tiles: TileState[]
  solved: boolean
  dead: boolean
  attemptsUsed: number
  solution: string | null
  nextChallengeId: string | null
}

export type GuessFailure = {
  ok: false
  reason: GuessFailureReason
}

export type GuessResponse = GuessSuccess | GuessFailure

export type RunSummaryChallenge = ChallengeMeta & {
  status: ChallengeStatus
  guessesUsed: number
  solution: string
}

export type RunSummary = {
  runId: string
  playerName: string
  series: SeriesMeta
  startedAtMs: number
  score: ScoreSummary
  rank: number
  challenges: RunSummaryChallenge[]
}
