import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { WordGrid } from "#/components/WordGrid"
import type { TileState } from "#/lib/types"

function count(html: string, needle: string): number {
  return html.split(needle).length - 1
}

describe("WordGrid", () => {
  it("renders one tile per letter and one group per word", () => {
    const feedback: TileState[] = Array.from({ length: 10 }, () => "correct")
    const html = renderToStaticMarkup(
      <WordGrid
        wordLengths={[5, 5]}
        maxAttempts={1}
        guesses={["MOVIENIGHT"]}
        feedback={[feedback]}
        currentGuess=""
        shakeKey={0}
      />,
    )

    expect(count(html, "aspect-square")).toBe(10)
    expect(count(html, "flex-grow:")).toBe(2)
    for (const letter of "MOVIENIGHT") {
      expect(html).toContain(`>${letter}<`)
    }
  })

  it("keeps the active guess inside the word groups", () => {
    const html = renderToStaticMarkup(
      <WordGrid
        wordLengths={[3, 5]}
        maxAttempts={1}
        guesses={[]}
        feedback={[]}
        currentGuess="HOT"
        shakeKey={0}
      />,
    )

    expect(count(html, "aspect-square")).toBe(8)
    expect(html).toContain(">H<")
    expect(html).toContain(">O<")
    expect(html).toContain(">T<")
  })
})
