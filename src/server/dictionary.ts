import rawWords from "#/data/wordle-allowed-guesses.txt?raw"

const WORD_PATTERN = /^[A-Z]{5}$/

export function buildDictionary(raw: string): Set<string> {
  const words = raw
    .split("\n")
    .map((line) => line.trim().toUpperCase())
    .filter((word) => WORD_PATTERN.test(word))
  return new Set(words)
}

let cached: Set<string> | null = null

export function getDictionary(): Set<string> {
  if (cached === null) {
    cached = buildDictionary(rawWords)
  }
  return cached
}

export function isAllowedGuess(guess: string): boolean {
  return getDictionary().has(guess)
}
