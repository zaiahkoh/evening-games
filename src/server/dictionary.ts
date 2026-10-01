import rawWords from "#/data/dictionary.txt?raw"

export const MIN_WORD_LENGTH = 3
export const MAX_WORD_LENGTH = 10

const WORD_PATTERN = /^[A-Z]+$/

export function buildDictionary(raw: string): Map<number, Set<string>> {
  const byLength = new Map<number, Set<string>>()

  for (const line of raw.split("\n")) {
    const word = line.trim().toUpperCase()
    if (word.length < MIN_WORD_LENGTH || word.length > MAX_WORD_LENGTH) continue
    if (!WORD_PATTERN.test(word)) continue

    let words = byLength.get(word.length)
    if (!words) {
      words = new Set()
      byLength.set(word.length, words)
    }
    words.add(word)
  }

  return byLength
}

let cached: Map<number, Set<string>> | null = null

export function getDictionary(): Map<number, Set<string>> {
  if (cached === null) {
    cached = buildDictionary(rawWords)
  }
  return cached
}

export function isAllowedGuess(guess: string, length: number): boolean {
  return getDictionary().get(length)?.has(guess) ?? false
}
