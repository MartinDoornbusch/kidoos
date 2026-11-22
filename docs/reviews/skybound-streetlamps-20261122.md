# SKYBOUND — kwaliteitsronde vrijstaande straatlantaarns
**Status:** visuele research + in-code audit 22-11-2026. **Niets gedownload, geconverteerd, gemerged of gedeployed.**

## Feitelijke basis
Laatste `main` en `visuals-1.7` zijn bij de controle gelijk op commit `da2d2cc6ea1d48575d45a3a751221e07517da2cf`. `src/art/credits.txt` gaat tot versie **1.17.0**. Het Sketchfab-model **Kigha Medieval Wall-Mounted Lantern** is al geïntegreerd als `sf_lantern` op gevels (CC BY). De eerder aangeleverde **DoniTodorov House**, fireplace, gate en wooden window zijn ook gecrediteerd.

`src/world.js` rond regels 391–409:
- `wallLantern()` gebruikt het echte `sf_lantern`-model op gebouwen, schaalfactor 1.7 en warme emissive op het glas.
- `lamp()` voor **vrijstaande lampen langs de weg** gebruikt nog `column`, `crook`, `scroll` en de zelfgemaakte `lantern()`.
- Laatste stand: straatlantaarnpalen zijn dus **niet** op dezelfde kwaliteitsstandaard als de wandlantaarns.
- Lantaarns komen herhaald voor op de hoofdweg en in verschillende dorpjes. Kosten per herhaald model en aantal dynamische lichten zijn belangrijk.

## Visueel ontwerp
Vervang niet blind de volledige straatlantaarn. **Eerste aanpak: hergebruik bestaande realistische Kigha-lamp en maak een houten/smeedijzeren staander met een realistische montage.** Kigha's model heeft een ingebouwde wandbeugel: controleer of die te scheiden is. Voeg geen tweede dubbele beugel of haak toe.
- Boomstam/pilaar: natuurlijk vergrijsd hardhout, herkenbare houtvezels, goede ruwe bump/normal, met donkere smeedijzeren banden en kleine boutkoppen.
- Gevellantaarn kan technisch dezelfde lampkop zijn; maak voor straatvariant een aangepaste montage, niet een nieuwe bron.
- Halve/hele nacht: emissive op glas met warme kleur, selectieve lokale verlichting zonder elke paal een shadow-casting pointlight te geven.
- Schaal vergelijkbaar met voetganger: paal circa 2,8–3,4 m en montage zonder clipping; voorkom zweven in lucht of in bomen. Geen onnatuurlijke dikke steenvoet of licht te laag boven hoofd van de spelers.
- Visual screenshot A/B in daglicht, schemer en nacht, naast dezelfde weg op Windhaven; check silhouet van dichtbij en 15–25 m afstand.

