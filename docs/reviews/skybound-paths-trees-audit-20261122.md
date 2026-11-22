# StudyQuest SKYBOUND — kwaliteitscontrole van paden en bomen
**Datum:** 22 november 2026 · **Basis:** actuele `main` commit `46a370c5df5473f5247c45c8adf3775079347d03`, **versie 1.18.0**, plus vergelijking `visuals-1.7`.  
**Status:** alleen broncode-, screenshot- en publieke assetbronnen-audit. Geen wijzigingen aan `world.js`/`nature.js`, geen bestanden gedownload, geen live deploy.
**Aanleiding:** speler ziet kwalitatieve architectuur en ruïne, maar wegen, stenen paden en bomen lijken er uit een ander, eenvoudiger spel bij geplaatst.

## 1. Kritieke conclusie: inconsistent materiaal en schaal

**Paden:** `const dirtMap=loadSurface('paving.jpg')` (`world.js:74`). Deze ene bestratingtexture wordt gebruikt voor:
- Hoofdstraten op de drie eerste eilanden: `world.js:551–557`. Width ±2,13 m vanaf de middenlijn, totaal **ca. 4,3 m**; 48 segmenten en slechts één niet-deformerende textuur.
- Afslagen naar de NPC-huizen: `world.js:558–573` uit `branchPoints(villageHome)`, breedte ±0,88 m, dus totaal **ca. 1,76 m**. Zelfde materiaal/texture als hoofdweg.
- Bos- en eilandtrails: `world.js:726–731` via `ribbon()` en `trail()`, breedte ±1,35 m, totaal **ca. 2,7 m**. Zelfde materiaal als stadsbestrating.
- Brugaanloop en connectors: `world.js:57–65,726–733`, meestal eveneens één bepaald vlak en dezelfde texture.
- Losse stationspleinen: eigen circle geometry + `paving.jpg` rond wereldobjecten.

De stroken bevinden zich slechts `0.045–0.058` boven het vlakke eilandgras. Daardoor is er **geen verdiept bed, verweerde steenrand, zand-/grondvoeg of natuurlijke overgang**. Bospaden, geharde dorpswegen en steengroeve lijken materiaalmatig identiek, soms tegels midden in het bos.

**Bomen:** twee relevante implementaties naast elkaar in de code:
- `src/world.js:226–233`: zichtbare `conifers[0..2]` uit tientallen `leafSet(...)`-driehoekige vlakjes, waarvan `pine()` (`world.js:162`) daadwerkelijk gebruikmaakt. Stam `cyl` met **egale bruine kleur**, kroon in drie kleurvarianten. Dit verklaart de gekartelde, spitse boomvorm in de game.
- `src/nature.js:33–44` definieert óók `firGeometry()` uit `ConeGeometry`-takkransen, `world.js:154` maakt `firs`, maar `pine()` **gebruikt deze `firs` niet**. Noem dus niet de kegelbuilder als de actieve boomvorm.
- `world.js:163–169`: `cherry()` bouwt een bloesemboom uit een bruine cilinder, twee takken, **negen `bushGeo`-kronen** plus een top. `bushGeo` is een blader-geometrie, maar de negen delen maken de kroon erg bolvormig en symmetrisch.
- `world.js:904–911`: `appleTree()` gebruikt cilinder + touwen/branches + bolvormige/mesh kroon, met appels uit `sf_apple`. De nieuw geïmporteerde appel is beter; de boomschil zelf is nog eigen geometrie.
- `src/nature.js:87–99`: schaduw, wind en ge-instancete graspollen **bestaan al**. Niet verwijderen; nieuwe boomvarianten moeten op bestaand wind- en instancingbeleid aansluiten.

## 2. Actuele locatie-audit

