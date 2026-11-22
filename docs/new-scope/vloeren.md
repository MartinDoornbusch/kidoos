# Nieuwe scope — alleen visuele materiaalcorrectie van vloeren

**Deze specifieke gebruikersklacht is niet als afzonderlijke herstelopdracht in PR #1–#11 opgenomen.** Geen heraudit van meubels/props uit PR #6.

## Huidige stand
- In `src/world.js:1122–1125` gebruiken gewone kamervloeren `woodFloor` met `wood.jpg` en een kleurfilter, en stenen vloeren `stoneFloor` met `paving.jpg`. `world.js:1165` kiest per kamer de vloer; de bovenverdiepingen gebruiken eveneens `wood.jpg`.
- Gebruiker ervaart een deel van de huisvloeren als **leisteendaken**. Dat is waarschijnlijk primair schaal, UV-orientatie en een niet-vloerspecifieke PBR-asset, niet een nieuw meubelprobleem.

## Opdracht voor Claude
1. Maak close-ups van de vloer van **alle negen interieurs**, met detail van hout/steen, trapovergangen en landhuisgalerij.
2. Kies een echte langsgerichte houten plankenstructuur voor woon- en werkvertrekken; gebruik plaatselijk passende grotere flagstones/slijtplekken voor de smederij en steenkamer. Geen dakpan-/leisteenpatroon of grote onnatuurlijke herhaalblokken.
3. Pas UV-orientatie en meterschaal per vloer aan, zorg voor subtiele normal/roughness en veroudering; behoud de vloerhoogte en colliders.
4. Geen extra meubels of objectdownloads; behoud portal-interieurs, traplopen en lichtverdeling.
5. Toon voor/na op dezelfde camerastand en controleren op mobiel.

**Afgrenzing:** PR #6 blijft eigenaar van meubels en props; PR #9 van buitengevels; PR #10 van buitenpaden.