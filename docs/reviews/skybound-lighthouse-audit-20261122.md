# Skybound — kwaliteitsreview Sterrenbaken / vuurtoren
**Datum:** 22 november 2026 • **Basis:** actuele `main` 1.18.0, commit `46a370c5df5473f5247c45c8adf3775079347d03`.
**Status:** review only, geen download, wijziging van wereldcode, merge of deployment.

## 1. Identificatie
De vuurtoren is het **Sterrenbaken** op **Sterrenwacht**, `BX=0,BZ=-130` (`src/world.js` circa 1048–1082). Niet verwarren met de **herstelbare wachttorenruïne** op Dennenhoek (`RX=-54, RZ=-10.5`).

De huidige vuurtoren is een **procedureel opgebouwd** bouwwerk van ca. 14 m hoog met:
- `CylinderGeometry`-stenen torenschacht (taps), koperen banden en losse raampjes;
- radiale borstwering en galerij met reling;
- venster-/glazen lichtkamer, verdigris koepel, decoratief topornament;
- deur en trappen rond basis en stenige plaza met kompasroos;
- **lichtkristal** `core` en lichtbundels `beaconBeam` / `sweep` als afzonderlijke animatiegroepen.

**Gameplaycontract:**
- In `world.js:1592` wordt `beaconBeam.visible=sweep.visible=s.stage>=3`, `beaconLight.intensity` en `core.material.emissiveIntensity` op `s.stage` gezet.
- `world.js:1608` roteert `core` en `sweep`. Een andere tower mesh mag dit NIET overschrijven.
- Collider in `world.js:1051`: `solids.add({x:0,z:-130,r:2.8,base:0,top:14})`, plus de gehele ingang/voorruimte. Behoud of pas nauwkeurig aan bij modelwijziging.
- Er bestaat geen bewijs dat de toren nu een volledig betredbaar interieur heeft; **geen automatische claim** dat een vervanger instaptrappen toevoegt.
- Nabijgelegen observatorium op `(-12,-115)`, in 1.18 voorzien van KRei-armillarium, moet niet worden geraakt.
- De toren is één **hero asset**: meer details binnen een gematigd driehoeksbudget zijn hier mogelijk, anders dan bij herhaalde straatlantaarns.

## 2. Visueel defect / gewenste kwaliteitsstandaard

De eigen shaperoutines geven een afgeplatte / repetitieve stenen schacht, loodrecht geplaatste kleine prismatische ramen, een rondom identieke railing, koepel met glad materiaal en een eenvoudige platte voordeur. Aanbeveling:
- echte PBR-stone texture (al aanwezige `masonry`/weathered-stone liever hergebruiken), grout, stonenormal en subtiele beschadigingen;
- glas/metal kozijnen met frame-reliëf, interne lampkamer als zelfstandig helder volume;
- gezette steenplint en ingangsboog, doorlopende treden in plaats van zwevende rechthoekige treden;
- geloofwaardige koperpatina, metalen reling met echte bevestigingspunten en constructieve supports;
- lichtpunt/beam precies aansluiten op de bestaande enginegroepen;
- consistent met de nieuwe huizen + historische ruïne; **niet** het bestaande baken vervangen door rood-witte moderne kustvuurtoren of een roze cartoonhuis.

## 3. Externe downloadlinks voor A/B-modelreview (publieke modelpagina gecontroleerd)

| Model | Download | Bronmetadata | Beoordeling |
|---|---|---|---|
| **Lighthouse — Fabio** | https://sketchfab.com/3d-models/lighthouse-3b475508402e4fb98d65fad6489b875e | Sketchfab, **CC BY**, 11.200 triangles, download beschikbaar | Beste eerste **technische** kandidaat, maar kustvuurtoren/tijdperkvorm; afzetten tegen bestaande schil, niet blind vervangen |
| **lighthouse — Lora** | https://sketchfab.com/3d-models/lighthouse-dab98033118949728804bfc5f4076b8f | Sketchfab, **CC BY**, 13.400 triangles, download beschikbaar, Substance Painter/Maya/ZBrush | Visuele fallback, gepubliceerd als low poly; met 3D-preview eerst controleren of geen cartoonachtige downgrade |
| **The Lighthouse — cotman sam** | https://sketchfab.com/3d-models/the-lighthouse-1a85945dd2a840f594bf6cb003176a54 | Sketchfab, **CC BY**, 13.300 triangles, veel 512px textures, auteur vraagt hem bij gebruik te contacteren | Sfeervol maar uitdrukkelijk 'cutesy'/gestileerd, **niet** de eerste keuze voor realistische SKYBOUND |
| **Lighthouse-lantern — Standout 7** | https://sketchfab.com/3d-models/lighthouse-lantern-game-ready-asset-ff993c7d75a24930bd96409a3f032e85 | Sketchfab, **CC BY**, 5.900 triangles, game-ready | Alleen **de lichtkamer/het lantaarnonderdeel** vergelijken als schil behouden blijft; niet als volledige toren gebruiken |
| **Medieval Lighthouse — Matthias Degroote** | https://sketchfab.com/3d-models/medieval-lighthouse-22289216c50443be8ee605f6e9453226 | Visueel goed voor historische fantasystijl; **license/polygonen niet bevestigd**, directe Sketchfab-pagina 403 bij deze check | Alleen stijlinspiratie totdat werkelijke licentie/downloadbaarheidsbevestiging beschikbaar is |

