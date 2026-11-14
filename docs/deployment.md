# GitHub und Cloudflare-Deployment

Zieladresse: https://flip7.krystonschwarze.com
Repository: https://github.com/krystonschwarze/flip7

## Aufbau

Flip 7 verwendet den statischen Next.js-Export. `npm run build` erzeugt `out/` einschließlich Service Worker, Manifest, Icons und lokalen Schriften. Seit 2026-11-10 liefert Cloudflare die Dateien als Workers Static Assets aus, im selben Account wie krystonschwarze.com und coolicons.cool (Worker `flip7`, `wrangler.jsonc`). Der Worker führt keinen eigenen Code aus, Anfragen sind kostenlos und zählen nicht gegen das gemeinsame Worker-Limit des Accounts.

Die Entwicklung erfolgt direkt auf `main`. Ein separater Staging-Branch wird nicht verwendet. Der frühere Branch `production` mit den Dateien für Plesk ist seit 2026-11-14 gelöscht, Netcup wird nicht mehr genutzt.

GitHub Actions führt Lint, Typecheck, Wertungstests, Build und Browser-Tests aus. Erst danach deployt der Job `deploy` mit Wrangler und prüft die Live-Seite, auch ob `/sw.js` dem Build entspricht. Scheitert die Prüfung, rollt `wrangler rollback` auf die vorige Version zurück. Pull Requests veröffentlichen nichts. Secrets: `CLOUDFLARE_API_TOKEN` und `CLOUDFLARE_ACCOUNT_ID`.

`public/_headers` setzt HSTS und für `/_next/static/` `Cache-Control: public, max-age=31536000, immutable`. Alle anderen Dateien, also auch `/sw.js`, `/` und `/manifest.webmanifest`, liefert Cloudflare mit `public, max-age=0, must-revalidate` aus. `/index.html` leitet auf `/` um.

Von Hand: `npm run build`, dann `npm run deploy` mit `CLOUDFLARE_ACCOUNT_ID` und `CLOUDFLARE_API_TOKEN`. Rollback: `npx wrangler deployments list`, dann `npx wrangler rollback <version-id>`.

Die App erwartet die Wurzel einer eigenen Domain oder Subdomain. Ein Unterverzeichnis wie `/flip7/` ist nicht konfiguriert.

## Nach dem ersten Deployment prüfen

- Startseite, `/sw.js` und `/manifest.webmanifest` über HTTPS öffnen.
- Namen anlegen, eine Runde eintragen und neu laden.
- Die App in Safari zum Home-Bildschirm hinzufügen, einmal online öffnen und anschließend offline erneut öffnen.
- Nach einem Update alle offenen App-Fenster schließen und erneut öffnen, damit ein wartender Service Worker aktiv werden kann.

Die lokale Testadresse und die produktive Subdomain haben getrennte Browserspeicher. Bereits lokal gespeicherte Namen oder Partien werden nicht automatisch übertragen.

## Änderungen veröffentlichen

Änderungen direkt auf `main` entwickeln und prüfen. Der Nutzer hat automatische Commits und Pushes für dieses Repository freigegeben. Conventional Commits ohne AI-Attribution verwenden und die tatsächlichen Branch-Schutzregeln beachten.

Vor Veröffentlichungen die Version in `package.json` und `package-lock.json` gemeinsam erhöhen. Jeder Push auf `main` deployt nach bestandenen Prüfungen. Der Service Worker erhält bei jedem Build eine neue Cache-Version.

## Lokal den Export testen

```sh
npm ci
npm run check
npm run build
npm start
```

Der statische Vorschau-Server läuft auf Port 3000. Wenn dort bereits der Dev-Server läuft:

```sh
npm start -- --listen 3107
```
