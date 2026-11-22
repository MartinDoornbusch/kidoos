# StudyQuest — externe assetalternatieven, batch 3
**Onderzoeksdatum:** 22 november 2026  
**Eigenaar:** ChatGPT; review en integratie uitsluitend via Claude  
**Status:** externe modelpagina's en geïndexeerde Sketchfab-metadata onderzocht; **geen bestanden gedownload of verwerkt**

## Scope en wat niet opnieuw moet
- Reeds aan Claude gegeven: *Medieval Wall-Mounted Lantern* (Kigha) en *Medieval House* (DoniTodorov).
- Goedgekeurd en **in verwerking**: *Wooden Bridge Modular Kit* (14.600 triangles hele set) en *Photogrammetry Stone Wall* (2.300).
- Afgewezen: *Modular Medieval Wall – Realistic*, *Ancient Ruins Pack*, eerdere niet-passende Sketchfab-lantaarns en starre Wooden Bridge.
- De Poly Haven meubel-, tuin-, dak- en ruïne-assets blijven Claudes werkstroom; controleer `00_Inbox` voor dubbele bestanden.
- Aanbevolen technische norm: herhaalde props 300–3.000 triangles; hero max. 15.000, 512–1K texturetenzij aantoonbaar nodig, CC0/CC BY + correcte herdistributie/attribution.

## A. Nieuwe shortlist voor visuele review — nog geen downloadgoedkeuring

