import type { TileState } from "#/lib/types"

const KEY_ROWS: string[][] = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
]

function keyClass(state: TileState | undefined): string {
  if (state === "correct") return "bg-emerald-500 text-white"
  if (state === "present") return "bg-amber-500 text-white"
  if (state === "absent") return "bg-slate-800 text-slate-500"
  return "bg-slate-700/80 text-slate-100"
}

type KeyboardProps = {
  letterStates: Record<string, TileState>
  disabled: boolean
  onKey: (letter: string) => void
  onEnter: () => void
  onBackspace: () => void
}

export function Keyboard({ letterStates, disabled, onKey, onEnter, onBackspace }: KeyboardProps) {
  return (
    <section aria-label="On-screen keyboard" className="mx-auto w-full max-w-lg space-y-1.5">
      {KEY_ROWS.map((row) => (
        <div key={row.join("")} className="flex justify-center gap-1.5">
          {row.map((key) => {
            const isAction = key === "ENTER" || key === "BACKSPACE"
            const label = key === "BACKSPACE" ? "⌫" : key
            const ariaLabel =
              key === "BACKSPACE" ? "Delete letter" : key === "ENTER" ? "Submit guess" : key
            return (
              <button
                key={key}
                type="button"
                aria-label={ariaLabel}
                disabled={disabled}
                onClick={() => {
                  if (key === "ENTER") onEnter()
                  else if (key === "BACKSPACE") onBackspace()
                  else onKey(key)
                }}
                className={`h-12 min-w-0 flex-1 select-none rounded-md text-sm font-bold uppercase transition active:scale-95 disabled:opacity-50 sm:h-14 ${
                  isAction ? "flex-[1.7] text-xs" : ""
                } ${keyClass(letterStates[key])}`}
              >
                {label}
              </button>
            )
          })}
        </div>
      ))}
    </section>
  )
}
