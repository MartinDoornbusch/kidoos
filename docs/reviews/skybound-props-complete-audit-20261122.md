# StudyQuest / SKYBOUND — volledige audit van 3D-voorwerpen
**Datum:** 22 november 2026  
**Basis:** actuele `main` en `visuals-1.7`, commit `03a0d10a68a9a81d81e9ecc05e4445ad33ecf08b` bij aanvang.  
**Scope:** `src/world.js` (1.494 regels), `src/goods.js`, `scenery.js`, `nature.js`, `fauna.js`, `village.js`, `fx.js`, `game.js`, `src/models/` en `src/art/credits.txt`.  
**Reviewmethode:** code, assetregistratie en publieke modelpagina's; **geen live walkthrough / systematische screenshots**. "Waarschijnlijk te simpel" is een codegebaseerde kwaliteitsinschatting, niet een bewezen visueel defect. Exacte uiterlijk, clipping en zichtbaarheid in game moeten door Claude worden bevestigd.  
**Status:** alleen onderzoek en reviewdocument. Geen assets gedownload, geconverteerd, gekoppeld of gedeployed.  

## 0. Correcties en vastgesteld toepassingsplan voor 1.18.0 (gebruikersbericht 22 november 2026)

**Licentiecorrectie:** `Wooden Cart 01` van Nichgon heeft volgens de meegeleverde `license.txt` de licentie **Sketchfab Standard**, niet CC0/CC BY. Model **niet opnemen in openbare GitHub-repository**. Gebruik uitsluitend de **handkar uit `Medieval Market Asset Pack`** (CC BY) indien benodigd, met bronvermelding. De oorspronkelijke online bronmetadata kan niet in plaats van de meegestuurde licentietekst worden gebruikt.

**Smidsset:** Mike Farrant `Asset Pack — Blacksmith Equipment` is CC BY. Claude neemt **alleen aambeeld, hamer, tang en slijpsteen** uit de set over, niet de volledige omgeving.

**Gekozen voor versie 1.18.0** (nog geen bevestiging dat assets werkelijk in de runtime geïntegreerd zijn):
- Smederij Mara: vier smidsgereedschappen uit de set hierboven.
- Tomas, Anke, Wies: terracotta potten met kruiden — Poly Haven `planter_pot_clay`, **glTF 1K**, CC0.
- Linde en landhuis; later ook meubels in level 4: `wooden_bookshelf_worn`, **glTF 1K**, CC0.
- Anke: `brass_pot_01`, **glTF 1K**, CC0.
- Boomgaard/handel: `food_apple_01`, **glTF 1K**, CC0. Voor herhaling terugbrengen tot enkele honderden triangles.
- Observatorium: **KRei Armillary sphere** uit Sketchfab, glTF, CC BY volgens modelvermelding; **19.800 triangles → doel onder 8.000**.

**Bronnen voor handmatige of gescripte download**:
1. https://polyhaven.com/a/planter_pot_clay
2. https://polyhaven.com/a/wooden_bookshelf_worn
3. https://polyhaven.com/a/brass_pot_01
4. https://polyhaven.com/a/food_apple_01
5. https://sketchfab.com/3d-models/armillary-sphere-534e240ac6b0412cb526dd2b14bf8909

Poly Haven's officiële API `https://api.polyhaven.com/files/<asset-id>` bevat de glTF-1K-URL en de bijbehorende `include`-afhankelijkheden voor bin/textures. **Alle dependencies moeten in dezelfde relative directorystructuur mee in een ZIP**. Sketchfab-download vereist mogelijk inloggen en is niet via de publieke HTML-tekst opvraagbaar.

**Feitelijke beschikbaarheid:** ChatGPT heeft in deze werksessie wel bronpagina's geverifieerd, maar kon de glTF-binarydata **niet** downloaden (uitgaande netwerktoegang in de bestandsomgeving geblokkeerd). De modellen zijn daarom nog niet aan Claude geüpload; niet als gedownload of geïntegreerd aanmerken. De gebruiker kan de bestanden via de bronnen of een lokaal script ophalen en aan Claude toevoegen.

