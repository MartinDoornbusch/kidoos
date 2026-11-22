# StudyQuest — zweefvlieger: broncode-audit en vervangkandidaten
**Datum:** 22 november 2026 • **Status:** alleen onderzoek; niets gedownload of in de game ingebouwd.  
**Basis:** `main` op 22 november 2026, `src/world.js`, `src/game.js` en `src/scenery.js`.

## 1. Wat zit er nu echt in de game?

- `src/world.js:1423–1425` maakt de huidige vleugel als `sail=group(0,2.55,0,hero.root)`. Links/rechts zijn elk een verschaalde `iso`-mesh van andere kleuren, met één `cube`-balk eronder. **Dit is een procedurele placeholder**, niet een echte textuurgedetailleerde deltalvlieger.
- `world.js:1458`: `sail.visible=!start&&!!p.glide`; de zichtbaarheid volgt de bestaande game-state.
- `src/game.js:353`: Zwever wordt na missie 2 beschikbaar; speler springt eerst, tweede druk in de lucht toggelt `p.glide`.
- `src/game.js:397–398`: zweven beperkt verticale val tot ongeveer -1,15 en beweegt alleen in de opgegeven richting; collision schakelt glide uit waar nodig. **Geen physics rewrite nodig.**
- `src/scenery.js:159–164,178`: speler schakelt naar bestaande glide-pose/animatie.
- De *Canvas Backpack with Bedroll* is eerder gekozen en `sf_backpack.mdl` staat in de repo. Een zweefvlieger moet hiermee en met afneembaar gereedschap niet botsen.
- Dit betreft een **door één persoon gedragen zweeftoestel**, geen tweezitsvliegtuig of zichtbaar hangend gemotoriseerd voertuig. Vervang alleen renderobject; laat NPC's, saves, looproutes, missies en vliegen ongewijzigd.

## 2. Kandidaten — brondata 22 november

