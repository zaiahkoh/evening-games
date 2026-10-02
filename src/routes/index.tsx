import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { type FormEvent, useEffect, useState } from "react"
import { ScoreTable } from "#/components/ScoreTable"
import { readStoredName, readStoredRunId, writeStoredName, writeStoredRunId } from "#/lib/storage"
import { getSeriesMeta, startRun } from "#/server/game"
import { getLeaderboard } from "#/server/leaderboard"

export const Route = createFileRoute("/")({
  loader: async () => {
    const [series, leaderboard] = await Promise.all([
      getSeriesMeta(),
      getLeaderboard({ data: { limit: 5 } }),
    ])
    return { series, leaderboard }
  },
  component: HomePage,
})

function HomePage() {
  const { series, leaderboard } = Route.useLoaderData()
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [hasSavedRun, setHasSavedRun] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const storedName = readStoredName()
    if (storedName) setName(storedName)
    setHasSavedRun(readStoredRunId() !== null)
  }, [])

  async function handleStart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const playerName = name.trim()
    if (playerName.length === 0) {
      setError("Enter a name to join the game.")
      return
    }
    setPending(true)
    setError(null)
    try {
      const run = await startRun({ data: { playerName } })
      writeStoredName(run.playerName)
      writeStoredRunId(run.runId)
      await navigate({ to: "/play" })
    } catch {
      setError("Could not start the game. Please try again.")
      setPending(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 py-10">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">
          Evening Games
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">{series.title}</h1>
        {series.subtitle ? <p className="mt-2 text-sm text-slate-400">{series.subtitle}</p> : null}
      </header>

      <form
        onSubmit={handleStart}
        className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5"
      >
        <label htmlFor="player-name" className="block text-sm font-medium text-slate-300">
          Your name
        </label>
        <input
          id="player-name"
          name="playerName"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Alex"
          maxLength={24}
          autoComplete="nickname"
          enterKeyHint="go"
          className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-base text-white outline-none placeholder:text-slate-600 focus:border-amber-400/70"
        />
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-amber-400 px-4 py-3 text-base font-bold text-slate-950 transition active:scale-[0.99] disabled:opacity-60"
        >
          {pending ? "Starting..." : `Start ${series.challenges.length} words`}
        </button>
        {hasSavedRun ? (
          <Link
            to="/play"
            className="block rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-semibold text-slate-200 transition active:scale-[0.99]"
          >
            Resume your last run
          </Link>
        ) : null}
        {error ? (
          <p className="text-center text-sm text-rose-300" role="alert">
            {error}
          </p>
        ) : null}
      </form>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Rules</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          <li>
            {series.maxAttempts} guesses per word, {series.challenges.length} words in the series.
          </li>
          <li>Green means the letter is in the right spot, amber means it is in the word.</li>
          <li>
            Some answers hide more than one word; type letters only and the gap fills in
            automatically. Each part is checked as its own word, but hints consider the whole
            phrase.
          </li>
          <li>Ranking: words solved, then fewest guesses, then fastest time.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Leaderboard
          </h2>
          <Link to="/leaderboard" className="text-sm font-medium text-amber-400">
            View all
          </Link>
        </div>
        <ScoreTable entries={leaderboard} highlightName={name} />
      </section>
    </div>
  )
}
