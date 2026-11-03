# Working on this repo (token economy)

1. Read `MAP.md` first. It indexes every file, entity and rule. Do not open files to "look around".
2. Open only the file(s) you change. Domain logic is in `src/domain/` (pure, tested); UI in `src/ui/`; DB only in `src/db/`.
3. After a change: `npm test` (unit) and `npm run build`. Phone flow smoke test: `npm run preview` then `python3 tests/e2e_smoke.py`.
4. When you add/rename a file, entity or rule, update `MAP.md` in the same commit (keep it under ~60 lines).
5. Keep files small (one module each). Prefer editing over rewriting.