## TL;DR — wat moet eerst?

**P0 (zichtbare placeholder / direct verbeteren):**
1. Stenenkar in de Steengroeve — eigen bakken, toruswielen, een handvol stenen; vervang door echt houten karretje.
2. ‘Zonnewijzer’ bij het observatorium — in broncode een **armillarium** (sokkel + metalen ringen); vervang alleen indien 3D-beeld onvoldoende is.
3. Plantenbakjes en hangende kruiden in Tomas/Wies/Anke: meerdere `cone`/ `cyl`-vormen met effen materiaal.
4. Smederij van Mara: een blokvormig aambeeld, gereedschap en slijpsteen; meer geloofwaardig echt gereedschap.
5. Melkkannen, botervat en oven in de keuken van Anke: cilindervormen, blokken, een bolvlam.
6. Boekenrijen en boekenkasten bij Linde en in het landhuis: rechte `cube`-blokken, weinig echte rugdetails.

**P1:** fruitbomen met bolletjes, groenten als bolletjes, eenvoudige keuken-/winkelvoorraad, Joosts half afgemaakte beeld, karren en machines, tafelmeubilair dat niet altijd past bij zijn bedoelde functie.
**P2:** telescoop, armillarium, hooibalen, kaartkameraccessoires en overige zelden bekeken decoraties afhankelijk van camera-evaluatie.

Niet opnieuw vervangen: de reeds ingevoerde **`sf_*`-assets** en Poly Haven-scans (wandlantaarn, ramen, poort, haarden, huis, rugzakbestanden, brugplanken en -touw, ruïnemuur, steiger, ladder, tafels, tonnen, manden en emmers, stenen, kratten, kleding en dieren). Sommige bestaande objecten zijn goed, maar kunnen nog verkeerd geschaald of als verkeerde gebruikscategorie worden ingezet.

## 1. Volledige code-inventaris — **buiten**

