<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Projekt-Konventionen

- Änderungen direkt auf `main` entwickeln. Kein separater `dev`-Branch erforderlich.
- Der Nutzer erlaubt für dieses Repository ausdrücklich automatische Commits und Pushes nach sinnvollen, geprüften Änderungen. Keine erneute Namensabnahme nötig. Diese Projektregel ersetzt hier die globale Freigabe vor jedem Push.
- Conventional Commits verwenden. Keine AI- oder Agent-Attribution, keine Co-Authored-By-Trailer und keine Generated-with-Zeilen in der Git-Historie.
- Tatsächliche Branch-Schutzregeln weiterhin beachten und niemals umgehen.
- GitHub Actions prüft `main` und veröffentlicht den statischen Export nach `production`. Plesk bezieht ausschließlich diesen Auslieferungsbranch.
