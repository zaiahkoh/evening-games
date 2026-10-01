import type { TileState } from "#/lib/types"

export const WORD_LENGTH = 5

const WORD_PATTERN = /^[A-Z]+$/
const FEEDBACK_CODES: Record<TileState, string> = {
  correct: "C",
  present: "P",
  absent: "A",
}

export function normalizeGuess(input: string): string {
  return input.trim().toUpperCase()
}

export function isWellFormedGuess(guess: string, length = WORD_LENGTH): boolean {
  return guess.length === length && WORD_PATTERN.test(guess)
}

export function evaluateGuess(answer: string, guess: string): TileState[] {
  const length = answer.length
  const result: TileState[] = Array.from({ length }, () => "absent")
  const remaining: Record<string, number> = {}

  for (let index = 0; index < length; index += 1) {
    if (guess[index] === answer[index]) {
      result[index] = "correct"
    } else {
      remaining[answer[index]] = (remaining[answer[index]] ?? 0) + 1
    }
  }

  for (let index = 0; index < length; index += 1) {
    if (result[index] === "correct") continue
    const letter = guess[index]
    const count = remaining[letter] ?? 0
    if (count > 0) {
      result[index] = "present"
      remaining[letter] = count - 1
    }
  }

  return result
}

export function encodeFeedback(tiles: TileState[]): string {
  return tiles.map((tile) => FEEDBACK_CODES[tile]).join("")
}

export function decodeFeedback(code: string): TileState[] {
  return Array.from(code, (character): TileState => {
    if (character === "C") return "correct"
    if (character === "P") return "present"
    return "absent"
  })
}

const STATE_PRIORITY: Record<TileState, number> = {
  absent: 0,
  present: 1,
  correct: 2,
}

export function computeLetterStates(
  guesses: string[],
  feedback: TileState[][],
): Record<string, TileState> {
  const states: Record<string, TileState> = {}

  guesses.forEach((guess, rowIndex) => {
    const row = feedback[rowIndex] ?? []
    for (let columnIndex = 0; columnIndex < guess.length; columnIndex += 1) {
      const letter = guess[columnIndex]
      const state = row[columnIndex]
      if (!state) continue
      const current = states[letter]
      if (current === undefined || STATE_PRIORITY[state] > STATE_PRIORITY[current]) {
        states[letter] = state
      }
    }
  })

  return states
}
