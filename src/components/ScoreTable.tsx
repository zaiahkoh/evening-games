import { formatDuration } from "#/lib/format"
import type { LeaderboardEntry } from "#/lib/types"

type ScoreTableProps = {
  entries: LeaderboardEntry[]
  highlightName?: string | null
}

export function ScoreTable({ entries, highlightName }: ScoreTableProps) {
  if (entries.length === 0) {
    return (
      <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-slate-400">
        No scores yet. Be the first to finish the series.
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">
              #
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Player
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              Solved
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              Guesses
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              Time
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const highlighted =
              highlightName != null &&
              highlightName.length > 0 &&
              entry.playerName.toLowerCase() === highlightName.toLowerCase()
            return (
              <tr
                key={`${entry.playerName}-${entry.createdAtMs}-${entry.rank}`}
                className={
                  highlighted
                    ? "bg-amber-400/15 text-amber-100"
                    : "border-t border-white/5 text-slate-200"
                }
              >
                <td className="px-3 py-2 tabular-nums">{entry.rank}</td>
                <td className="max-w-32 truncate px-3 py-2 font-medium">{entry.playerName}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {entry.solvedCount}/{entry.totalChallenges}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{entry.totalGuesses}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatDuration(entry.durationMs)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
