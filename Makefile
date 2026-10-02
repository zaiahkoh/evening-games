dev:
	pnpm dev

reset:
	pnpm exec wrangler d1 execute evening-games-db --remote \
	--command "DELETE FROM run_guesses; DELETE FROM scores; DELETE FROM runs;"
