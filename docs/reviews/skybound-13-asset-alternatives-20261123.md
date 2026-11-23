# SKYBOUND — aanvullende assetkeuzes voor de 13 visuele bevindingen
**Datum:** 23 november 2026  
**Basis:** door gebruiker aangeleverde lijst van 13 tekortkomingen en eerder onderzochte vervangalternatieven; GitHub `main` commit `b5573b0dbe5292291f122d665a8862217965b4b1`, inclusief assetcredits t/m 1.22.0.  
**Soort PR:** *uitsluitend een aanvullend sourcing-/keuzedocument*, géén vervanging of herschrijving van eerdere PR #1–#17. **Geen wijzigingen aan spelcode, modellen, credits of deployment.** Claude is verantwoordelijk voor daadwerkelijke implementatie.

## Wat de actuele repository al bevat — niet opnieuw downloaden
- `sf_airship.mdl` (Vintage Airship, Evan16) en `sf_lighthouse.mdl` (Fabio), ingevoerd vanaf 1.19.0.
- 1.19.0-sparren in LOD-niveaus, vijf regionale padmaterialen en een eigen vloertextuurronde.
- `castle_wall_slates`, `clay_roof_tiles_02`, verbeterde kersen- en appelbomen (1.21–1.21.1).
- 1.22.0 verbeterde beekbedding, molens, huisdetails, NPC-haar/kleding en enkele props.
- `sf_window`, gescande appels, boeken, smederijvoorwerpen, overige reeds geregistreerde 3D-onderdelen.

**Werkwijze:** De 13 observaties hieronder zijn concrete *visuele testgevallen* en nieuwe, verifieerbare bronkeuzes. Voor architectuur/terrein/water/bomen, interieurs, airship en kabelbaan gelden de bestaande werkstromen als eigenaar; niet een tweede implementatiebranch maken die parallel `src/world.js` wijzigt. De nieuwe waarde van **deze** PR zit in **gefilterde downloadalternatieven + specifieke testcondities en integratiebesluiten**.

## A. Matrix per bevinding

