# Visuelles Audit vom 5. September 2026

Die App wurde anhand von 116 Kombinationen aus Ansicht und Fenstergröße untersucht. Screenshots und Messwerte liegen unter `artifacts/visual-audit-final/`. Nach den Korrekturen wurden betroffene Ansichten gezielt erneut aufgenommen. Der Audit-Lauf ist mit `node scripts/visual-audit.mjs` bei laufendem Dev-Server reproduzierbar.

## Umfang

| Umgebung | Größe | Engine |
| --- | --- | --- |
| Kleines iPhone | 320 × 568 | WebKit |
| iPhone Hochformat | 390 × 844 | WebKit |
| iPhone Querformat | 844 × 390 | WebKit |
| Reduzierter Platz für Eingaben | 390 × 400 | WebKit |
| Desktop | 1280 × 900 | Chrome |

Geprüft wurden Startansichten mit leerer, kleiner und voller Besetzung, eigenes Punktziel bis 9999, fünfstellige Ergebnisse, Einstellungen, Hilfe, leere und volle Namenslisten, angefangene Namenseingabe, doppelte Namen, Bearbeiten und Löschen, Punktziel-Fehler, Spielansichten, horizontales und vertikales Scrollen der Tabelle, manuelle Punkteingabe, Kartenauswahl, Verzockt, Korrekturen, Bestätigung einer neuen Partie, gemeinsamer Gewinn mit langen Namen, Ergebnisansicht und Speicherfehler. Bei langen Seiten und Sheets wurde auch das untere Ende kontrolliert.

## Korrigiert

- Fokusrahmen von 3 auf 2 Pixel reduziert, äußerer Abstand von 3 auf 1 Pixel reduziert. In dicht gesetzten Gruppen sitzt der Fokus innen. Abstände beim Bearbeiten und Löschen verhindern Berührungen.
- Spieleranzahl bleibt auch bei 320 Pixel Breite in einer Zeile.
- Lange Tabellenüberschriften werden einheitlich mit Auslassung dargestellt. Die Gesamtsummen stehen auf gleicher Höhe.
- Punkteingabe hat einen eigenen scrollbaren Inhaltsbereich. Abschlussbutton, Karten-Rechensumme, Verzockt und Meldungen stehen außerhalb dieses Bereichs und bleiben erreichbar.
- Lange Aktionsbeschriftungen haben eine begrenzte Breite mit Auslassung; die vollständige Beschriftung bleibt im zugänglichen Namen enthalten.
- Lange Namen bei gemeinsamem Sieg stehen separat und mit angepasster Schriftgröße.
- Vier- und fünfstellige Gesamtpunkte erhalten auf schmalen Displays passende Schriftgrößen.
- Ausgewähltes Verzockt verwendet dunklen Hintergrund und helle Schrift mit gutem Kontrast.
- Sheet-Überschriften einschließlich Schließen bleiben beim Scrollen sichtbar; der seitliche Versatz des Schließen-Buttons wurde entfernt.
- Hilfetext zur Bestätigung der Verzockt-Eingabe berichtigt.

## Prüfung und Grenzen

Die vollständige Browser-Suite mit 24 Fällen war erfolgreich. Nach weiteren Layoutkorrekturen wurden die betroffenen Fälle erneut geprüft. Produktionsbuild, Lint, Typecheck und zehn Wertungstests waren erfolgreich.

Der große Screenshot-Durchlauf meldete keine horizontal überlaufende Seite, kein horizontal überlaufendes Sheet und keinen außerhalb des sichtbaren Fensters liegenden Abschlussbereich der Punkteingabe. Messwerte ersetzen die zusätzlich vorgenommenen visuellen Kontrollen nicht.

Bewusst erhalten bleiben angeschnittene Karten im horizontalen Karussell, ausschnittsweise sichtbare Tabellen- und Listeneinträge beim Scrollen sowie Auslassungen langer Namen in kompakten Übersichten. Die Inhalte sind durch Scrollen beziehungsweise Öffnen der Eingabe zugänglich.

WebKit mit iPhone-Konfiguration ist keine Prüfung auf einem physischen iPhone. Insbesondere die echte Bildschirmtastatur, Safari-Werkzeugleisten, Safe Areas und native Auswahlgriffe sind nur teilweise emulierbar. Das Fenster mit 390 × 400 Pixeln prüft Platzmangel, es simuliert keine echte Tastatur.

## Bildbelege

- [Start mit langen Namen](../artifacts/visual-audit-final/se-start-two.png)
- [Fokus beim Bearbeiten](../artifacts/visual-audit-final/se-people-edit.png)
- [Tabellenüberschriften](../artifacts/visual-audit-verified/desktop-game-full.png)
- [Fünfstellige Punkte](../artifacts/visual-audit-verified/se-score-five-digits.png)
- [Gemeinsamer Sieg](../artifacts/visual-audit-verified/se-winner.png)
- [Hilfe bis zum Ende gescrollt](../artifacts/visual-audit-help/se-help-bottom.png)
- [Karten mit festem Aktionsbereich](../artifacts/visual-audit-actions/se-score-cards.png)
- [Punkteingabe bei wenig Höhe](../artifacts/visual-audit-actions/keyboard-space-score-manual.png)
