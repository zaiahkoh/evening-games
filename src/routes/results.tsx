import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { formatDuration } from "#/lib/format"
import { readStoredName, writeStoredRunId } from "#/lib/storage"
import { getRunSummary, startRun } from "#/server/game"

export const Route = createFileRoute("/results")({
  validateSearch: (search: Record<string, unknown>) => ({
    run: typeof search.run === "string" ? search.run : "",
  }),
  loaderDeps: ({ search: { run } }) => ({ run }),
  loader: async ({ deps }) =>
    deps.run.length > 0 ? await getRunSummary({ data: { runId: deps.run } }) : null,
  component: ResultsPage,
})

function ResultsPage() {
  const summary = Route.useLoaderData()
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!summary) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-xl font-bold">Score not found</h1>
        <p className="text-sm text-slate-400">
          That result is unavailable. Start a fresh run from the home screen.
        </p>
        <Link to="/" className="rounded-xl bg-amber-400 px-5 py-3 font-bold text-slate-950">
          Go home
        </Link>
      </div>
    )
  }

  const { score, rank, challenges, playerName } = summary

  async function handlePlayAgain() {
    const name = readStoredName() ?? playerName
    setPending(true)
    setError(null)
    try {
      const run = await startRun({ data: { playerName: name } })
      writeStoredRunId(run.runId)
      await navigate({ to: "/play" })
    } catch {
      setError("Could not start a new run. Please try again.")
      setPending(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-4 py-10">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">Results</p>
        <h1 className="mt-2 text-2xl font-black">{playerName}</h1>
        <p className="mt-1 text-sm text-slate-400">Rank #{rank} on the leaderboard</p>
      </header>

      <section className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-2xl font-black tabular-nums">
            {score.solvedCount}/{score.totalChallenges}
          </p>
          <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">Solved</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-2xl font-black tabular-nums">{score.totalGuesses}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">Guesses</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-2xl font-black tabular-nums">{formatDuration(score.durationMs)}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">Time</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/10">
        <ul>
          {challenges.map((challenge, index) => (
            <li
              key={challenge.id}
              className={`flex items-center justify-between gap-3 px-4 py-3 text-sm ${
                index > 0 ? "border-t border-white/5" : ""
              }`}
            >
              <div className="min-w-0">
                <p className="font-semibold">
                  {index + 1}.{" "}
                  <span className="font-mono tracking-widest">{challenge.solution}</span>
                </p>
                <p className="truncate text-xs text-slate-500">{challenge.category ?? ""}</p>
              </div>
              <div className="text-right">
                <p
                  className={
                    challenge.status === "solved"
                      ? "font-semibold text-emerald-400"
                      : "font-semibold text-rose-400"
                  }
                >
                  {challenge.status === "solved" ? "Solved" : "Missed"}
                </p>
                <p className="text-xs text-slate-500">
                  {challenge.guessesUsed} {challenge.guessesUsed === 1 ? "guess" : "guesses"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => void handlePlayAgain()}
          disabled={pending}
          className="w-full rounded-xl bg-amber-400 px-4 py-3 font-bold text-slate-950 transition active:scale-[0.99] disabled:opacity-60"
        >
          {pending ? "Starting..." : "Play again"}
        </button>
        <Link
          to="/leaderboard"
          className="block w-full rounded-xl border border-white/10 px-4 py-3 text-center font-semibold text-slate-200 transition active:scale-[0.99]"
        >
          View leaderboard
        </Link>
        <Link to="/" className="block w-full py-2 text-center text-sm font-medium text-slate-400">
          Back home
        </Link>
      </div>

      {error ? (
        <p className="text-center text-sm text-rose-300" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
