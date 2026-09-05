# Flip 7 Punkteblock

Eine mobile Web-App mit Next.js App Router, React und TypeScript. Gestaltung nach lokalen Kartenreferenzen, mit lokal eingebundenen Schriften.

## Lokal starten

Node.js 24 verwenden. Die Version ist in `.node-version` festgelegt.

```sh
npm ci
npm run dev
```

Auf dem Mac: http://localhost:3000

Auf dem iPhone im selben WLAN: `http://<IP-des-Macs>:3000`. Die WLAN-Adresse des Macs findest du mit:

```sh
ipconfig getifaddr en0
```

Der Dev-Server lauscht auf `0.0.0.0`, Änderungen werden automatisch übernommen. Es sind keine API-Schlüssel oder Umgebungsvariablen nötig.

## Funktionsumfang

- Zwei bis 18 Personen, gespeicherte Namen auswählen, bearbeiten und löschen
- Letzte Besetzung und Punktziel merken
- Punktziele 100, 200, 300 und freie Eingabe von 1 bis 9999
- Umschaltbare Eingabe per Touch-Zahlentastatur oder Auswahl der Zahlen- und Bonuskarten
- Automatische Berechnung inklusive ×2 und Flip-7-Bonus
- Direkter Rundenabschluss bei der letzten Person, vorher klar benannter Wechsel zur nächsten
- Bis zum Bildschirmrand wischbare Spielerkarten ab drei Personen, mit Neigung und symmetrischen Ornamenten
- Größere Rundenwerte und Gesamtsummen mit horizontal scrollbarer Tabelle
- Gewinn-Dialog nach der vollständigen letzten Runde, dezente Übergänge und animierte Gesamtpunkte
- Systemeinstellung für reduzierte Bewegung wird berücksichtigt
- Ziehbare Dialoge und integriertes Bearbeiten und Löschen von Namen
- Vollständige Rundenwertung, Gesamtsummen und gemeinsamer Sieg bei Gleichstand
- Frühere Runden korrigieren und bis zu 50 Aktionen rückgängig machen
- Laufende Partie einschließlich angefangener Zahleneingabe wiederherstellen
- Revanche mit derselben Besetzung und demselben Punktziel
- App-Manifest, Home-Screen-Icons und Offline-Cache im Produktionsmodus

Im Modus Punkte gibst du die fertige Rundensumme ein. Im Modus Karten berechnet die App sie aus den ausgewählten Karten. Kamera, Challenge und eine Sammlung abgeschlossener Partien gehören nicht zu dieser Version. Bei einer Revanche wird die vorherige Partie ersetzt.

Gespeicherte Namen und Spielernamen in einer laufenden Partie sind getrennt. Umbenennen oder Löschen eines Profils verändert vorhandene Rundenergebnisse nicht.

## Speicherung und Offline-Nutzung

Spielstände werden versioniert in `localStorage` gespeichert, nur im verwendeten Browser auf dem jeweiligen Gerät. Eine andere Adresse oder ein anderer Port hat einen eigenen Speicher. Das Löschen von Website-Daten löscht auch die gespeicherten Namen und Punkte.

```sh
npm run build
npm start
```

Der Build erzeugt einen statischen Export in `out/` und anschließend `out/sw.js` aus den tatsächlich exportierten Next.js-Dateien. `npm start` liefert diesen Export lokal aus. Der Service Worker speichert die App und ihre Schriften für die Offline-Nutzung. Im Dev-Modus wird kein Service Worker registriert.

Auf dem iPhone benötigt die Offline-Funktion eine HTTPS-Adresse. Die HTTP-Adresse im WLAN reicht zum Testen der Bedienung, Speicherung und des Designs. Auf `localhost` am Mac lässt sich der Produktionsmodus auch ohne HTTPS offline prüfen.

In Safari über **Teilen → Zum Home-Bildschirm** hinzufügen. Das tatsächliche Verhalten mit iPhone-Tastatur, Home-Indikator, Sperren und erneutem Öffnen sollte ergänzend auf dem Gerät geprüft werden.

## Prüfen

```sh
npm run check
npm run build
npx playwright install webkit
npm run test:e2e
```

Die Browserprüfung verwendet WebKit mit iPhone-13- und iPhone-SE-Ansichten sowie lokal installiertes Google Chrome. Der Produktionsserver für Tests läuft auf Port 3107. Die Offline-Prüfung schaltet einen separaten lokalen Testserver ab, statt WebKits fehleranfällige Offline-Emulation zu verwenden.

Screenshots liegen in `artifacts/`, Fehlerberichte in `test-results/`. Browseremulation ersetzt keine Prüfung auf einem physischen iPhone.

## Aufbau

- `src/app/`: Next.js-Seite, Metadaten, globale Gestaltung
- `src/components/`: Scoreboard, Eingabe und Dialoge
- `src/game.ts`: Rundenwertung und Prüfung gespeicherter Daten
- `src/scoring.ts`: Kartenwertung und Prüfung der Kartenauswahl
- `src/fonts/`: lokale Schriften und ihre Lizenzen
- `scripts/build-sw.mjs`: erzeugt den Offline-Cache beim Build
- `tests/`: Wertungs- und Browserprüfungen

## Technik und Versionen

Next.js 16.3.4 mit App Router und Turbopack, React 19.2.8 und TypeScript 7.0.2. Die installierten Versionen sind über `package-lock.json` reproduzierbar. Die statische Seitenhülle wird mit Next.js erstellt, der persönliche Spielstand wird nach der Hydrierung aus dem Browser geladen. Schriften werden über `next/font/local` bereitgestellt.

`npm run check` führt die offiziellen Next.js-, React- und TypeScript-Lintregeln, den strikten Typecheck und die Wertungstests aus. ESLint 10 verwendet `@eslint/compat`, weil einige Plugins der aktuellen Next.js-Konfiguration noch die ältere Regel-API nutzen. Beim Installieren können diese Plugins deshalb Peer-Warnungen für ESLint ausgeben. Es werden keine Prüfregeln abgeschaltet.

TypeScript 7 wird für `tsc` verwendet. Zusätzlich steht die TypeScript-6-API über Microsofts offizielles Kompatibilitätspaket für Next.js und typescript-eslint bereit. Diese [von Microsoft empfohlene parallele Installation](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0) ist nötig, solange diese Werkzeuge die neue API noch nicht unterstützen.

Der englische Hinweis in `AGENTS.md` wird von Next.js selbst erzeugt. Er fordert Coding-Assistenten dazu auf, die mitgelieferte Dokumentation der installierten Version zu lesen. Es handelt sich um reguläres Next.js.

## Deployment

Die App wird als statischer Export auf einer eigenen Domain oder Subdomain betrieben. GitHub Actions prüft und baut den Quellcode. Wie beim Portfolio erzeugt `dev` den Auslieferungsbranch `deploy` und `master` den Auslieferungsbranch `production`. Der Server übernimmt die Dateien aus dem jeweiligen Auslieferungsbranch.

Einrichtung und Ablauf stehen in [docs/deployment.md](docs/deployment.md).