| Prio | Item | Gericht alternatief, bronlinks | Nu kiezen / instructie voor Claude | Aansluiting |
|---|---|---|---|---|
| **1** | Onderkant eilanden: grove bruine facetten, rots oogt als houtnerf | [Rock Face 02](https://polyhaven.com/a/rock_face_02) — Poly Haven CC0, circa **30k triangles** als bronreferentie; [Mossy Rock](https://polyhaven.com/a/mossy_rock) — CC0 textuur | **P0:** maak een doorlopende, gelaagde klifmesh en neem uit het bronmodel hooguit vereenvoudigde richels. Gebruik niet-uitrekkende triplanar/wereldgeschaalde diffuse + normal en lokaal mos. Controleer van onderaf én schuin zijaanzicht. Geen 30k-tris **per** klifsegment | Terrein / eerder #16 |
| **2** | Eilandranden: gras eindigt hard, geen overhang | [Rock Moss Set 01](https://polyhaven.com/a/rock_moss_set_01) — Poly Haven CC0, zes verweerde stenen; [Coastal Cliff 01](https://polyhaven.com/a/coastal_cliff_01) — alleen vormreferentie, hoog detail | **P0:** rotsige onregelmatige rand onder gras, plaatselijke overhang, grove graspluimen en kleurblend van grond naar steen. Kleine LOD-rotsvarianten instancen, niet het originele zware pack herhalen. De volledige kustlijn controleren | Terrein / eerder #16 |
| **3** | Grond/gras: vlak en herhaald, lege Bloesemvallei en Sterrenwacht | [Grass pack — LOLIPOP](https://sketchfab.com/3d-models/grass-pack-lowpoly-game-ready-422f42f618d342c6958b02613dc57403), Sketchfab publiek als CC BY vermeld (ZIP controleren); [Sparse Grass](https://polyhaven.com/a/sparse_grass) — Poly Haven CC0 textuur | **P1:** vergelijk LOLIPOP met bestaande `Nature.grass` instancing. Kies de laagste realistische LOD, gevarieerde dichtheid en subtiele bloeivelden. Niet uniform overal méér gras; paden, bouwkavels en NPC-ingangen vrijhouden | Grond / eerder #10/#16 |
| **4** | Metselwerk: `masonry.jpg` 203×290 uitgerekt | [Stone Block Wall](https://polyhaven.com/a/stone_block_wall) en [Castle Wall Variation](https://polyhaven.com/a/castle_wall_varriation), Poly Haven CC0 | **P0:** gebruik bestaande `wallslate_diff/nor`/1K `castle_wall_slates` waar goed; alleen als verschil in screenshot aantoonbaar beter is nieuw 1K/normal GL. UV’s per wereldmeter, vooral ronde observatoriumtrommel, groeveblokken, plinten, Joosts muren. Niet blind vervangen op reeds gecorrigeerde gebouwen | Materialen / bestaand #6/#9 |
| **5** | Negen uniforme kamers, Gerrits bed rood blok, sacks als bollen | [Painted Wooden Table](https://polyhaven.com/a/painted_wooden_table), [Painted Wooden Chair 02](https://polyhaven.com/a/painted_wooden_chair_02), [Gothic Bed 01](https://polyhaven.com/a/GothicBed_01) — Poly Haven CC0; [Old Burlap Bag Photo Scan](https://sketchfab.com/3d-models/old-burlap-bag-photo-scan-d52b9c947f994d528e872f71a1cabba1), Sketchfab CC BY (ZIP controleren) | **P1:** per bewoner uniek kleur-/meubelprofiel en max. **3–5 passende hero-meubels**, niet negen willekeurige cataloguskamers. **Gerrit** krijgt een passend eenvoudig houten bed, níet het gotische bed. **Anke/Tomas** krijgen echte jutezakken, geen ronde vormen. Variatie in wand, vloer en tapijt; bestaande kamertriggers/loopruimte behouden. Poly Haven GothicBed past eerder bij Van Dalen, alleen als mobiel budget klopt | Binnen / bestaand #6/#17 |
| **6** | Waterval bij Dennenhoek: drie losse panelen | Geen nieuwe waterfall-3D-scan. [Rock Face 02](https://polyhaven.com/a/rock_face_02) alleen als referentie voor natte ondergrond | **P0:** één goed gevormde, doorlopende waterschil met zachte boven-/zijkant en schuimcontact aan de richel. Compatibel met bestaande stroming, poel, spray, transparantie-order en performance. Van camera-stand bij Gerrit testen | Water / bestaand #8 |
| **7** | Hooiberg: glad ei met twee touwen | [Haystack 1 — Frice](https://sketchfab.com/3d-models/haystack-1-a1bbf38e91b74b08aba7851a00917843), Sketchfab CC BY vermeld (ZIP controleren); [Thatch Roof Angled](https://polyhaven.com/a/thatch_roof_angled), Poly Haven CC0 textuur | **P1:** eerst 1 gelicentieerde lichte hooiberg A/B in Molenhoeve. Geen scan/CC0-bewering zonder controle. Indien te gestileerd: lathe-vorm ongelijk maken + stro-slierten aan randen; touwen horen fysiek in stro te drukken. Collision en erfpad bewaren | Nieuwe doelasset / props #6 |
| **8** | Akkers: bruine dozen, kolen in raster | [Farm Furrows](https://polyhaven.com/a/farm_furrows), Poly Haven CC0 grondtexture; [Farm Plants models — LOLIPOP](https://sketchfab.com/3d-models/farm-plants-models-mobile-game-ready-lowpoly-9b59e7cf3bcd4feb80ff0cf5fb780055), Sketchfab CC BY vermelding (ZIP controleren) | **P1:** kleine, **echte** grondruggen met herhaling op meterschaal; 2–3 plantenstadia, willekeurige rotatie/maat en wat lege plekken, zonder te veel collider/polygons. Kijk of het plantenpack werkelijk kolen en passende gewassen heeft voordat je importeert | Nieuwe akkerdetails / props #6 |
| **9** | Appel-/kersenbomen in overzicht zijn felle parasols | **Bestaande bomen** in `world.js`; geen nieuw boomasset | **P1:** volume in bladclusters, minder verzadiging/platheid aan zijkant, LOD-blend; vergelijk dezelfde fruit-/bloesemboom op 5, 20 en 45 meter afstand. Behoud appel-meshes en LOD-sparren | Bomen / bestaand #10 |
| **10** | Windhaven-berg: stapel losse stenen | [Rock Face 01](https://polyhaven.com/a/rock_face_01), Poly Haven CC0 (circa 20k triangles bron) en [Rock Face](https://polyhaven.com/a/rock_face), CC0 texture | **P0:** dezelfde doorlopende klifmaterialen/aanpak als punt 1 gebruiken, niet een tweede aparte berggenerator zonder samenhang. Rotsblokken alleen voor zichtbare accenten, niet als complete berg. Screenshot vanaf hoofdstraat én brug | Terrein / eerder #16 |
| **11** | Gele vlakke ramen bij Joost/groeve | Reeds aanwezig: `sf_window.mdl`, eigen `windowAt()` / roeden/kozijnen | **P1:** ramen uit vakwerkhuizen correct inpassen in de stenen woningen, aparte diepten en kozijnonderkanten; controleer dubbele ramen en licht/oriëntatie. **Geen externe assetdownload** | Woningen / bestaand #9 |
| **12** | Luchtschip: huidige scan wit/zilver i.p.v. intro koperkleurig | `sf_airship.mdl` **is al in repo**; [Vintage Airship — Evan16](https://sketchfab.com/3d-models/vintage-airship-23c78c2e28934d1491ff216a3eabf982) is al de licentiebron | **P1:** test PBR-albedo/tint van envelop, warme stof/koper, houten gondel met messing zonder ongewenste metalen overglans; bestaande mesh, verlichting, rotorpropellers en vliegroute behouden. **Niet opnieuw hetzelfde model downloaden** | Zeppelin / bestaand #12 |
| **13** | Kabelbaangondel: vakwerkhuis zonder ramen | Bestaande `gondola` in `world.js` plus `sf_window` waar passend | **P1:** realistische instapzijde (open, leuning/deur), vensterramen, dak en kabelophanging. Test dat avatar de gondel niet doorkruist en dat rit/camera blijven werken. **Geen nieuw extern pakket** | Kabelbaan / bestaand #13 |

## B. Concrete downloads (alleen als A/B aantoonbare winst geeft)

**Prioriteit A — meeste visuele winst, maximaal vier bronnen in eerste testbatch:**
1. **Rock Face 02** — https://polyhaven.com/a/rock_face_02 — CC0 3D, `glTF 1K`; eerst geometrie vereenvoudigen en alleen een referentie/fragment voor klifstructuur.
2. **Rock Moss Set 01** — https://polyhaven.com/a/rock_moss_set_01 — CC0 3D, `glTF 1K`, selectief 2–3 stenen en LOD.
3. **Stone Block Wall** — https://polyhaven.com/a/stone_block_wall — CC0 1K diffuse + **Normal (GL)**, alleen als bestaande wallslate bij Joost/observatorium niet voldoet.
4. **Farm Furrows** — https://polyhaven.com/a/farm_furrows — CC0 1K diffuse + normal/displacement als bron voor akkerbed.

**Prioriteit B — optioneel na screenshotvergelijking:**
5. **Grass Pack** — https://sketchfab.com/3d-models/grass-pack-lowpoly-game-ready-422f42f618d342c6958b02613dc57403 — CC BY volgens publiek resultaat; licentie uit download onmisbaar.
6. **Haystack 1** — https://sketchfab.com/3d-models/haystack-1-a1bbf38e91b74b08aba7851a00917843 — CC BY volgens publiek resultaat; licentie uit download onmisbaar.
7. **Old Burlap Bag Photo Scan** — https://sketchfab.com/3d-models/old-burlap-bag-photo-scan-d52b9c947f994d528e872f71a1cabba1 — CC BY volgens publiek resultaat; origineel kan erg zwaar zijn, retopo/texture baking.
8. **Painted Wooden Table** — https://polyhaven.com/a/painted_wooden_table — CC0 3D, voor Anke/Gerrit; eerst bestaande tafels vergelijken.

**Niet op de initiële downloadlijst:** de al aanwezige `sf_airship`, `sf_window`, sparren, appels, `sf_lighthouse` en reeds aanwezige 1K-paden en stenenmaterialen.

### Validatiestatus links en licenties
- **Poly Haven-pagina's:** asset-URL's gecontroleerd via publieke zoek- en productpagina's; Poly Haven stelt zijn assets beschikbaar als CC0. Modelresolutie 1K verlaagt *texturekosten*, maar niet automatisch het bronpolygoonaantal; geometry eerst reduceren en LOD toepassen.
- **Sketchfab-pagina's:** publiek geïndexeerd als CC BY voor Grass Pack, Haystack 1 en Old Burlap Bag; **originele download-ZIP en license.txt zijn vanuit deze audit niet geopend**. Geen uit die bronnen gedownloade modellen als definitief goedgekeurd beschouwen. Auteurs, directe bron-URL, licentie, wijzigingen en eventuele texture-atlas in `src/art/credits.txt` vastleggen.
- **Prestaties:** hero-rock 2–5k tris na reductie als richtwaarde, dichte setstenen lager. In plaats van 100 rotsmeshes: instancing/material sharing. Grootschalige rotswanden liever eigen mesh met de materiaalkaarten uit het voorbeeld. 1K voor bodems, 1K–2K voor zeldzaam hero-detail alleen na meting.

## C. Test- en acceptatiecriteria voor Claude

1. **Referentiebeelden:** voor/na in *dezelfde camerahoek en belichting* voor Dennenhoek aan de voet/onderzijde; eilandrand en Windhaven-berg; bloesemvallei/sterrenwacht overzicht; Joost interieur; Gerrits slaapkamer; Anke/Tomas zakken; Dennenhoek-waterval; hooiberg, akker; appel-/kersenboom 5m/20m/45m; kabelbaangondel; zeppelin daglicht.
2. **Geometrie:** geen zwevende rotsranden, zichtbare herhaalstroken, uitgerekte normalmaps of transparante waterfalls als drie losse platen. Behoud vaste `liftAt`, collider, brugaanlopen, rivierbedding, `nearPaving`/bouwplots.
3. **Interieurs:** behouden NPC-paden, deurtriggers, vloerniveaus en doorgangen. Meubels niet door elkaar; maximaal een beperkt aantal bruikbare gescande modellen per kamer.
4. **Voertuigen:** voor `sf_airship` dezelfde orbit, rotors, verlichting; voor kabelbaan dezelfde stationsroute, passagier/camera en instap.
5. **Schaal en performance:** screenshots én mobiele desktop-performance (fps, frametime, triangles/draw calls, alpha-overdraw). Geen nieuwe onnodige 20k/30k poly mesh op tientallen eilandranden.
6. **Integratie:** nieuw assetgebruik alleen met bijgewerkte credits/bronbestand/licentie; zorg dat wijziging met bestaande Claude-branches is afgestemd. Deze PR blijft docs-only.

## D. Afronding / besluit
Deze aanvullende keuzehulp is klaar wanneer **Claude per item A/B heeft besloten**: bestaand verbeterd, getest nieuwe asset geïmporteerd, of bewust afgewezen. Geen van de 13 hier genoemde ingrepen wordt door dit document als *reeds voltooid* gepresenteerd. Nieuwe PR's voor overlappende huis/water/wolken/bomen-code zijn **niet** nodig; implementeer in de door Claude beheerde werkstroom.