| ID | Prioriteit | Locatie / bewijscode | Huidige invulling | Wat er nog niet klopt / te onderzoeken | Gerichte oplossing |
|---|---|---|---|---|---|
| E01 | **P0** | Steengroeve, `world.js:917–934`; **(59.5,-76.5)** | `cube` als karbak, `wheel` (torus), 4 `stoneGeo`-stenen | Lijkt niet op een zwaar transportmiddel voor steen | Eén realistische 2- of 4-wielige houten kar (zie R01/R02), losse stenen met bestaande scans; pas collision aan |
| E02 | **P0** | Observatorium, `world.js:1003–1025`; **(-12,-115)** | Sokkel, 4 `wheel`-ringen, cilinder en bol | Door gebruiker ‘zonnewijzer’ genoemd; code bedoelt **armillarium**; ringtechniek oogt mogelijk speelgoedachtig | A/B met realistische historische armillarium (R03), of betere PBR-brons en engraved details op bestaande geometrie. Niet per se omzetten naar klassieke platte zonnewijzer |
| E03 | **P0** | Molenhoeve, `world.js:889–894` | Boomvruchten `shape(ball)`, moestuingroenten `shape(ball)` plus bladgeometrie | Van dichtbij ronde gekleurde kralen in plaats van herkenbare appels/groente | 2–3 fruit-/groentesilhouetten, scan-gebaseerd materiaal (R07), 200–500 tris/vrucht op afstand en instancing |
| E04 | P1 | Molenhoeve, `world.js:883–885,912–913` | Strohoop `LatheGeometry`, hooibalen `CylinderGeometry` | Strohoop/rollen kunnen te glad en rond ogen; kleine variatie | Verweerde strotextuur/normal + eenvoudige bundelvormen; niet direct tientallen hoge-poly hooi-assets |
| E05 | P1 | Steengroeve, `world.js:919–928` | Kraanpalen met `beam`/`cyl`, hijsblok als `masonry`-box; kunstmatige steenbanken | Constructie kan mechanisch te primitief lijken ondanks materiaaltexture | Verbeter draaipunt, metalen katrollen en hijshaak met bestaande mesh/materialen; aparte model alleen als dat meerwaarde toont |
| E06 | P1 | Steengroeve, `world.js:930–931` | Uniform gestapelde `masonry`-blokken | Kunstmatig identieke stenen; geheel te recht en regelmatig | Bestaande gescande steenvarianten in drie maten, materiaal-/rotatievariatie; behoud collision |
| E07 | P1 | Handelspost buiten, `world.js:349–353` | Kratten met `createGoods()` + meerdere `cyl`-tonnen | De tonnen buiten zijn nog proceduraal terwijl elders `wine_barrel.mdl` bestaat | **Hergebruik** bestaande `wine_barrel.mdl` en bijpassende krat; geen nieuw downloadverzoek |
| E08 | P1 | Handelspost / boerderij, `world.js:349,908`, `goods.js:75–82` | Appels/peren/kolen met lathe/sferische modellen in slattenkrat; boerderijmand met bolletjes | Betere dan kale bol, maar soms op schaal niet herkenbaar; veel losse meshes | Behoud functionele crate, verbeter fruitmaterialen en 2–3 organische silhouettes, hergebruik instanced model |
| E09 | P1 | Molenhoeve, `world.js:875–882` | Put met ringen/cilinders, prefab ladder nabij huis | Put heeft relatief veel detail, maar water, takel, emmer en rand kunnen vlak zijn | Behoud bestaande put, PBR-steen + bestaande `bucket.mdl`, mechanisme/reflectie lokaal aanpassen |
| E10 | P1 | Vakwerkhuizen buiten, `world.js:287–305,243–254` | Terrasbank en ton zijn scan wanneer beschikbaar; plantjes via eigen blad-/bloemgeometrie | Aantallen / schaal / licht en stijl variëren | Eerst screenshotcheck; realistische plantbak/terracotta (R04) als uitzonderingsprop; niet alle bloemen vervangen |
| E11 | P1 | Valkenrots, `world.js:939–958` | Klassiek rond bouwwerk met balusters, telescoopachtige buis van cilinders | Op zichzelf complexer, maar sommige metalen onderdelen ogen blokkerig | Controleer vooral verhoudingen telescoop en sokkel, niet de hele rotonde vervangen |
| E12 | P1 | Observatorium, `world.js:1015–1020` | Telescoop gemaakt uit cilinders, deur uit boxes | Astronomisch hero-object mist oculair, scherpstelknoppen en metaalpatina | Verbeter met goed gedeelde PBR-materialen en kleine vormdetails; externe astronomische 3D-asset alleen na performancecheck |
| E13 | P1 | Wegen, `world.js:391–411,563,747,914,934,968` | Vrijstaande lampen uit `column/crook/scroll` plus procedurele `lantern()` | Wandlampen gebruiken Kigha-scan; staande lampen nog niet, zichtbaar verschil | **Reeds apart onderzocht in PR #5:** compositie met aanwezige Kigha-lamp, geen nieuwe download |
| E14 | P2 | Bloem- en natuurdetails, `world.js:199–221` | Plantbladeren/struiken zelf uit `BufferGeometry` | Technisch geen standaardkegels meer; in close-up kan de flat leaf geometrie opvallen | Niet blind vervangen; kijk eerst naar close-up, alpha/normal/LOD |
| E15 | P2 | Wolken/eilanden/gras, `world.js:528–640,995–1001`; `nature.js` | Procedurele terrein-, gras- en wolkgeometrie | Onderdeel wereldstijl, geen individueel huisprop | Buiten deze propvervangbatch; apart omgevings-QA |
| E16 | P2 | Level-3 wachttoren, `world.js:739–869` | Deels procedurele geometrie, deels CC0/Sketchfab-model voor steiger/ladder | Fase- en collisionlogica is actief; historische geometrie hoeft niet als set opnieuw gedownload | Alleen kijken naar kapotte muur, stellingbouw, uitkijkpost en staphoogtes, bestaande assets verbeteren |
| E17 | **BEHOUDEN** | Bruggen, `world.js:1059–1097` | `sf_plank_*` en `sf_rope` gekoppeld aan variabele bruggeometrie | Reeds goedgekeurd en geïntegreerd | Niet opnieuw Sketchfab zoeken |
| E18 | **BEHOUDEN** | Interactieve markers, `world.js:1413,1422` | Gouden ringen/markers | Bewust visuele game-feedback i.p.v. fysiek object | Niet verwarren met ongewenste placeholders |

