# SKYBOUND — visual audit, wachttoren & aanvullende assets (22 november 2026)

**Review-branch:** `review/skybound-ruin-visual-qa-20261122`, vanaf `visuals-1.7` (ontwikkelversie 1.16).  
**Geen models gedownload, geen 3D-code gewijzigd, geen deploy.**
**Doel:** alleen verbeteringen die in de daadwerkelijke 3D-wereld zichtbaar meerwaarde bieden.

## 0. Gecontroleerde actuele status

- `main` is nu **1.15.0**, met Poly Haven props en zelfstandige bouwdemo (`/checks/construction-demo.html`); in `src/index.html` is het Bouwatelier **niet** in de spelwereld geïntegreerd.
- `visuals-1.7` ligt één commit voor op `main` met **1.16-werk**:
  - `src/world.js` bevat bij `RX=-54,RZ=-10.5` een complete level-3 ruïne met vijf visuele fases en dynamische collision.
  - `src/game.js` bevat NPC-interactie, materiaal-/vraagafhandeling, start/finish van level 3.
  - `src/models/sf_plank_*`, `sf_rope` en `sf_drywall` en aangepaste `credits.txt`: de goedgekeurde *Wooden Bridge Modular Kit* zit in de bruggen en *Photogrammetry Stone Wall* is toegepast rond de moestuin.
- De drie door gebruiker als glTF gedownloade bestanden **Medieval Fireplace**, **Old Wooden Gate** en **Square Wooden Window** zijn als downloaden gemeld; daadwerkelijke bestandsinhoud/conversie/gebruik in repo nog niet geverifieerd. Niet nogmaals opvragen.
- Al verstrekt aan Claude: **Medieval Wall-Mounted Lantern (Kigha)** en **Medieval House (DoniTodorov)**. De `assets-extern`-branch bevat testbeelden en een resultaat: huis 14.327 tris en lantaarn 1.100 tris na conversie, nog niet als game-object geïntegreerd volgens dat verslag. Voor de lantaarn is +1,7× schaal en sterker warm glas voorgesteld.
- Eerder afgewezen door Claude: *Modular Medieval Wall – Realistic* en *Ancient Ruins Pack*. Deze blijven afgewezen.

## 1. Wat in versie 1.16 al is gemaakt — niet opnieuw bouwen

Bronnen: `src/world.js` rond regels 739–847; `src/game.js` rond regels 280–310; `src/collision.js`.

| Restauratiefase | In code aangetroffen | Visuele en functionele test |
|---|---|---|
| 0 (start) | Lage ronde ruïne, gebroken muren, poort, standbeeld en rubble | Ruïne moet organisch verweerd ogen, geen losse scherpe doosblokken |
| 1 (onderzoek) | Markeringsstaken met tape en herstelplan op tafel | Plan/markering zichtbaar, NPC Linde, niet door routes heen |
| 2 (puin ruimen) | Rubble verdwijnt; steen en balken komen als stapel vrij | Duidelijke overgang; geen obstakels blijven onzichtbaar collideren |
| 3 (muren) | Ronde toren en kantelen hersteld, gevel van baksteen, steiger zichtbaar | Realistische stenen en schaal; steiger van balken is nu basaal |
| 4 (trappen) | Houten rechte trap plus halfronde opgang naar uitkijkniveau, beloopbare hoogteberekening | Speler kan echt tot uitkijkniveau klimmen, niet van de trap vallen of door leuningen lopen |
| 5 (dak) | Overkapping, lantaarn, vlag, kist met kaart; tijdelijke steiger verdwijnt | Dak moet echt dakmateriaal hebben, kist bereikbaar, geen doorlopende collision van steiger |

**Knelpunt uit codecontrole:** De steiger wordt nu visueel uit dunne, eenvoudige `box()`-balken opgebouwd (`world.js` rond regel 811). Dat is het meest logische object om visueel te versterken; het is niet nodig het complete ruïnegebouw te vervangen.

**Knelpunt in assetgebruik:** De gefotografeerde droge stenen muur (`sf_drywall`) staat rond de moestuin, terwijl de wachttoren procedurale muren met al aanwezige hoogwaardige steen-/leisteenmaterialen gebruikt. Vergelijk of een paar **afgebroken muuraccenten** met hetzelfde gefotografeerde materiaal beter ogen; vermijd rechtstreeks langwerpige tuinmuurmodules op de ronde toren.

**Niet uit code bewezen:** realistische previewkwaliteit, werkelijk FPS, mobiel gedrag en speelbaarheid. Dat is nog 3D-QA.

## 2. Beperkte shortlist — alleen indien bestaande steiger te eenvoudig blijft

