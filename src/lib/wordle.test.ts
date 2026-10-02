import { describe, expect, it } from "vitest"
import {
  computeLetterStates,
  decodeFeedback,
  encodeFeedback,
  evaluateGuess,
  evaluatePhrase,
  isWellFormedGuess,
  normalizeGuess,
  segmentGuess,
  splitAnswerWords,
  wordLengthsOf,
} from "#/lib/wordle"

describe("evaluateGuess", () => {
  it("marks a perfect guess", () => {
    expect(evaluateGuess("PARTY", "PARTY")).toEqual([
      "correct",
      "correct",
      "correct",
      "correct",
      "correct",
    ])
  })

  it("marks present letters in the wrong position", () => {
    expect(evaluateGuess("PARTY", "TRAPP")).toEqual([
      "present",
      "present",
      "present",
      "present",
      "absent",
    ])
  })

  it("handles duplicate letters without over-counting", () => {
    expect(evaluateGuess("ABBEY", "BABES")).toEqual([
      "present",
      "present",
      "correct",
      "correct",
      "absent",
    ])
    expect(evaluateGuess("ABBEY", "BOBBY")).toEqual([
      "present",
      "absent",
      "correct",
      "absent",
      "correct",
    ])
  })

  it("does not double-count a letter that only appears once", () => {
    expect(evaluateGuess("PARTY", "PUPPY")).toEqual([
      "correct",
      "absent",
      "absent",
      "absent",
      "correct",
    ])
  })
})

describe("guess formatting", () => {
  it("normalizes case and whitespace", () => {
    expect(normalizeGuess("  party ")).toBe("PARTY")
    expect(normalizeGuess(" hot dog ")).toBe("HOTDOG")
    expect(normalizeGuess("movie  night")).toBe("MOVIENIGHT")
  })

  it("validates well formed guesses", () => {
    expect(isWellFormedGuess("PARTY")).toBe(true)
    expect(isWellFormedGuess("PART")).toBe(false)
    expect(isWellFormedGuess("PARTY!")).toBe(false)
  })
})

describe("multi-word answers", () => {
  it("splits answers on whitespace", () => {
    expect(splitAnswerWords("movie   night")).toEqual(["MOVIE", "NIGHT"])
    expect(splitAnswerWords("  ice cream sandwich ")).toEqual(["ICE", "CREAM", "SANDWICH"])
    expect(wordLengthsOf(["MOVIE", "NIGHT"])).toEqual([5, 5])
  })

  it("segments a letter-only guess by word lengths", () => {
    expect(segmentGuess("HOGDOT", [3, 3])).toEqual(["HOG", "DOT"])
    expect(segmentGuess("ICECREAMSANDWICH", [3, 5, 8])).toEqual(["ICE", "CREAM", "SANDWICH"])
    expect(segmentGuess("HOGDO", [3, 3])).toBeNull()
    expect(segmentGuess("HOGDOTS", [3, 3])).toBeNull()
  })

  it("pools letters across the whole phrase", () => {
    const tiles = evaluatePhrase(["HOT", "DOG"], ["DOG", "HOT"])
    expect(tiles).toEqual(["present", "correct", "present", "present", "correct", "present"])
  })

  it("marks a letter present in another word of the phrase", () => {
    const answerWords = ["READ", "BOOKS"]
    const guessWords = ["REAL", "BOODS"]
    const tiles = evaluatePhrase(answerWords, guessWords)
    expect(tiles).toEqual([
      "correct",
      "correct",
      "correct",
      "absent",
      "correct",
      "correct",
      "correct",
      "present",
      "correct",
    ])

    const states = computeLetterStates([guessWords.join("")], [tiles])
    expect(states.D).toBe("present")
    expect(states.L).toBe("absent")
  })
})

describe("feedback encoding", () => {
  it("round-trips tile states", () => {
    const tiles = evaluateGuess("ABBEY", "BABES")
    expect(decodeFeedback(encodeFeedback(tiles))).toEqual(tiles)
  })
})

describe("computeLetterStates", () => {
  it("keeps the best known state for each letter", () => {
    const guesses = ["TRAPP", "PUPPY"]
    const feedback = guesses.map((guess) => evaluateGuess("PARTY", guess))
    const states = computeLetterStates(guesses, feedback)
    expect(states.P).toBe("correct")
    expect(states.A).toBe("present")
    expect(states.U).toBe("absent")
  })
})