| ID | Plaats | Probleem in code / verwachting uit screenshot | Gewenste sfeer en padmateriaal |
|---|---|---|---|
| P01 | **Windhaven**, hoofdstraat | Overmatig breed doorlopend vlak van hetzelfde `paving.jpg`; branches identiek; harde rand | Alleen dorpskern/promenade met verouderde natuurstenen bestrating en zachtere voegen; randen met individuele keien, stof en gras |
| P02 | **Windhaven**, zijstraten naar Linde/Wies/Bram/Mara | Zelve materiaal en even harde contour | Kleine slingerende natuursteen-/grindafslagen; onder groen meer opgebrachte grond |
| P03 | **Bloesemvallei**, hoofdlint | Grijze, stenige strook ook tussen bloesembomen; kleurcontrast kan onnatuurlijk zijn | Combinatie lichte grind-/zandkernen, sporadische stenen op drukke stroken, verzachte grasranden |
| P04 | **Dennenhoek**, houthakkerspad naar Gerrit en wachttoren | `trail()` gebruikt dezelfde steenpaving als stad, totaal ±2.7 m breed | **P0**: uitgesleten bosgrond met naalden, aarde, houtspaanders, wortels, sporadische keien; smallere 1.3–2.1 m begaanbare kern |
| P05 | **Molenhoeve**, boerderij en molen | Boerderijpaden lijken op stenen stadstraat | Compacte droge zand-/grindstrook, karrensporen, iets modder langs moestuin, passende stoepen bij gebouw |
| P06 | **Steengroeve**, route rond Joost en steenkar | Steen/grindomgeving vraagt ander loopmateriaal dan tegelpatroon | Gebroken grind, kalksteenstof, enkele platte trapstenen, rotsmeel rond kraan en laaddeur |
| P07 | **Valkenrots / bergpaden** | Te vlak, te uniform, niet genoeg reliëf langs route | Smal, grijs rotsgrind; grovere losliggende keien, kleinere variatie zonder tripping of clipping |
| P08 | **Brughoofden en stations** | Textuur/hoogteovergang kan lijken op opgeplakt vierkant | Zachte aansluiting van brugdek naar aanloop; geen rand/scheur zonder fysieke verklaring |
| P09 | **Level 4 bouwplots** | Nieuwe huislocaties moeten pad-aanloop houden, maar paden/obstakels mogen bouwplot niet insluiten | Verbind bouwplot met huisvoordeur na definitieve schil; `housePlots` en free/blocked check behouden |

**Technische valkuil:** `nearPaving` in `src/village.js` voorkomt objecten op hoofdwegen en huisafslagen, terwijl `nearTrail` in `src/world.js` andere geplande routes afschermt. **Bij het versmallen/verleggen van visuele stroken moeten deze logische route-corridors en hun bouwwerk-/boom-exclusies blijven overeenkomen**, anders ontstaan bomen op het pad of onzichtbare blokkades.

| ID | Boomtype/zone | Huidige vorm | Problematisch van dichtbij | Gerichte ingreep |
|---|---|---|---|---|
| T01 | **Naaldbomen Windhaven/Dennenhoek** | `pine()` → 3 `conifers`-geometrieën uit driehoekige bladvlakken + uniforme cilinderstam | Naalden ogen als brede linten/vlakken, stam mist bark/foot roots, uniforme kroon-top | **P0**: 2–3 realistische, geoptimaliseerde conifervarianten of verbeter eigen takmateriaal; PBR-bark en twig alpha, asymmetrische onderste takken |
| T02 | **Bloesemvallei** | `cherry()` met 9 ge-clusterde `bushGeo` en cilinderstam | Kroon is bollenstapel, boomvorm te identiek, weinig herkenbare vertakkingen | P1: 2 verschillende kronen (open/dicht), individuele bloesemtakken, knoestige dikke stam, lagere/hoogteverschillen |
| T03 | **Molenhoeve** | `appleTree()` met eenvoudige takken en bladkronen; appels worden scan | Appels zijn al verbeterd, maar boom zelf kan vlak blijven | P1: 2–3 organische stammen en herkenbare fruitboomkroon; **nieuwe CC0-appels niet opnieuw zoeken** |
| T04 | **Steengroeve** | Dezelfde naaldboom bij kale groeve | Te groen/identieke soort dicht bij stoffige kalkgrond | P1: lagere/schralere varianten, kale voet, enkele stamwortels; minder bomen waar kraan/stapelruimtes horen |
| T05 | **Valkenrots** | Dezelfde naaldbomen; bomen op helling | Grote rechte driehoeken kunnen in bergwand zweven; schaduw en collision | P1: smallere subalpiene sparren, loof-/windasymmetrie en basis op laagste footprintpunt |
| T06 | **Verre eilanden** | Herhaald `pine()`, soms 3 per eiland | Hier juist wél low-cost nodig | P2: oude bomen als LOD2 of billboard gebruiken; geen volledig 3D high-poly scan op grote afstand |
| T07 | **Algemene bosvloer** | Losse `Nature.grass`-instancing; weinig zichtbaar blad-/naaldstrooisel | Bosgrond en boomwortels missen samenhang | Bestaande grasinstancing behouden, voeg 2–3 patches voor naalden/blad, wortelopbouw en schaduw rond boomvoet |