| Keuze | Model | Bron | Gewicht | Bronlicentie | Oordeel |
|---|---|---|---|---|---|
| **A (stijl)** | [Da Vinci's – Flying Machine — vanessalani](https://sketchfab.com/3d-models/da-vincis-flying-machine-ac60c0bc847e4929bf8aa9772ac49b1a) | Sketchfab | **5.900 triangles** | **CC BY** | Goede richting voor historisch houten/linnen design. Niet automatisch inbouwen: kan groot en mechanisch zijn, check of als *glider* met stilstaande vleugels werkt en waar piloot vastzit |
| **B (technische fallback)** | [Hang Glider – Low Poly — calebcram](https://sketchfab.com/3d-models/hang-glider-low-poly-0452c969d0bc44ff8de463e0b94dfb67) | Sketchfab | **2.100 triangles** | **CC BY** | UV's/texturing in Substance Painter, logisch vliegtuigframe; moderner ogend, vervang kleur en materiaal met canvas/oud hout; check juiste verhoudingen |
| C (functioneel) | [Hang Glider — neutralize](https://sketchfab.com/3d-models/hang-glider-64b8974f71f84283bef27f9ab66df9e6) | Sketchfab | 2.100 triangles | CC BY | Extra model voor A/B als B niet passend is; kwaliteit onbekend zonder viewer |
| D (realistische moderne optie) | [Hang Glider Game Ready — GAMICO](https://sketchfab.com/3d-models/hang-glider-game-ready-3d-model-for-games-2d66d44bc2874f13aebe0c4269fa3745) | Sketchfab | **16.100 triangles** | CC BY | Realistischer deltastructuur, maar te zwaar voor één uitrustingstuk; reduceren naar max. 6–8k en texture 1K, anders afwijzen |
| E (CC0, niet bij stijl) | [Hang glider — Innerscene](https://www.innerscene.com/tools/library/3d-parts/hang-glider-aa3b9adc) | Eigen bron | GLB 12,3 MB, tris onbekend | **CC0** | Juridisch aantrekkelijk, maar technisch/materieel moderne polyester + aluminium constructie met 9,8m spanwijdte, dus niet blind kiezen voor historisch fantasy-Skybound |

### Expliciet afwijzen / niet automatisch opvragen
- [Flying machine — C. Yamahata](https://sketchfab.com/3d-models/flying-machine-40bdbc05e69b464baca9fe547280e522): 260k tris en **CC BY-NC**.
- [Hang Glider – NoAI — Studio Lab](https://sketchfab.com/3d-models/hang-glider-24e607c53e5344d0a53ef73420bd1511): 10,6k tris, geen bewezen downloadlicentie en NoAI; geen voordeel.
- [Electric Powered Hang Glider — JG3D](https://sketchfab.com/3d-models/electric-powered-hang-glider-5d49e9c9a0d1415c91dd8e29cf95cb1d): 123,7k tris, gemotoriseerd en niet passend.
- [Low-Poly Red Hang Glider — JordanPessman](https://sketchfab.com/3d-models/low-poly-red-hang-glider-30ff1695434442278b02a590cf2deba7): 158 tris, zo vereenvoudigd dat het geen realistische upgrade is.
- [It Takes Two hang glider — alex.andain.777](https://sketchfab.com/3d-models/it-takes-two-flying-machine--hang-glider-b6e992f2ab584b019d16ee8a39ba6cff): CC BY-model van specifiek herkenbaar commercieel spelobject (hartpatroon en tuna branding); ongewenste styling/IP-onzekerheid voor Skybound.
- [Hang glider — egormiller.997777](https://sketchfab.com/3d-models/hang-glider-b2256a3876224b4d8b5cbb7e0a104f7f): visueel bruine houten ribben en blauw doek, mogelijk passend, maar **licentie / download en polygons onvoldoende geverifieerd**; eerst broncode/license bekijken vóór enige aanbeveling.

## 3. Visueel ontwerp dat bij Skybound hoort
- Vleugel **linnen of oud canvas**, beige/oker/crème; tweedelige houten raamconstructie met zichtbare lichte dwarsribben; leren riemen, touwen en metalen koppelingen.
- Vermijd grote strakke aluminium deltavleugels, plastic surfkleuren, logo's, ruimtepakken en cartoonvormen. Geen nieuwe zitplaats of cabine: de speler blijft het zichtbare middelpunt.
- Subtiele buiging van doek met animatie, **geen volle cloth simulation**; vleugels mogen niet door het lichaam of de rugzak snijden.
- Geef Niek en Floor hun eigen subtiele accent, maar een gedeelde mesh en materialen voor optimale performance.
- Kleine accessoires kunnen meegaan, maar de rugzak moet blijven en er mag geen dubbele harness ontstaan.

## 4. Technisch contract voor Claude
1. Gebruik de bestaande `p.glide`-state en de `sail.visible`-schakeling. Vervang **alleen** de `sail`-geometrie in één voorbereide branch; behoud save- en spellogica.
2. Meet speelpersonages in bindpose zoals `explorerGear` al doet; hou rekening met beide Rocketbox-child avatarhoudingen en verschillende rugzakmaten. Test van achteren, van voren en van boven.
3. Geef de glider een eigen parent `gliderRoot` als child van `hero.root`, gemonteerd op de beste wereldoriëntatie; animatiepersoon/pose wijzigen alleen als dat noodzakelijk is en na regressietest. Niet op de onafhankelijke positie van het eiland.
4. Scheid "wing/body" van grip/harnas. Zorg dat de handen visueel aan een geloofwaardige stang hangen (of ontwerp schouder-/armmontage als andere pose). Vermijd **door torso heen lopende balken** of vleugels die als een hoed boven het hoofd zweven.
5. Oriëntatie: huidige personage kijkt in lokale -Z-richting; glider moet voorwaarts -Z uit wijzen. Test in draaiende camera, spring, open/dicht, zweven over brug en land.
6. Flight mechanics van `src/game.js` blijven gelijk; directe landing schakelt `p.glide=false` en vleugel moet verdwijnen **zonder achterblijvende onzichtbare collision**. De glider is cosmetisch en krijgt geen losse collision.
7. Doel: **max. 3–6k triangles** voor de glider, 512–1k textuur, weinig gedeelde draw calls. De Da Vinci 5,9k ligt nog binnen een unieke helden-uitrusting; 16,1k moet tot ≤8k worden teruggebracht of vervallen.
8. Leg exacte bronlicentie + licentiebestand vast. **Sketchfab Standard niet gebruiken in een openbare repo** (les uit de cart-audit). Alleen CC0 of CC BY met attribution.
9. Geen wijziging aan productie zonder screenshot A/B met huidig model én mooie nieuwe vleugel, desktop/mobiel FPS en oude savegame zonder item.
10. Test dat openen/sluiten niet op een onbedoelde hoogte kan; behoud bestaande ontgrendeling via `s.stage>=2`, en inspecteer of evt. nieuw model speler zicht niet blokkeert.

## 5. Besluit en vervolg
**Eerst Claude laten kiezen na visuele modelreview:** A Da Vinci als stijlinspiratie; B Calebcram als technisch passende vervanger. Beide als Sketchfab CC BY met bevestiging in `license.txt` na download. Download **niet** 4 modellen, maar maximaal de visueel overtuigende kandidaat. 

Deze review heeft geen code veranderd en geen bestanden gedownload; het aangeleverde werk is brononderzoek + technische integratievoorwaarden.
