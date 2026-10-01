import type { TileState } from "#/lib/types"

const TILE_BASE =
  "flex aspect-square select-none items-center justify-center rounded-md border-2 text-lg font-extrabold uppercase sm:text-2xl"

function tileClass(state: TileState | undefined, filled: boolean): string {
  if (state === "correct") return "border-emerald-400 bg-emerald-500 text-white"
  if (state === "present") return "border-amber-400 bg-amber-500 text-white"
  if (state === "absent") return "border-slate-700 bg-slate-700 text-slate-200"
  return filled
    ? "border-white/40 bg-white/5 text-white"
    : "border-white/10 bg-white/[0.02] text-white"
}

type WordGridProps = {
  length: number
  maxAttempts: number
  guesses: string[]
  feedback: TileState[][]
  currentGuess: string
  shakeKey: number
}

export function WordGrid({
  length,
  maxAttempts,
  guesses,
  feedback,
  currentGuess,
  shakeKey,
}: WordGridProps) {
  const rowStyle = { gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))` }
  const boardStyle = { maxWidth: `${Math.min(length * 3.25, 30)}rem` }
  const rowKeys = Array.from({ length: maxAttempts }, (_, index) => `row-${index}`)
  const columnKeys = Array.from({ length }, (_, index) => `column-${index}`)

  return (
    <section aria-label="Guess board" className="mx-auto grid w-full gap-1.5" style={boardStyle}>
      {rowKeys.map((rowKey, rowIndex) => {
        const submitted = guesses[rowIndex]
        const isActive = rowIndex === guesses.length
        const letters = submitted ?? (isActive ? currentGuess : "")
        const states = feedback[rowIndex]
        const rowClass = isActive && shakeKey > 0 ? "eg-shake" : ""

        return (
          <div
            key={isActive ? `${rowKey}-${shakeKey}` : rowKey}
            className={`grid gap-1.5 ${rowClass}`}
            style={rowStyle}
          >
            {columnKeys.map((columnKey, columnIndex) => {
              const letter = letters[columnIndex] ?? ""
              const state = states?.[columnIndex]
              const revealClass = state ? "eg-reveal" : ""
              return (
                <div
                  key={columnKey}
                  className={`${TILE_BASE} ${tileClass(state, letter !== "")} ${revealClass}`}
                  style={state ? { animationDelay: `${columnIndex * 80}ms` } : undefined}
                >
                  {letter}
                </div>
              )
            })}
          </div>
        )
      })}
    </section>
  )
}