## 3. Concrete gevonden externe bronnen — controle 22-11-2026

### Padtexturen (Poly Haven CC0, géén extra 3D-objecten)
| Prioriteit | Bron | Gebruik | Advies |
|---|---|---|---|
| **R01** | [Grey Stone Path](https://polyhaven.com/a/grey_stone_path) | Windhaven centrum, enkele pleinen | 1K diffuse + normal GL, geen 16K vereist; steenstrook in 3D langzaam uit laten dunnen in gras |
| **R02** | [Wood Chip Path](https://polyhaven.com/a/wood_chip_path) | Dennenhoek: houthakkersroute | CC0, 1K diffuse + normal; geen strakke rasterspoorbreedte |
| **R03** | [Grass Path 3](https://polyhaven.com/a/grass_path_3) | Bloesemvallei en zachte buitenpaden | CC0 1K met subtiele gras-/grindmenging |
| **R04** | [Gravel Road](https://polyhaven.com/a/gravel_road) | Molenhoeve en handelsweg | CC0 1K; karrensporen geometrisch/maskeren, niet als grote texture-stempel |
| **R05** | [Rocky Gravel](https://polyhaven.com/a/rocky_gravel) | Steengroeve en bergroutes | CC0 1K; straat niet vullen met grof grind waar spelers moeten lopen |
| Optioneel | [Forest Ground 04](https://polyhaven.com/a/forest_ground_04) / [Pine Roots](https://polyhaven.com/a/pine_roots) | Kleine looproute-/boomvoeten | **Geen nieuw 3D-roots model nodig** tenzij screenshot aantoonbaar tekortschiet; forest floor materiaal kan voldoende zijn |

**Niet downloaden als "glTF-modellen" voor paden:** dit zijn textures. Lever optimaal **1K diffuse JPG/PNG + 1K OpenGL-normal** en optioneel packed roughness/AO, niet een complete 16K PBR-omgeving.

### Bomen — eerst deze slimme selectie bekijken
| Bron | Wat weten we extern | Oordeel |
|---|---|---|
| **[Realistic Fir Trees Pack (LODs, gameready) — LOLIPOP](https://sketchfab.com/3d-models/realistic-fir-trees-pack-lods-gameready-f58e8b6d733e4b0586e5b7db847b89e7)** | Publicatie vermeldt 12.969 / 6.633 / **3.268** / 20 tris per grote boom. Sketchfab download gepubliceerd; directe paginacontrole/meegeleverde licentie vanuit deze omgeving niet mogelijk (403). | **Beste eerste A/B**, vooral 3.268-tris LOD als deze daadwerkelijk textuurdetails behoudt. Controleer licentie en downloadbestand; niet als CC BY bevestigd zonder `license.txt`. |
| **[Pine trees pack (lowpoly, game ready, LODs) — LOLIPOP](https://sketchfab.com/3d-models/pine-trees-pack-lowpoly-game-ready-lods-e1e9c07b8e2e445c943fec660beefba2)** | Gearchiveerde Sketchfab-beschrijving noemt CC BY, realistisch game-ready pakket met LODs. Exacte tris per variant niet betrouwbaar geverifieerd. | Tweede optie, **alleen als** visuele stijl natuurgetrouw is. Controleer license.txt en afzonderlijke meshes vóór import. |
| [Fir Tree 01 — Poly Haven](https://polyhaven.com/a/fir_tree_01) | CC0 maar **8 miljoen triangles** voor originele complexe 3-tree asset | **Niet downloaden voor de browsergame** (hooguit artistiek referentiebeeld); ook 1K texture verlaagt het aantal triangles niet. |
| [Pine Tree 01 — Poly Haven](https://polyhaven.com/a/pine_tree_01) | CC0 maar **17 miljoen triangles** originele scene | **Afwijzen** als realtime model. |
| [Fir Sapling — Poly Haven](https://polyhaven.com/a/fir_sapling) | CC0 maar **433 duizend triangles** | **Afwijzen** als herhaalde realtime boom; zelfde opgave van LOD/instancing. |
| [Low-Poly Cherry Blossom Tree Models — lsclarke](https://sketchfab.com/3d-models/low-poly-cherry-blossom-tree-3d-models-4b76fd63c81e4d489cc06ec66c12a866) | Sketchfab toont CC BY, maar de uitstraling wordt als low poly gepresenteerd | Niet blind kiezen — risico op méér cartoonstijl. Eerst echte preview/triangles. |

## 4. Implementatie-aanpak voor Claude (niet parallel world.js aanpassen)

**Sprint A — proef op Dennenhoek in dezelfde camera als gebruikersfoto**
1. Screenshot huidige bosroute en dennen op <5m / 10–20m afstand, in daglicht en schemer. Identieke instellingen na wijziging.
2. Pad wijzigen van `paving.jpg` naar bosgrond/wood-chip-mix; laat randen via opacity/vertexmask in werkelijk terrein overlopen, voeg detailstones/leaves/roots op de bodem toe.
3. Houd huidige `trail()` middellijn als autoritatieve route; visuele breedte versmallen **mag alleen als vrije loopzone/collision/keepOut blijft kloppen**. Laat paden niet zweven.
4. Maak minstens één nieuwe realistische boomvariant nabij Gerrit. Eerst **proceduraal verbeteren of één gecontroleerd LOD3-achtig model** gebruiken. Oude variant behouden als verre LOD. Behoud schaduw, wind, cameravermijding en collision.
5. Score screenshots op herkenbare schors, takken/needles, basis in grond, variatie, geen grote lege gaten of scherpe bladkegels.

**Sprint B — materiaal per regio**
- Windhaven steen en verweerde randen, Bloesemvallei lichte grind/gras, Molenhoeve aarde-karrensporen, Steengroeve kalk-/rotsgrind, Valkenrots berggrind.
- Max. 3–5 gedeelde 1K-textures, UV schaling op wereldmeters, anisotropie en texture caching.
- Houd alleen dorpspleinen stenig; geen uniforme strook dezelfde kasseien over elk zwevend eiland.

**Sprint C — boom/ecologie per regio**
- Dennenhoek: gemengd bos (2–3 spar-/den-silhouetten) met afwisselende hoogtes, lagere dode takken, boomstammen en varens.
- Bloesemvallei: losse, asymmetrische kersenbomen in 2 varianten, subtiele bloesem en schaduw.
- Molenhoeve: laagvertakte fruitbomen; appels en boomkronen qua schaal goed.
- Steengroeve/Valkenrots: minder volle bomen, grillige hoogtestand, rotsvoet en natuurlijke windvorm.
- LOD: dichtbij ca. 2k–5k tris per boom, middellange afstand 400–1.500 tris, verre horizon billboard/low mesh, nooit 8M/17M Poly Haven bronmesh bij tientallen bomen. Materialen 512–1K, draw calls met instancing en gedeelde atlas beperken.

**Regressiechecks**
- NPC-voorpaden moeten na huisvervanging bij de correcte ingang uitkomen, inclusief Gerrit als architectuur in PR #9 wijzigt.
- Level 4 bouwplots (`housePlots`) niet blokkeren; `nearTrail/nearPaving` en `solids` overeen laten komen met nieuw pad en boomfootprint.
- Brugtriggers, paden bij bosrand en aanloop op eilandhoofden blijven vrij.
- Boomcolliders: stam voelt solide, maar we lopen niet tegen een onzichtbare kroonwand; geen hout-harvest-node verwijderen.
- Gras, bloemen, afstandsculling, wind en schaduwen behouden.
- Test de camera achter Niek/Floor voor occlusion door bomen; geen scheve boomwortels boven hoofden.
- Bewaarde saves en vaste seedposities moeten consistent blijven, geen onzichtbare padobstakels.
- Desktop én mobiel: FPS/frametime/overdraw/triangles/drawcalls vastleggen, transparante bladmaterialen niet laten overdrijven.

## 5. Downloadbesluit en afhankelijkheid

**Nu niets downloaden voor bomen**, ondanks de game-ready Sketchfab-kandidaten. Eerst één goede proef bij de houtvesterij; alleen daarna een gecontroleerde glTF-download van het gekozen CC BY-pakket na licentiecontrole. Poly Haven high-poly bomen zijn strikt afgewezen.

**Texturen zijn laag risico maar evenmin nu besteld.** R01–R05 zijn concrete beschikbare CC0-texturen. Laat Claude eerst R02 (Dennenhoek), R01 (Windhaven) en eventueel R03 (Bloesemvallei) bij dezelfde camerastand vergelijken; één consistente 1K-texset volstaat.

**Claude's verantwoordelijkheid:** daadwerkelijke 3D-code, scene-afbeeldingen en QA op basis van de laatste huizenbranch. **ChatGPT:** deze aparte audit zonder `world.js`/`nature.js` te wijzigen of te mergen. Bepaal eerst afstemming met huizenaudit PR #9 en eventuele water-PR #8.