## Enige nieuwe Sketchfab-kandidaat die door de harde technische selectie komt
[Streetlight — yaroslav.ostapenko](https://sketchfab.com/3d-models/streetlight-330c434169134742abe72371fb95d03c).
- Modelpagina bevestigt: **2.200 triangles, circa 1.200 vertices**, CC Attribution, download beschikbaar.
- Maker: “Medieval street lamp. Can be used in mobile game.”
- Technisch past dit in ons budget (300–3.000 tris voor een herhaald object).
- De bronmetadata zegt **niets overtuigends over PBR-kwaliteit en zichtbare afwerking**; vóór downloaden moet Claude de volledige 3D-preview naast de bestaande `lamp()` bekijken. **Geen automatisch GO voor download.**

## Modellen die minder goed passen
| Model | Gegevens gepubliceerd op bronpagina | Oordeel |
|---|---|---|
| [Medieval Lamp — Vova Truskov](https://sketchfab.com/3d-models/medieval-lamp-c4817197f15d40668c3df096135ef423) | 1.300 triangles, CC BY, duidelijk gestileerde vormen | Niet beter dan wat gebruiker wil: te glanzend/kantig |
| [Low poly lamp post — dasWarder](https://sketchfab.com/3d-models/low-poly-lamp-post-b48f61c6ce294bb2a0da5311800de67b) | 296 tris, CC BY, maker noemt low-poly stylized | Te eenvoudig voor professioneel realistisch straatbeeld |
| [Wooden Lamp Post Medieval Fantasy Lantern — attilakozma](https://sketchfab.com/3d-models/wooden-lamp-post-medieval-fantasy-lantern-7272ba80886d4d9d897d783c708adb2d) | 5.900 tris; **CC BY-NC en NoAI** | **Afwijzen: restrictieve licentie** |
| [Medieval Lamp Post — Glowbox 3D](https://sketchfab.com/3d-models/medieval-lamp-post-475f7f916c964948887a7f8b8f769da5) | 8.200 tris, CC BY en NoAI | Te zwaar voor herhaling en niet vrij van bronbeperkingen |
| [Medieval Lamp Post — the8thlab](https://sketchfab.com/3d-models/medieval-lamp-post-6373453ad79748b38784db0fcf25ea12) | 13.700 tris, 4K scans, glas en licht moeten nog gemaakt | Te zwaar tegenover aanwezig Kigha-lampje |
| [Rustic Wooden Lantern Post — Fab](https://www.fab.com/listings/7d78c436-5bce-4e02-b5fa-8a4a1c0c3f4d) | 40.000 tris, merged mesh, 2K PBR | Te zwaar en niet zo te herdistribueren in openbare repo |
| [Medieval Street Lantern — Ishan Choudhury](https://sketchfab.com/3d-models/medieval-street-lantern-7c89d32b53aa401caf431cd25fc1011e) | Eerder in Claude's batch 1 afgekeurd vanwege placeholderachtige kleur | Blijft afgewezen |

## Integratieverzoek aan Claude (alleen na review)
1. **Huidige asset inventariseren**, dus `sf_lantern` uit `src/models/` hergebruiken en de bestaande `lamp()` opsporen. Geen bronmodel opnieuw vragen dat al in repo staat.
2. Proef eerst één **vrijstaande lamp** met goede houten of ijzeren paal, aangepast Kigha-lantaarnonderdeel (als de bracket scheidbaar is) óf een geloofwaardige eigen lampkop die exact aansluit op het glas- en metaalmateriaal.
3. Doe A/B screenshots en noem een winnaar: huidig procedureel model versus eigen hybride versus één extern model (alleen als geschikt).
4. Behoud collision bij paal en bestaande `keepOut`-regels bij deuren, NPC-routes en bruggen. Lichtbron mag niet door bomen/daken steken. Controleer afstand tot speler voor de paal.
5. Model herhaald (doel max. 3.000 tris, max. 1–2 draw calls per variant door instancing/shared materials, texture 512–1024).
6. Test mobiel, nacht (geen tientallen schaduwgevende lampen), dag, animatie en camera, en oude saves.
7. Pas pas na screenshots en akkoord definitief toe. **Geen automatische deploy.**

## Downloadbesluit
**Nu geen nieuw bestand downloaden.** Het bestaande Kigha-model is de meest veelbelovende bron voor een uniforme lampstijl. Als Claude's screenshotvergelijking aangeeft dat een volledig model overtuigender is, laat hem eerst [Streetlight — yaroslav.ostapenko](https://sketchfab.com/3d-models/streetlight-330c434169134742abe72371fb95d03c) volledig in de Sketchfab-viewer controleren, inclusief licentie en 3D-materialen, voordat de gebruiker iets downloadt.

## Rugzakkeuze ter afbakening
Gebruiker koos in dezelfde werksessie de **tevy Canvas Backpack with Bedroll — LOD1 (2.362 triangles)**. Andere rugzakken zijn uit de actieve shortlist; de selectie is in de aparte backpack-research branch bijgewerkt. De huidige `main`-scenerycode bevat bij controle nog de zelfgemaakte tas, dus integratie is **niet** bevestigd. Dit PR wijzigt `src/scenery.js` niet.
