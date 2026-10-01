# Evening Games

A mobile-friendly, multiplayer Wordle party app. Players type their name, play a bundled
series of custom word challenges, and compete on a shared leaderboard.

- **Framework:** TanStack Start (React SSR) with file-based routes
- **Runtime:** Cloudflare Workers via `@cloudflare/vite-plugin` and Wrangler
- **Database:** Cloudflare D1 for runs, guesses and scores
- **Package manager:** pnpm
- **Lint/format:** Biome
- **Styling:** Tailwind CSS v4
- **Tests:** Vitest

## How it works

1. Enter a name on the home screen. The name is stored in `localStorage`.
2. Starting the series creates a **run** in D1 and returns only challenge metadata
   (length, hint, category). Answers and the guess dictionary stay on the server.
3. Each guess is sent to a server function that validates it against the bundled word list,
   scores it, stores it, and returns tile feedback.
4. When the series ends, the score is recomputed from the stored guesses and written to the
   leaderboard. Ranking is: words solved, then fewest guesses, then fastest time.

Because scoring happens server-side from recorded guesses, custom answers are never shipped
in the client bundle and leaderboard entries cannot be hand-crafted from the browser.

## Local development

Requirements: Node 22+, pnpm, and no Cloudflare account needed for local work.

```bash
pnpm install
pnpm db:migrate:local   # applies migrations to the local D1 database
pnpm dev                # http://localhost:3000
```

Useful commands:

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Vite dev server with the Workers runtime and local D1 |
| `pnpm test` | Vitest unit tests for game logic and config |
| `pnpm lint` | Biome lint |
| `pnpm check` | Biome lint + format with autofixes |
| `pnpm build` | Production build plus `tsc --noEmit` |
| `pnpm preview` | Run the production build locally in workerd |
| `pnpm cf-typegen` | Regenerate `worker-configuration.d.ts` from `wrangler.jsonc` |
| `pnpm db:migrate:local` | Apply D1 migrations to the local database |
| `pnpm db:migrate:remote` | Apply D1 migrations to the deployed database |

Local D1 data lives in `.wrangler/state/v3/d1`. Delete that directory to reset it, then run
`pnpm db:migrate:local` again.

## Editing the challenges

The series is defined in [`src/server/data/challenges.server.ts`](src/server/data/challenges.server.ts).
Each challenge is a five-letter answer with an optional hint and category:

```ts
{
  id: "music",
  answer: "MUSIC",
  category: "Theme",
  hint: "Turn it up",
}
```

Rules:

- `answer` must be exactly five uppercase letters.
- `id` must be unique within the series.
- Answers do not have to exist in the dictionary; an exact match always counts as correct.
- Add more series to the `SERIES` array later if you want multiple events.

The allowed-guess list is `src/data/wordle-allowed-guesses.txt`, derived from the MIT-licensed
[tabatkins/wordle-list](https://github.com/tabatkins/wordle-list). Refresh it by replacing the
file with one uppercase five-letter word per line.

## Deploying to Cloudflare

Remote deployment needs a Cloudflare account.

```bash
pnpm exec wrangler login
pnpm exec wrangler d1 create evening-games-db
```

Copy the `database_id` from the command output into `wrangler.jsonc`, then:

```bash
pnpm db:migrate:remote
pnpm deploy
```

`pnpm deploy` builds the app and runs `wrangler deploy`, which uses the generated
`dist/server/wrangler.json` produced by the Cloudflare Vite plugin.

## Project structure

```
migrations/                  D1 schema migrations
public/                      manifest and icons
src/components/              WordGrid, Keyboard, ScoreTable
src/data/                    bundled guess dictionary
src/lib/                     pure game logic, formatting, storage helpers
src/routes/                  /, /play, /results, /leaderboard
src/server/                  server functions and D1 access
src/server/data/             challenge series configuration
```

## Database schema

- `runs` — one row per series attempt (`player_name`, `series_id`, start/finish timestamps)
- `run_guesses` — every submitted guess with its encoded feedback
- `scores` — finalized totals used by the leaderboard