| Prioriteit | Model | Pagina | Publicatie-info | Advies |
|---|---|---|---|---|
| A | **Free Wooden Scaffolding Set** — Just8 | https://sketchfab.com/3d-models/free-wooden-scaffolding-set-de6d3cb59d0e4ef99103523ae22fbd88 | CC BY, download beschikbaar, **47.800 triangles voor de complete set** | Alleen visueel vergelijken. Mogelijk een **klein gedeelte** uit de set gebruiken, max. 10–15k tris voor één unieke tijdelijke constructie, bij voorkeur aanzienlijk lichter; controleer individuele meshes/texturebudget; anders afwijzen |
| B | **Old Wooden Ladder** — CurlyFryWhy | https://sketchfab.com/3d-models/old-wooden-ladder-5e818740606642c0885b32bda78cd479 | CC BY, download beschikbaar, **3.100 triangles** | Alleen detail voor de steiger/bouwplaats, **niet** om bestaande werkende torentrap te vervangen; eigenaar vraagt in beschrijving hem te laten weten dat model wordt gebruikt |
| C | **Furniture Pack / Wooden Ladder** — kEam | https://sketchfab.com/3d-models/furniture-pack-low-poly-game-ready-1bfa5e4878eb4a9f83f3cbec80022b5d | CC BY, totaal 5.100 tris, ladder **420 triangles**, 1K/2K-texturen | Technisch lichte fallback voor een ladder, maar voorkom cartoonuitstraling; eerst texture en echte preview beoordelen |

**Opzettelijk niet voorgedragen voor download:** 3DAssets.dev *Wall Repair Scaffold and Hoist* (CC0, 556 tris) is extreem licht, maar als AI-geproduceerd low-poly model onvoldoende bewezen visueel realistisch voor het gewenste eindresultaat. Kan hooguit dienen als functionele referentie; niet als definitieve aankleding.

Ook uitgesloten: Desertsage's betaalde *Medieval Wooden Scaffolding* met NoAI-label (26,9k tris) en sketchfab *Medieval Wooden Ladder* van ArcheoteryxFr (CC BY-NC-ND) wegens de licentie. De losse stone arches van 200k–2.7M triangles zijn geen bruikbare upgrade.

## 3. Voorgestelde grafische oplossing zonder extra download

Voor restauratiefases 3 en 4:
1. Gebruik de **reeds aanwezige** hoogwaardige eiken plankentextuur en nieuwe `sf_plank_*`-objecten voor brede looppaden, dikke staanders, schoren en stellingen.
2. Voeg metalen of houten deuvels, touwknopen en losse steigerplanken toe met instancing; verdeel in enkele gedeelde materialen.
3. Maak een eenvoudige **hijslier** met trommel, touw en mand/steen, waarvan de beweging aan een restauratie-opdracht wordt gekoppeld. Geen apart high-poly object noodzakelijk.
4. Verberg de tijdelijke steigers na fase 5, behoud alleen de afgewerkte houten trap.
5. Zorg dat steiger geen onzichtbare barrières op de openbare route achterlaat.
6. Gebruik de juiste fysieke schaal: stevige palen, realistische loopbreedte en materiaalafwerking. Nooit een kijkdoos of Minecraft-achtig bouwwerk als eindresultaat.

**Voorkeur:** bouw dit eerst met bestaande assets. Alleen als het nog steeds ondermaats oogt, laat Claude de Sketchfab-set van Just8 naast de huidige scène zien.

## 4. QA vóór nieuwe downloads

**Schermen en testposities**
- Maak een screenshot per fase (0–5) vanaf exact dezelfde plek en camerahoek bij daglicht én een avondbeeld in fase 5.
- Maak een close-up van beschadigde muur, herstelde muur, steigerverbindingen, houten trap, dakpannen en kaartkist.
- Vergelijk directe vervanging met het huidige object, niet met een oude render of het introscherm alléén.

**Functionele checks**
- Fase 3: looproute naar de toren en schaarse schaduw;
- Fase 4: elk trede-gedeelte, bocht en landing beloopbaar, geen onzichtbare wand of te grote staphoogte;
- Fase 5: boven aankomen, uitkijkpost veilig betreden, kaartkist bereiken, steiger/collision verdwijnen;
- Interactie met Linde/Gerrit/Joost/Bram laat vragen uit Niek havo 2 of beschikbare Floor havo 3-bank zien en bewaart scores;
- Oude saves en level 1/2 blijven werken, geen dubbele munten of materialen bij herladen.

**Performance checks**
- Triangles vóór/na; draw calls; nieuwe textures en downloadomvang; desktop én mobiele FPS/frametime.
- Niet alleen de asset zelf optimaliseren, maar de totale wereld inclusief bestaande scans controleren.

## 5. Integratie en rolverdeling

**Claude:** review huidige scènes (1.16), visuele correcties, realistische 3D-modellen en collision, screenshotvergelijking, regression en deployment na akkoord.

**ChatGPT:** technische QA-scenario's, assetreview, uitbreidingsontwerp en losse bouwmodule. Raak niet parallel aan `world.js`/`game.js`/`collision.js`.

**Volgende menselijke actie:** nu geen downloads. Eerst Claude het huidige 1.16-beeld laten toetsen. Desgewenst na zijn visuele oordeel **uitsluitend** Just8-scaffold (eerste keuze) of één ladder (alternatief) goedkeuren.

**Geen automatische merge of productie-uitrol.**
