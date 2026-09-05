# CSS-Bereinigung vom 5. September 2026

Die Darstellung bleibt erhalten. `src/app/globals.css` enthält die zusammengeführten Basisregeln, danach die Animationen und die gebündelten Anpassungen für Bildschirmgrößen und reduzierte Bewegung.

- 15 mehrfach verteilte Selektoren zusammengeführt. Keine doppelten Selektoren auf der obersten Ebene mehr.
- Überholte Deklarationen, zwei ungenutzte Keyframe-Animationen und ungenutzte Header-Selektoren entfernt.
- Startaktionen von der fixierten Aktionsleiste im Spiel getrennt.
- Tabellen-, Fokus-, Sheet- und Eingaberegeln bei den jeweiligen Elementen eingeordnet.
- Sieben Media-Query-Blöcke auf vier zusammengeführt.
- Stylesheet von 1.810 auf 1.693 Zeilen reduziert.

## Prüfung

`npm run check`, `npm run build` und alle 24 Browser-Tests erfolgreich. Die Browser-Tests umfassen WebKit in zwei iPhone-Größen und Desktop-Chrome, einschließlich Offline-Nutzung, Namen, Rundeneingabe, Korrektur, Sheet-Gesten und reduzierter Bewegung.

Die visuelle Matrix wurde unmittelbar vor und nach der Änderung mit jeweils 116 Zustands- und Fensterkombinationen aufgenommen. Keine Seitenüberläufe, Sheet-Überläufe, abgeschnittenen Editor-Footer oder fehlgeschlagenen Szenarien.

224 Screenshot-Paare verglichen, davon 210 pixelidentisch. Die 14 übrigen Paare zeigen Rasterunterschiede bei dekorativen Sonnenmustern und einzelnen Randpixeln. Die geprüften Ansichten zeigen keine Layoutverschiebung. Ein zusätzlicher Vergleich sämtlicher berechneter CSS-Eigenschaften an 168 Elementen und Pseudoelementen der Spielansicht ergibt keine Unterschiede zwischen dem alten und neuen Stylesheet.

Nachweise liegen in `artifacts/css-cleanup-before/`, `artifacts/css-cleanup-after/` sowie `artifacts/css-cleanup/pixel-comparison.json` und `artifacts/css-cleanup/computed-game-comparison.json`.

Der Nutzer hat bereits eine echte Partie gespielt und dabei keine größeren Fehler festgestellt. Die automatisierten Prüfungen ergänzen diesen Praxistest. Die reduzierte Fensterhöhe simuliert verfügbaren Platz, keine echte iOS-Tastatur.
