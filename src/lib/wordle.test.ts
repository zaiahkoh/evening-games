import { describe, expect, it } from "vitest"
import {
  computeLetterStates,
  decodeFeedback,
  encodeFeedback,
  evaluateGuess,
  isWellFormedGuess,
  normalizeGuess,
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
  })

  it("validates well formed guesses", () => {
    expect(isWellFormedGuess("PARTY")).toBe(true)
    expect(isWellFormedGuess("PART")).toBe(false)
    expect(isWellFormedGuess("PARTY!")).toBe(false)
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