## 2. Volledige code-inventaris — **binnen**

De acht genoemde woon-/werkhuizen zijn echte kamers in `world.js:1132–1331`. Meerdere tafels en tonnen zijn al scans, maar de losse props blijven vaak eigen geometrie.

| ID | Prioriteit | Kamer / bewijscode | Huidig object | Wat verbeteren | Kandidaat / route |
|---|---|---|---|---|---|
| I01 | **P0** | **Tomas, kruidenwinkel** `world.js:1227–1237` | Zaailingen `cyl + ball + cone`, hangkruiden `cone`, potjes `cyl`/blokjes | Direct herkenbare kegeltjes en bolletjes, precies gebruikersobservatie | R04 terracotta pot CC0 + lage-poly blad-/kruid-sprig; R10 keramiekset als alternatief |
| I02 | **P0** | **Anke, boerderijkeuken** `world.js:1251–1260` | Hangkruiden `cone`, botervat `cyl`, melkkannen `cyl`, bakoven `masonry/cube` en `ball`-vlam | Keukenartikelen zijn te geometrisch en onnatuurlijk egaal | R04/R05 voor aardewerk/pannen, eventueel R06 marktrekwisieten, handgemaakte melkbus-silhouetten; bestaande haard niet opnieuw downloaden |
| I03 | **P0** | **Mara, smederij** `world.js:1208–1225` | Aambeeld `cube + cone` op stronk; staande gereedschappen, slijpsteen en onderdelen `cube/cyl/wheel` | Hero-objecten van de smid voelen als placeholders | R08 25-delige smederijset, **alleen** passend aambeeld/tang/hamer/slijpsteen importeren |
| I04 | **P0** | **Linde, kaartenhuis** `world.js:1164–1182` | Boekenkast met `cube` boeken, bolglobe `ball`, kaartrolletjes `cyl` | Boekenrij lijkt gekleurde blokken; klok-/kompasdetails beperkt | R09 versleten houten boekenkast (10k → 2–4k), kleine eigen boekenatlassen; originele R11-boekenset 113k te zwaar |
| I05 | **P0** | **Landhuis** `world.js:1295–1318` | Geometrische fauteuils, klok met `cyl`, boekenwanden als blokjes | Een belangrijke bezoeklocatie verdient rijkere, samenhangende inrichting | R09 kast; andere fauteuils via beschikbare Poly Haven-chair afhankelijk stijl; herbruikbare boekrugmaterialen |
| I06 | P1 | **Joost, steenhouwer** `world.js:1262–1271` | Halfgemaakte sculptuur met `cyl+ball`, slijpsteen met `cyl`, beitels met cubes | Op eerste gezicht een cilinder met bol-hoofd, niet een herkenbaar beeld-in-wording | Bestaand `statue.mdl` alleen als onbewerkt bewijs? Maak beschadigde 3D-variant; laag-poly stenen borstbeeld en echte beitels |
| I07 | P1 | **Bram, timmerman** `world.js:1184–1207` | Vlakke dozen voor schaaf, zaag, handgereedschap, stoel in opbouw en zaagsel | Werkplaats lijkt een collectie blokjes | Gebruik bestaande `axe.mdl`, `spade.mdl` waar juist, voeg realistische handzaag/schaafklem als kleine modellen toe, geen groot assetpack nodig |
| I08 | P1 | **Wies, handelszaak** `world.js:1272–1293` | Kruiden = `cone`; weegschaal = `cyl/cube`; `goods` potjes/voedsel/schappen | Vooral herhaalde symmetrische objecten, soms te netjes | R06 marktrekwisieten; R10 aardewerk; herbruikbare materialen, afwisseling, potjes labelen |
| I09 | P1 | **Gerrit, houtvester** `world.js:1239–1250` | Bijlen/mes op werktafel als balkjes/cubes, bed/stoel uit beams; vuur `ball` | Haard is al echte `sf_fireplace.mdl`, maar rest van de kamer is er visueel niet op niveau | Laat haard staan; verbeter alleen gereedschappen, stoel, deken en vlammeshes |
| I10 | P1 | **Gemeenschappelijke kamerinrichting** `world.js:1155–1163` | `long_table.mdl` voor bijna elke tafel; ton `wine_barrel.mdl`; tafelkleden via `Plane` | Onrealistische vorm bij bepaalde tafelhoogtes of verkeerde proporties als wordt gestretcht | Bestaande `small_table`, `round_table`, `long_table` per functie gebruiken; passende verhoudingen |
| I11 | P1 | **Handelswaar in meerdere kamers** `goods.js:24–100` | Fruit via `LatheGeometry`, kool via `IcosahedronGeometry`; zakken, flessen, eieren, broden zelf gegenereerd | Niet allemaal kale bollen, maar geïdealiseerde vaste silhouetten en veel losse meshes | Verbeter waar dichtbij zichtbaar en herhaald; 1 scan-based PBR atlas voor voedsel in plaats van veel afzonderlijke downloads |
| I12 | P2 | **Kaarten, papier, open haardlicht** `world.js:1105–1159` | Eigen CanvasTexture; eenvoudige vlammeshes | Vorm/schaal kan te repetitief zijn, maar functioneel al duidelijk | Alleen afwerking, geen assetdownload totdat screenshot bewijst dat het nodig is |

