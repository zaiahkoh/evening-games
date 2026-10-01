const NAME_KEY = "evening-games:player-name"
const RUN_KEY = "evening-games:run-id"

function read(key: string): string | null {
  if (typeof window === "undefined") return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Storage can be unavailable (private mode, quota, disabled cookies).
  }
}

function remove(key: string): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Ignore storage failures.
  }
}

export function readStoredName(): string | null {
  return read(NAME_KEY)
}

export function writeStoredName(name: string): void {
  write(NAME_KEY, name)
}

export function readStoredRunId(): string | null {
  return read(RUN_KEY)
}

export function writeStoredRunId(runId: string): void {
  write(RUN_KEY, runId)
}

export function clearStoredRunId(): void {
  remove(RUN_KEY)
}