| Prioriteit | Model en preview | Auteur | Gepubliceerde licentie | Triangles | Voorgesteld gebruik | Waarom / controle |
|---|---|---|---|---:|---|---|
| A1 | [Old Wooden Gate – Game Ready](https://sketchfab.com/3d-models/old-wooden-gate-game-ready-696af15927b74a51afec68e1948088f1) | Krystofeles | CC BY | 2.200 | Toegang gerestaureerde wachttoren / werkplaats | Verweerde planken en metalen scharnieren; check pivot, schaal, materiaal en of deurblad los beweegbaar is |
| A2 | [Medieval window](https://sketchfab.com/3d-models/medieval-window-1b326ec77cfe4798a7c82fbc35783213) | ferrocreative | CC BY | 1.400 | Huisgevels, raammodules | Onder herhaalbudget; vergelijk profiel en kleuren met huidige vakwerkhuizen, raamopeningen niet dichtzetten |
| A3 | [Simple Wooden Stairs](https://sketchfab.com/3d-models/simple-wooden-stairs-51dd486ecb5042408c7dbf7e5bc596b0) | AspectStudios | CC BY | 356 | Trappen huis/wachttoren | Geometrisch extreem licht; check silhouet, natuurlijke verwering via bestaande houten PBR-sets, botsing en staphoogte |
| A4 | [Medieval Fireplace (Free)](https://sketchfab.com/3d-models/medieval-fireplace-free-36b73510064943d2b7a08918339dfb99) | wolfgar74 | CC BY | 2.900 | Interieur, herberg/landhuis | PBR-texturen aanwezig; check realistische proporties, losse hitte-/lichteffecten zonder dure point lights |
| A5 | [Square wooden window (FREE DL)](https://sketchfab.com/3d-models/square-wooden-window-free-dl-abd1539d94bd45c3af4e755d2537ed74) | Dokazvo | CC BY | 212 | Vaak herhaalde ramen | Expliciet game-ready met glas en teksturen, ~90×122 cm; vergelijk visuele kwaliteit met A2, kan te glad zijn |
| A6 | [Medieval Door Low Poly](https://sketchfab.com/3d-models/medieval-door-low-poly-d3ff218d4c7841208c51fbb4a6453e73) | erlangga da | CC BY | 558 | Gewone houten deur | Alleen testen als huidige deuren slechter zijn; game-ready maar mogelijk te vlak/cartoonachtig |
| A7 | [Medieval Stairs](https://sketchfab.com/3d-models/medieval-stairs-48e99c4d603b49caa4d9a0cdd8d2774b) | Rud_H | CC BY | 586 | Stenen trap wachttoren | Alleen als de preview overtuigende steen laat zien; anders afgekeurde stijl, geen download |

## B. Bijzondere bouwpakketten / interieur
| Model | Licentie | Totaal triangles | Advies |
|---|---|---:|---|
| [Modular Medieval Building Pack — Daniel Andersson, OpenGameArt](https://opengameart.org/content/modular-medieval-building-pack) | **CC0**, op bronpagina bevestigd | Niet gepubliceerd | **Eerst zelf review**: 14 ramen, 4 deuren, 4 trappen, daken/balkons en 10 huisbasissen. Bestanden los als Blender ZIP. Reuse met nieuwe PBR-materialen kan goedkoper en flexibeler zijn dan een nieuw geheel |
| [Medieval Small House Interior — AnyRPG](https://sketchfab.com/3d-models/medieval-small-house-interior-88fb950ec1054bb6bd9a3530e9a7f56e) | CC BY op Sketchfab; upstream basis CC0 | circa 3.000 | Geschikt als compacte interior-basisset mits visueel overtuigend; check dependencylicenties (deuren/ramen zijn losse aanvullingen) |
| [Medieval Medium House Interior — AnyRPG](https://sketchfab.com/3d-models/medieval-medium-house-interior-31967bf593d441958631bd41f8429e95) | CC BY op Sketchfab; upstream basis CC0 | circa 10.500 | Uitgebreide modulaire floors/stairs, twee dakopties, pleister en baksteen; hero/interieur, niet massaal instantiëren |
| [Medieval Building with interior — Pedro de Santi](https://sketchfab.com/3d-models/medieval-building-with-interior-2d995df46dd4420093925736f411077b) | CC BY | 12.800 | 3 verdiepingen, afzonderlijke interieur-/deur-/raam-/trapobjecten, met CC0 texturen ambientCG/Poly Haven; check licht, detail en fit bij Skybound |
| [Modular Building Pieces — Alexander Patterson](https://sketchfab.com/3d-models/modular-building-pieces-ae5e446c3eae4316bb12fbb95c6bd69e) | CC BY | 13.500 hele set | 12 modules, waaronder wall/window/doorway/roof/lamp post; mogelijk stedelijk/gothic en te gestileerd voor huidig dorp; vergelijk voor aanschaf/download |

## C. Vrijstaande straatlantaarn — geen blind nieuwe download
**Voorkeur:** gebruik de al goedgekeurde Kigha **wall lantern** als lampkop met een aparte passende realistische houten/ijzeren paal die Claude zelf uit herbruikbare gamegeometrie opbouwt. Geef lampglas een emissive materiaal; vermijd één realtime licht met schaduw per paal. Dit houdt stijl consistent en voorkomt te zware meshes.

Alleen als dit aantoonbaar slechter oogt, vergelijk [Street lights — Star3D](https://sketchfab.com/3d-models/street-lights-a5c6a7b18f3d4a7c8bfae2b2a1fd9d34), **CC BY, 5.800 tris**, met de bestaande lantaarn. Alleen toelaten als reductie tot maximaal 3.000 tris met acceptabel uiterlijk lukt en het ontwerp niet te modern/parkachtig oogt. Bij twijfel niet downloaden.

## D. Uitgesloten na webcontrole
- [Old Wooden window from medieval ages](https://sketchfab.com/3d-models/old-wooden-window-from-medieval-ages-mid-poly-6a8e7a926273405f8779f6b48ee12676): **102.900 tris / 4K textures**; te zwaar voor herhaalde raammodule.
- [Medieval Window — VertXYZ](https://sketchfab.com/3d-models/medieval-window-08d6d0fd8c7c42128bad072f444bbcfc): **160.800 tris**, niet bruikbaar als herhaald huisraam.
- [Medieval Brick Door — Theo](https://sketchfab.com/3d-models/medieval-brick-door-461c62f188d14e489e003fc5b26f9c98): **19.400 tris** en 4K PBR, boven budget voor een deur. Hoogstens hero, maar A1 beter passend.
- [Medieval Door Pack — Thangzy](https://sketchfab.com/3d-models/medieval-door-pack-7359ae35ee664739aaaab25726ca4792): **51.000 tris hele set (5 deuren)**, onnodige last naast A1/A6.
- [Medieval window — Rud_H](https://sketchfab.com/3d-models/medieval-window-f414437729e44713b1d33c05a58bd69a): 933 tris, maar **Free Standard en NoAI**, niet standaard CC BY/CC0: buiten normale openbare-repo-criteria.
- [Wooden Lamp Post Medieval Fantasy Lantern](https://sketchfab.com/3d-models/wooden-lamp-post-medieval-fantasy-lantern-7272ba80886d4d9d897d783c708adb2d): **CC BY-NC**, niet toegestaan.
- [Medieval Lamp Post — The 8th noble lab](https://sketchfab.com/3d-models/medieval-lamp-post-6373453ad79748b38784db0fcf25ea12): 13.700 tris, 4K scans, glas/licht ontbreken.
- [Medieval Lamp Post — Glowbox 3D](https://sketchfab.com/3d-models/medieval-lamp-post-475f7f916c964948887a7f8b8f769da5): 8.200 tris en NoAI, geen voordeel boven gedeelde goedgekeurde lamp.
- [Modular Medieval Building Pack — Joseph Montalvo](https://sketchfab.com/3d-models/stylized-modular-medieval-building-pack-be9fc8ce7b7143939e10324544c2e687): 23.100 triangles hele set, bewust gestileerd; voorlopig de CC0-modulaire set prefereren.

## Visual-review instructie aan Claude
1. Controleer actuele lokale branch / `00_Inbox` en bestaande objecten (niet alleen de `main` branch).
2. Leg **huidig object versus kandidaat** naast elkaar vanuit dezelfde camera en belichting.
3. Geef per kandidaat: beter/niet beter, bronlicentie, polys na conversie, textures, in-game toepassing en het voorgestelde duplicaat dat vervalt.
4. Herhaal geen onderzoek naar reeds afgekeurde of in verwerking zijnde modellen.
5. **Eerste aanvraag voor review, niet download:** A1 poort, A2 raam, A3 trap, A4 open haard; als uitbreiding A5 herhaald raam en CC0 bouwpakket. Vrijstaande lantaarns eerst via bestaande Kigha-lamp.
6. Voor externe login-geblokkeerde assets: vraag gebruiker pas na definitieve visuele goedkeuring de bestanden in `00_Inbox` te zetten.
7. Geen merge/deploy van dit onderzoeksdocument en geen wijzigingen aan `world.js`, `game.js` of andere Claudebestanden als onderdeel van research.

**Herkomstinformatie:** Sketchfab en OpenGameArt openbare bronpagina's, opgezocht 22 november 2026. Poly-aantallen zijn de op bronpagina's gepubliceerde totalen, dus nooit een garantie voor afzonderlijke onderdelen. Definitieve PBR-texture-sets / afmetingen moeten na inzage in de downloads worden vastgesteld.