## 3. Concrete extern gevonden vervangers — **shortlist, niet automatisch goedgekeurd**

| Ref | Past bij | Bron | Bronstatus | Polygon- / licentiecheck | Actie |
|---|---|---|---|---|---|
| **R01 — AFGEWEZEN** | E01 | [Wooden Cart 01 — Nichgon](https://sketchfab.com/3d-models/wooden-cart-01-07a97f4ecf994f579ac4ec70d74c561c) | Gebruiker/Claude heeft de **meegeleverde license.txt** gecontroleerd | **Sketchfab Standard — GEEN CC0/CC BY**. Niet toegestaan in de openbare assetrepository volgens het vastgestelde licentiebeleid. | **Niet downloaden of in openbare repo integreren.** Gebruik R02, de CC BY-handkar uit het Medieval Market Asset Pack, als karvervanger. |
| **R02** | E01, E07, I08 | [Medieval Market Asset Pack — vmatthew](https://sketchfab.com/3d-models/medieval-market-asset-pack-006ffc4ac5f34a1782f567b07e6605f2) | Gratis Sketchfab, CC BY 4.0 volgens pagina; bevat **handcart circa 2k tris**, kratten, marktdecoraties | Volledige set kan groot zijn; alleen 1 kar + relevante props exporteren | Praktisch alternatief als R01 niet voldoet |
| **R03** | E02 | [Armillary sphere — KRei](https://sketchfab.com/3d-models/armillary-sphere-534e240ac6b0412cb526dd2b14bf8909) | Sketchfab, download + CC BY | Triangles / materiaaldetails **nog niet geverifieerd** | Eerst preview versus huidige armillarium; geen verkeerde gewone zonnewijzer bestellen |
| **R04** | I01, I02, E10 | [Planter Pot Clay — Poly Haven](https://polyhaven.com/a/planter_pot_clay) | **CC0, glTF, 3k tris** | Direct binnen maximaal herhaald-prop-budget, maar 1–2 materialen en 512–1k atlas checken | **Sterke laag-risico kandidaat** voor terracotta pot. Voeg eigen goede kruidenmesh toe |
| **R05** | I02, I08 | [Brass Pot 01 — Poly Haven](https://polyhaven.com/a/brass_pot_01) | **CC0, glTF, 4k tris** | Geschikt als opvallende pan in keuken/handel, voor veel herhalingen reduceren tot 1–2k | Eén hero-pan in Anke's keuken |
| **R06** | E07/E08, I08 | [Medieval Market Asset Pack — vmatthew](https://sketchfab.com/3d-models/medieval-market-asset-pack-006ffc4ac5f34a1782f567b07e6605f2) | CC BY, handcart + overige gestileerde/realistische marktitems | Alleen onderdelen die zichtbaar beter zijn; voorkomen extra atlas/draw calls | Vergelijk krat, handelswaar, weegschaal, pan |
| **R07** | E03, E08, I11 | [Food Apple 01 — Poly Haven](https://polyhaven.com/a/food_apple_01) | **CC0, glTF, 7k tris** | **Niet** als één model per appel gebruiken! Kies één bron, bak textuur op low-poly 200–500 tris; instancing | Test in boomgaard + één toonbankkrat |
| **R08** | I03, I06, I07 | [Asset Pack — Blacksmith Equipment — Mike Farrant](https://sketchfab.com/3d-models/asset-pack-blacksmith-equipment-0f358eaab21d4e70836ad855de34c423) | Sketchfab **CC BY**, **25 afzonderlijke props** (aambeeld, blaasbalg, slijpsteen, hamers, tang, oven, werkbank, bakken) | Totaaltris in viewer meten; de 1k–2k PBR-texturen per item moeten worden teruggebracht | **Hoogste potentie voor smederij**, alleen 3–5 benodigde voorwerpen importeren |
| **R09** | I04, I05 | [Wooden Bookshelf Worn — Poly Haven](https://polyhaven.com/a/wooden_bookshelf_worn) | **CC0, glTF, 10k tris** | Hero-kast: mik op 2–4k tris, 1k texture; boeken zelf lichte atlas | Test bij Linde en in landhuis; **niet** de veel te zware originele boekenpack gebruiken |
| **R10** | I01, I02, I08 | [Medieval Market / Clay Pots — Neslihan Çakmak](https://sketchfab.com/3d-models/medieval-market-clay-pots-c1bef96983eb478b9b0c2f9bdc55860d) | Sketchfab CC BY; keramiekcollectie | Totaal- en per-pot tris nog onbekend; kijk naar glazuur en schaal | Vergelijk met R04; kies één set, geen overlappende modellen |
| **R11** | I04/I05 | [Old Books — Darren McNerney 3D](https://sketchfab.com/3d-models/old-books-8de3fdf167cc44d8bdd078fdfbc289c5) | Sketchfab CC BY | Triangle count / texturekwaliteit nog controleren | Alleen als lichte boekruggen op atlas onvoldoende resultaat geven |
| **R12** | I04, I05 | [Wooden Candlestick — Poly Haven](https://polyhaven.com/a/wooden_candlestick) | **CC0, glTF, 3k tris** | Goed voor 1–2 belangrijke tafels, niet voor tientallen kandelaars | A/B met bestaande `cyl` kaars + `ball` vlam |

### Belangrijke afgewezen of voorwaardelijke assets
- Poly Haven **Decorative Book Set 01**: **113k tris**, geen glTF vanwege configurabele shader — **afwijzen voor browsergame**.
- Poly Haven **Potted Plant 02**: **70k tris**, 285 MB download in bronformaat — **niet als herhaalde huisplant**. Gebruik R04 + efficiënte plantgeometrie.
- Poly Haven **Food Apple 01**: 7k tris **per appel** is ongeschikt voor 50–100 stuks; uitsluitend als bron voor vereenvoudigde look.
- Poly Haven **Wooden Bowl 01**: 14k tris voor een kom, onnodig zwaar; gebruik eenvoudiger pot/kom of bak textuur.
- Grote commerciële marktscènes van 300k+ polygons zijn geen route naar de gewenste livegamekwaliteit.
- Pakken met veel effen flat-shaded vormen zijn geen verbetering, zelfs als ze 300 tris zijn.

## 4. Bestaande assets die expliciet **niet** opnieuw gezocht hoeven te worden

Bron `src/models/` en `src/art/credits.txt` (controle op code, niet altijd zichtbaar gebruik):
- **Skybound/SF**: `sf_house`, `sf_lantern`, `sf_window`, `sf_fireplace`, `sf_gate`, `sf_drywall`, `sf_plank_a/b/c/d`, `sf_rope`, `sf_scaf_log`, `sf_scaf_plank`, `sf_ladder`, `sf_backpack`.
- **Poly Haven**: `wine_barrel`, `bucket`, `bucket2`, `basket`, `crate`, `chest`, `firepit`, `long_table`, `small_table`, `round_table`, `settle`, `stool`, `picnic_table`, `watering_can`, `spade`, `statue`, `stone_a/b/c`, `stump`, `axe`, `crag_a/b`, `castle_door` en overige geregistreerde scans.
- **Personen/dieren**: Rocketbox (MIT); geen decoratieve primitive-people placeholders inventariseren als ze niet aanwezig zijn.
- **Terrein/bergen/vegetatie** is een aparte wereldschaal-QA; geen extra voorraad aan high-poly props aanvragen ter vervanging van hele landschapssystemen.
- **Doelbewuste spelindicatoren** (bijv. gouden windringen) niet als ongewenste bollen aanmerken.

Belangrijk auditpunt: `world.js:728` gebruikt `scanProp('long_table',...)` als **buitenbank** wanneer scans beschikbaar zijn. Controleer of de geometrie niet te lang/laag of met verkeerde vorm wordt getoond; vervang liever met bestaand `settle` of een echt bankmodel dan een nieuw Sketchfab-object.

## 5. Review- en implementatievolgorde voor Claude

### Sprint A — in het zicht van de speler (P0)
- **A1 — Stenenkar:** screenshot huidig versus R01/R02, dezelfde positie; materiaal, korrekte schaal en botsing. Laad echte steenbrokken met bestaande `stone_a/b/c`. Geen extra scan voor steen nodig.
- **A2 — Botanische potjes:** Tomas, Anke en Wies doorlopen; vervang `cone`-plantjes en hangende kruiden door gedetailleerde maar goedkope plantjes; 1 herbruikbaar potmodel, 2–3 plantvarianten.
- **A3 — Mara:** aambeeld plus relevante tang/hamer/slijpsteen in dezelfde belichting; behouden werkbench en bestaande fase-/NPC-routes.
- **A4 — Kaartenhuis en landhuis:** boekruggen met atlas, kasten en stoelvormen; let op loopruimte en cameracollision.
- **A5 — Armillarium:** screenshot huidige versus R03; hoeft niet vervangen als verbeterde metalen/steenmaterialen al volstaan.

### Sprint B — aankleding/voedsel (P1)
- **B1 — Keuken:** churn, melkbussen, oven, potten, hangkruiden.
- **B2 — Handel:** variatie in kruikjes, marktwaren, weegschaal en kisten; `goods.js` onderbouwd simpeler maken, niet in één keer alles verwijderen.
- **B3 — Erf en boomgaard:** appels/groenten die daadwerkelijk op een vrucht lijken, geen identieke bolletjes; instancing/LOD.
- **B4 — Joost en Bram:** herbruikbare beitel-, zaag-, hout- en sculptuursets.

### Sprint C — alleen indien detailopnamen tekortschieten (P2)
- Telescoop, bovenbouw sterrenbaken, hooibalen, putmechaniek, tuinplanten, buitenbanken en variatie in steenstapels.

## 6. Verplichte acceptatiecriteria

**Bij elk zichtbaar vervangen object:**
1. Eén tabelregel is gekoppeld aan **een echte plek/mesh in de game** (niet alleen naam van Sketchfab).
2. Maak A/B afbeelding onder identieke camera/zonstand met het **huidige** en het nieuwe object; link naar beeldmateriaal bij review.
3. Object is niet te cartoonachtig, niet scheef, niet zwevend en niet door een andere mesh heen geplaatst.
4. Fysieke grootte en schaal zijn geloofwaardig, vooral naast kinderen en volwassenen.
5. Geen onzichtbare collision of geblokkeerde looproutes/NPC-stations; deuren blijven open/dicht werken.
6. Bestaande interactieve items blijven interactief; projectvoortgang en oude savebestanden behouden.
7. Voor ieder model: bron-URL, auteur, licentie, eventuele attribution, bron- en doeltris, texturegroottes, drawcalls en render-FPS op mobiele device.
8. **Norm:** herhaalde props max. 300–3.000 tris, 1K texture; hero-object max. 15.000. Bij appels liefst 200–500 tris per instanced vrucht. Niet blind een 7k scan × 100 kopiëren.
9. Eén nieuw voorwerp kan **meerdere plekken** oplossen; voorkom 1 download per instantie of onnodige duplicaten.
10. Alleen CC0 of correcte CC BY voor publiek repo; Sketchfab-license en downloadbaarheidscontrole alsnog in een echte sessie bevestigen.
11. Eerst proef in gescheiden review-/ontwikkelbranch, **geen automatische productie-deploy**.

## 7. Voorstel minimale downloadbatch na A/B-review

**Eerste downloadadvies (pas na Claude's visuele en licentiecontrole):**
- **Alleen R02**, de handkar uit het **Medieval Market Asset Pack** (CC BY), na verificatie van polygonen, daadwerkelijke bronbestanden en attributie. **R01 is uitgesloten wegens Sketchfab Standard**.
- **R04** Poly Haven terracotta pot (CC0, 3k).
- **R08** Blacksmith Equipment Pack (CC BY) als per-model reduceren kan.

**Tweede golf, niet nu:** R03 armillarium, R09 boekenkast en R05 brass pot, alleen indien gerichte screenshotvergelijking wint.

## 8. Openstaande onzekerheden
- De door gebruiker genoemde ‘zonnewijzer’ is **waarschijnlijk** het armillarium bij (-12,-115), maar zonder screenshot niet definitief bewezen. De app heeft ook een metalen kompasroos rond het baken (`world.js:1054–1057`).
- Geen in-browser screenshot/FPS van elk van de acht kamers uitgevoerd; conclusies zijn **code- en metadata-inschattingen**.
- Sketchfab blokkeerde directe publieke HTML/API-toegang in deze onderzoekssessie, waardoor sommige bronpolygonen en CC0/CC BY-notatie later door Claude in een ingelogde browser moeten worden bevestigd.
- `src/models/` inventaris is geverifieerd, maar aanwezigheid van een `.mdl`-bestand betekent niet automatisch dat het actief wordt getekend.
- De gebruiker heeft de **tevy Canvas Backpack with Bedroll (LOD1)** eerder gekozen. In de onderzochte code bestaat een `sf_backpack.mdl`; geen nieuwe rugzak in deze propbatch nodig.

**Te gebruiken door Claude als uitvoeringschecklist, niet als onherroepelijke aankoop- of downloadlijst.**
