import { createFileRoute, Link } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { ScoreTable } from "#/components/ScoreTable"
import { readStoredName } from "#/lib/storage"
import { getLeaderboard } from "#/server/leaderboard"

export const Route = createFileRoute("/leaderboard")({
  loader: () => getLeaderboard({ data: { limit: 50 } }),
  component: LeaderboardPage,
})

function LeaderboardPage() {
  const entries = Route.useLoaderData()
  const [name, setName] = useState<string | null>(null)

  useEffect(() => {
    setName(readStoredName())
  }, [])

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-4 py-10">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">
          Evening Games
        </p>
        <h1 className="mt-2 text-2xl font-black">Leaderboard</h1>
        <p className="mt-1 text-sm text-slate-400">
          Best run per player. Solved, then fewest guesses, then fastest time.
        </p>
      </header>

      <ScoreTable entries={entries} highlightName={name} />

      <Link
        to="/"
        className="block w-full rounded-xl bg-amber-400 px-4 py-3 text-center font-bold text-slate-950 transition active:scale-[0.99]"
      >
        Play the series
      </Link>
    </div>
  )
}
