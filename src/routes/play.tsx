import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Keyboard } from "#/components/Keyboard"
import { WordGrid } from "#/components/WordGrid"
import { formatElapsed } from "#/lib/format"
import { clearStoredRunId, readStoredRunId } from "#/lib/storage"
import type { GuessFailureReason, RunState } from "#/lib/types"
import { computeLetterStates } from "#/lib/wordle"
import { finishRun, getRunState, submitGuess } from "#/server/game"

export const Route = createFileRoute("/play")({
  component: PlayPage,
})

const ERROR_MESSAGES: Record<GuessFailureReason, string> = {
  "unknown-run": "This game session expired. Start a new run.",
  "unknown-challenge": "Something went wrong. Reload the page.",
  "run-finished": "This run is already finished.",
  "out-of-order": "Finish the current word first.",
  "challenge-finished": "This word is already done.",
  "no-attempts-left": "No attempts left for this word.",
  "invalid-format": "Not enough letters.",
  "not-in-dictionary": "Not in the word list.",
}

type OverlayState = {
  solved: boolean
  solution: string
  nextChallengeId: string | null
}

function PlayPage() {
  const navigate = useNavigate()
  const [run, setRun] = useState<RunState | null>(null)
  const [phase, setPhase] = useState<"loading" | "missing" | "ready">("loading")
  const [currentGuess, setCurrentGuess] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [overlay, setOverlay] = useState<OverlayState | null>(null)
  const [busy, setBusy] = useState(false)
  const [shakeKey, setShakeKey] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const shakeTimer = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false
    const runId = readStoredRunId()
    if (!runId) {
      setPhase("missing")
      return
    }
    getRunState({ data: { runId } })
      .then((state) => {
        if (cancelled) return
        if (!state) {
          clearStoredRunId()
          setPhase("missing")
          return
        }
        if (state.finished) {
          void navigate({ to: "/results", search: { run: state.runId } })
          return
        }
        setRun(state)
        setPhase("ready")
      })
      .catch(() => {
        if (!cancelled) setPhase("missing")
      })
    return () => {
      cancelled = true
    }
  }, [navigate])

  useEffect(() => {
    if (phase !== "ready") return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [phase])

  useEffect(() => {
    return () => {
      if (shakeTimer.current !== null) window.clearTimeout(shakeTimer.current)
    }
  }, [])

  const challenge = run ? run.challenges[run.currentIndex] : null

  const letterStates = useMemo(
    () => (challenge ? computeLetterStates(challenge.guesses, challenge.feedback) : {}),
    [challenge],
  )

  const triggerShake = useCallback((text: string) => {
    setMessage(text)
    setShakeKey((key) => key + 1)
    if (shakeTimer.current !== null) window.clearTimeout(shakeTimer.current)
    shakeTimer.current = window.setTimeout(() => setShakeKey(0), 600)
  }, [])

  const handleKey = useCallback(
    (letter: string) => {
      if (!challenge) return
      setMessage(null)
      setCurrentGuess((previous) =>
        previous.length < challenge.length ? previous + letter : previous,
      )
    },
    [challenge],
  )

  const handleBackspace = useCallback(() => {
    setMessage(null)
    setCurrentGuess((previous) => previous.slice(0, -1))
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!run || !challenge || busy || overlay) return
    const guess = currentGuess.trim().toUpperCase()
    if (guess.length !== challenge.length) {
      triggerShake("Not enough letters")
      return
    }
    setBusy(true)
    setMessage(null)
    try {
      const response = await submitGuess({
        data: { runId: run.runId, challengeId: challenge.id, guess },
      })
      if (!response.ok) {
        triggerShake(ERROR_MESSAGES[response.reason])
        return
      }
      setCurrentGuess("")
      setRun((previous) => {
        if (!previous) return previous
        return {
          ...previous,
          challenges: previous.challenges.map((item, index) => {
            if (index !== previous.currentIndex) return item
            const status = response.solved ? "solved" : response.dead ? "failed" : "playing"
            return {
              ...item,
              status,
              guesses: [...item.guesses, guess],
              feedback: [...item.feedback, response.tiles],
            }
          }),
        }
      })
      if (response.solved || response.dead) {
        setOverlay({
          solved: response.solved,
          solution: response.solution ?? "",
          nextChallengeId: response.nextChallengeId,
        })
      }
    } catch {
      triggerShake("Could not reach the server. Try again.")
    } finally {
      setBusy(false)
    }
  }, [run, challenge, busy, overlay, currentGuess, triggerShake])

  const handleNext = useCallback(async () => {
    if (!run || !overlay || busy) return
    if (overlay.nextChallengeId) {
      const nextIndex = run.challenges.findIndex((item) => item.id === overlay.nextChallengeId)
      if (nextIndex !== -1) {
        setRun((previous) => (previous ? { ...previous, currentIndex: nextIndex } : previous))
      }
      setOverlay(null)
      setMessage(null)
      setCurrentGuess("")
      return
    }
    setBusy(true)
    try {
      const result = await finishRun({ data: { runId: run.runId } })
      if (result.ok) {
        await navigate({ to: "/results", search: { run: run.runId } })
      } else {
        setMessage("Could not save your score. Try again.")
      }
    } catch {
      setMessage("Could not save your score. Try again.")
    } finally {
      setBusy(false)
    }
  }, [run, overlay, busy, navigate])

  useEffect(() => {
    if (phase !== "ready") return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (overlay) {
        if (event.key === "Enter") {
          event.preventDefault()
          void handleNext()
        }
        return
      }
      if (event.key === "Enter") {
        event.preventDefault()
        void handleSubmit()
        return
      }
      if (event.key === "Backspace") {
        event.preventDefault()
        handleBackspace()
        return
      }
      const letter = event.key.toUpperCase()
      if (/^[A-Z]$/.test(letter)) {
        event.preventDefault()
        handleKey(letter)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [phase, overlay, handleNext, handleSubmit, handleBackspace, handleKey])

  if (phase !== "ready" || !run || !challenge) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        {phase === "loading" ? (
          <p className="text-slate-400">Loading your game...</p>
        ) : (
          <>
            <h1 className="text-xl font-bold">No active game</h1>
            <p className="text-sm text-slate-400">
              Enter your name on the home screen to start the series.
            </p>
            <Link to="/" className="rounded-xl bg-amber-400 px-5 py-3 font-bold text-slate-950">
              Go home
            </Link>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Word {run.currentIndex + 1} of {run.challenges.length}
          </p>
          <h1 className="text-lg font-bold">{run.series.title}</h1>
          <p className="text-xs text-slate-500">Playing as {run.playerName}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Time</p>
          <p className="font-mono text-lg tabular-nums">{formatElapsed(now - run.startedAtMs)}</p>
        </div>
      </header>

      <div className="flex items-center justify-center gap-2 text-center text-sm text-slate-400">
        {challenge.category ? (
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-300">
            {challenge.category}
          </span>
        ) : null}
      </div>

      <p aria-live="polite" className="h-5 text-center text-sm font-medium text-amber-300">
        {message}
      </p>

      <div className="flex flex-1 flex-col justify-center">
        <WordGrid
          wordLengths={challenge.wordLengths}
          maxAttempts={run.series.maxAttempts}
          guesses={challenge.guesses}
          feedback={challenge.feedback}
          currentGuess={currentGuess}
          shakeKey={shakeKey}
        />
      </div>

      <Keyboard
        letterStates={letterStates}
        disabled={busy || overlay !== null}
        onKey={handleKey}
        onEnter={() => void handleSubmit()}
        onBackspace={handleBackspace}
      />

      {overlay ? (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-slate-950/70 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center">
          <div className="eg-pop w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-5 text-center shadow-2xl">
            <h2 className="text-lg font-bold">
              {overlay.solved ? "Solved it!" : "Out of attempts"}
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              The word was{" "}
              <span className="font-mono font-bold tracking-widest text-white">
                {overlay.solution}
              </span>
            </p>
            <button
              type="button"
              onClick={() => void handleNext()}
              disabled={busy}
              className="mt-4 w-full rounded-xl bg-amber-400 px-4 py-3 font-bold text-slate-950 transition active:scale-[0.99] disabled:opacity-60"
            >
              {overlay.nextChallengeId ? "Next word" : busy ? "Saving..." : "See results"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