**Expliciet afwijzen zonder verdere reductie**:
- An Old Lighthouse — Sam: 57.300 triangles, visueel mogelijk mooi maar veel zwaarder dan noodzakelijke hero asset.
- Lighthouse — dylanheyes: 157.900 triangles, veel te zwaar.
- Lighthouse 't Hoge Licht Westkapelle: 1.8M triangles **CC BY-NC**, past juridisch niet.
- Medal / medieval stone tower van Orpind: 161k triangles **CC BY-NC-ND**, verboden in openbare repo volgens projectbeleid.

**Licentie-waarschuwing:** Sketchfab-pagina vermelde CC BY is *voorlopig*; bekijk na inloggen en downloaden ook het echte `license.txt`. De eerder afgewezen `Wooden Cart 01` bleek immers in zijn ZIP een **Sketchfab Standard**-licentie te hebben, wat niet past bij het openbare assetgebruik in dit project. Geen nieuwe Sketchfab Standard-assets naar `main`.

## 4. Claude: gerichte test en integratie

**Voorstel — eerst bestaande toren upgraden:**
1. Screenshot huidige toren overdag, schemer en 's nachts, telkens vanaf dezelfde positie; met speler ernaast als schaalreferentie.
2. PBR-stenen, een echte ingang + kozijn, balustrade met bevestigingen, kleurpatina en afzonderlijke lichtkamer verbeteren. Hergebruik materiaal uit de ruïne / geïmporteerde huizen waar mogelijk.
3. Plaats **tijdelijk** de Fabio-toren naast huidige versie in een lokale A/B-preview. Alleen bij duidelijke kwaliteitswinst een compleet model gebruiken; anders hoogstens een lantaarn-/raam-/decoronderdeel uit de alternatieven.
4. Sla lichtkristal, `core`, `beaconBeam`, `sweep`, ronde stenen plaza en kompasroos niet plat in nieuwe GLTF-export. Laat ze **in de game** renderen en activeer op dezelfde levelstate.
5. Controleer de schaal (ca. 14 m), basepoint `(0,-130)`, torenradius en collider (ca. 2.8), nul onzichtbare hindernissen. Voordeur op bestaande zijde houden, observatorium/brugpad veilig.
6. Regressie voor `s.stage<3` (gedoofd baken) en `s.stage>=3` (licht aan), roterend kristal + twee lichtstralen. Controleer licht over meerdere camera-afstanden.
7. Performance: mik op **max. 10k–15k triangles** voor deze enige hero asset, texturen 1K–2K alleen als nodig, beperkte drawcalls; meet fps op een mobiel apparaat en desktop.
8. Voor/na in dezelfde renderer, geen screenshots uit Sketchfab als bewijs voor in-game kwaliteit.
9. Inbegrepen modelbron, creator, license.txt, attribution, triangles en texturebudget in `src/art/credits.txt`.
10. Voeg alleen samen op een integratiebranch uit actuele Claude-code; niet parallel de `world.js` van huis-, bomen- of waterbranches overschrijven.

## 5. Besluit
Geen ongericht 3D-pakket downloaden. **Eerst een screenshotreview van de bestaande Sterrenbakentoren en een lokale A/B met Fabio of Standout 7-lantern**. Pas na overtuigende kwaliteitswinst en geldige meegeleverde licentie de volledige glTF van één kandidaat opnemen.

**Niet uitgevoerd:** 3D-import, runtime-view, bestanddownload, broncodevervanging, merge, deployment.
