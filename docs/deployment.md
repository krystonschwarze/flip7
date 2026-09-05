# GitHub und Server-Deployment

Zieladresse: https://flip7.krystonschwarze.com
Repository: https://github.com/krystonschwarze/flip7

## Aufbau

Flip 7 verwendet den statischen Next.js-Export. `npm run build` erzeugt `out/` einschließlich Service Worker, Manifest, Icons und lokalen Schriften. Auf dem Server wird ausschließlich ein Webserver für statische Dateien benötigt.

Die Struktur entspricht dem Portfolio-Repository:

| Quellbranch | Auslieferungsbranch | Verwendung                 |
| ----------- | ------------------- | -------------------------- |
| `master`    | `production`        | Produktive Subdomain       |
| `dev`       | `deploy`            | Optionales Staging         |
| `feature/*` | keiner              | Entwicklung und CI-Prüfung |

GitHub Actions führt Lint, Typecheck, Wertungstests, Build und Browser-Tests aus. Erst nach erfolgreicher Prüfung wird der Auslieferungsbranch aktualisiert. Pull Requests veröffentlichen nichts. Actions sind auf Commit-SHAs festgelegt: checkout 7.0.1, setup-node 7.0.0 und actions-gh-pages 4.1.0.

Der Publish-Job verwendet das repository-eigene `GITHUB_TOKEN` mit Schreibrecht auf Inhalte. Server-Zugangsdaten werden nicht benötigt. Wie beim Portfolio stellt dieser Workflow Dateien im Git-Branch bereit. Er konfiguriert weder DNS noch den Webserver und überträgt keine Dateien direkt per SSH oder FTP.

## Server einrichten

1. Die Subdomain `flip7.krystonschwarze.com` im Hosting anlegen und auf den vorgesehenen Webspace zeigen lassen.
2. Ein HTTPS-Zertifikat für die Subdomain aktivieren und HTTP auf HTTPS umleiten.
3. Ein eigenes, leeres Dokumentenverzeichnis für Flip 7 verwenden.
4. In der Git-Anbindung des Hostings das öffentliche Repository und Branch `production` auswählen. Alternativ dessen Dateien in das Dokumentenverzeichnis übernehmen.
5. Den Inhalt des Branches direkt ausliefern. `index.html` muss im Dokumentenverzeichnis liegen, nicht in einem weiteren `out`-Unterordner. Es ist kein Build-Kommando auf dem Server nötig.
6. Den automatischen Abruf nach GitHub-Updates entsprechend der vorhandenen Hosting-Einrichtung aktivieren. Falls das Hosting einen Webhook benötigt, dessen URL dort erzeugen und anschließend im GitHub-Repository hinterlegen.

`/sw.js`, `/index.html` und `/manifest.webmanifest` sollten mit `Cache-Control: no-cache` ausgeliefert werden. Dateien unter `/_next/static/` besitzen versionierte Namen und können langfristig mit `Cache-Control: public, max-age=31536000, immutable` gecacht werden. Diese Header werden im Webserver oder Hosting-Panel konfiguriert.

Die App erwartet die Wurzel einer eigenen Domain oder Subdomain. Ein Unterverzeichnis wie `/flip7/` ist nicht konfiguriert.

## Nach dem ersten Deployment prüfen

- Startseite, `/sw.js` und `/manifest.webmanifest` über HTTPS öffnen.
- Namen anlegen, eine Runde eintragen und neu laden.
- Die App in Safari zum Home-Bildschirm hinzufügen, einmal online öffnen und anschließend offline erneut öffnen.
- Nach einem Update alle offenen App-Fenster schließen und erneut öffnen, damit ein wartender Service Worker aktiv werden kann.

Die lokale Testadresse und die produktive Subdomain haben getrennte Browserspeicher. Bereits lokal gespeicherte Namen oder Partien werden nicht automatisch übertragen.

## Änderungen veröffentlichen

Änderungen auf `feature/*` entwickeln und prüfen. Vor einem Push die Branch- und Commit-Namen sowie gegebenenfalls den PR-Titel abnehmen lassen. Änderungen zunächst nach `dev` und für die Veröffentlichung nach `master` übernehmen. Dabei die tatsächlichen Schutzregeln der Branches beachten.

Vor Veröffentlichungen die Version in `package.json` und `package-lock.json` gemeinsam erhöhen. Generierte Dateien werden ausschließlich durch den Workflow in `deploy` oder `production` geschrieben. Der Service Worker erhält bei jedem Build eine neue Cache-Version.

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
