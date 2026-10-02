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
  wordLengths: number[]
  maxAttempts: number
  guesses: string[]
  feedback: TileState[][]
  currentGuess: string
  shakeKey: number
}

export function WordGrid({
  wordLengths,
  maxAttempts,
  guesses,
  feedback,
  currentGuess,
  shakeKey,
}: WordGridProps) {
  let runningOffset = 0
  const words = wordLengths.map((wordLength, wordIndex) => {
    const start = runningOffset
    runningOffset += wordLength
    return { wordIndex, wordLength, start }
  })
  const totalLetters = runningOffset
  const gapRem = Math.max(0, words.length - 1) * 1.25
  const boardStyle = { maxWidth: `${Math.min(totalLetters * 3.25 + gapRem, 34)}rem` }
  const rowKeys = Array.from({ length: maxAttempts }, (_, index) => `row-${index}`)
  const columnKeys = words.map((word) =>
    Array.from({ length: word.wordLength }, (_, index) => `word-${word.wordIndex}-column-${index}`),
  )

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
            className={`flex justify-center gap-3 ${rowClass}`}
          >
            {words.map((word, wordIndex) => (
              <div
                key={`${rowKey}-word-${word.wordIndex}`}
                className="grid basis-0 gap-1.5"
                style={{
                  flexGrow: word.wordLength,
                  gridTemplateColumns: `repeat(${word.wordLength}, minmax(0, 1fr))`,
                }}
              >
                {columnKeys[wordIndex].map((columnKey, columnIndex) => {
                  const letterIndex = word.start + columnIndex
                  const letter = letters[letterIndex] ?? ""
                  const state = states?.[letterIndex]
                  const revealClass = state ? "eg-reveal" : ""
                  return (
                    <div
                      key={columnKey}
                      className={`${TILE_BASE} ${tileClass(state, letter !== "")} ${revealClass}`}
                      style={state ? { animationDelay: `${letterIndex * 80}ms` } : undefined}
                    >
                      {letter}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )
      })}
    </section>
  )
}
