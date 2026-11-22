# StudyQuest SKYBOUND — Rugzakken: gecontroleerde vervangingskandidaten
**22 november 2026 — research door ChatGPT, nog geen download of 3D-integratie.**

## Huidige situatie, gecontroleerd in de ontwikkelbranch
In `src/scenery.js` maakt `explorerGear(person,girl)` de huidige rugzak zelf van boxgeometry, voorvakjes, schouderbanden, leren sluitingen en een gerolde deken. De tas is aan `B.Spine2` gekoppeld, waarbij het rugvlak voor beide Rocketbox-kindermodellen wordt opgemeten (o.a. `fit.back`, `fit.top`, `fit.low`). Gereedschap uit het spel zit ook op de rug; de rest van explorerGear (riem, kompas en sjaal) moet blijven werken.

Dit betekent dat **alleen de tasbody en eventuele tas-eigen accessoires** mogen worden vervangen; géén nieuwe speler, rig, werkende toolposities of animaties weggooien. Huidige modellen zijn geen high-poly scans, maar hun eenvoudige hoekige silhouet past visueel steeds minder bij de verbeterde omgeving.

## Eerste kandidaten — echte links, relevante brongegevens

| Prioriteit | Model | Gecontroleerde publicatiegegevens | Advies |
|---|---|---|---|
| **1** | [Canvas Backpack with Bedroll — tevy](https://tevy.dev/models/canvas-backpack-bedroll) | CC0. Hoog 0,56 m; 0,44×0,56×0,30 m. LOD0 7.160 tris / 3,8 MB; **LOD1 2.362 tris / 1,0 MB**; LOD2 716 tris / 283 KB. Download als GLB; losse LOD-files. | **Eerste proefimport:** canvas, leer en gerolde deken passen bij historische ontdekkingsreizigers. Neem LOD1 en vergelijk met de huidige tas op Niek en Floor. LOD0 alleen als in-game detailwinst overtuigt. |
| **2** | [BackPack CC0 — XOIAL, Sketchfab](https://sketchfab.com/3d-models/backpack-cc0-b828c67e4c6f4ee4b7cf692f7567a3db) | Modelpreview toont verweerd leer, gespen en voorvakjes; externe beeldmetadata meldt ca. **1.710 tris**, 1K textuur, **CC0**. | **Sterke tweede visuele kandidaat.** De directe Sketchfab-modelpagina gaf tijdens deze controle een 403; Claude moet bij openen in browser de exacte licentie en trianglecount **zelf verifiëren** vóór download. Contrast in highlight/glans kan iets te gestileerd zijn; beoordelen in game-licht. |
| **3** | [Traveler Backpack — Kirill1991, Sketchfab](https://sketchfab.com/3d-models/traveler-backpack-ada85d776ae24ad29f273a14bf897387) | Publieke Sketchfab-pagina toont **2.300 triangles, 1.400 vertices, CC BY, download beschikbaar**. | **Technisch veilig alternatief** na visuele 3D-review. Geen beschrijving; check of materialen/omvang voldoende realistisch zijn en geen ongewenste accessoires inbegrepen zijn. Attributie vereist bij gebruik. |

## Referenties, maar niet blind downloaden
- [Backpack — SabrinaRodriguesMaia, Sketchfab](https://sketchfab.com/3d-models/backpack-a0de8833537749e2a72c60cfb6dcaca6): op de thumbnail een overtuigende leren rugzak met geblokte slaaprol en zichtbare stiknaden. **Polygonen en licentie konden niet onafhankelijk worden bevestigd**; eerst door Claude controleren in Sketchfab.
- [Backpack - Low Poly PBR — RETROSPEC, Sketchfab](https://sketchfab.com/3d-models/backpack-low-poly-pbr-1-of-2-0b795895343b44b69191ef9b55b35840): **1.100 tris, CC BY, PBR**, maar de maker vermeldt dat het een herwerking van een **ander model** is. Herkomst/licentierechten beide werken nagaan.
- [Backpack — mickeymoose1204, Sketchfab](https://sketchfab.com/3d-models/backpack-1bb0c9be995747e9abe0831d94066fc8): 2.800 tris en CC BY. Technisch geschikt, maar de stijl moet eerst worden vergeleken.

## Afgewezen / geen winst
- [Medieval Adventurer’s Backpack – Game Ready](https://sketchfab.com/3d-models/medieval-adventurers-backpack-game-ready-c60d723167274cf3adae5bbad1dd876d): **73.200 tris**, bovendien niet beschikbaar als CC BY-download op de openbaar geïndexeerde pagina. Te zwaar.
- [19th Century Explorer's Backpack](https://sketchfab.com/3d-models/19th-century-explorers-backpack-28e98ed4793e48c8bdc4d4dab9e95656): **500.000 tris**. Te zwaar ondanks geschikte historische look.
- [Large Camping Backpack (Free/GameReady)](https://sketchfab.com/3d-models/large-camping-backpack-freegameready-a7086b50dae84706b81bb3ce14ad9094): 8.600 tris, CC BY, auteur waarschuwt expliciet **alleen geschikt voor statisch, niet-geanimeerd gebruik**. Geen logische tas voor bewegende speelpersonages.
- [Old Backpack (Renewed Hope)](https://sketchfab.com/3d-models/old-backpack-renewed-hope-d1a73335a05744a291fe6c54e8c67eec): 29.000 tris en **CC BY-NC**, ongeschikt.
- [Adventurer's Backpack, Polyfork](https://polyfork.dev/asset/adventurer-s-backpack-b1365c): 828 tris en CC BY 4.0 bij herdistributie, maar flat-shaded/vertex-colored: mogelijk te cartoonachtig voor gewenste fotorealistische stijl.

## Proefintegratie voor Claude
1. **Geen nieuwe rugzakdownload vragen zonder visuele vergelijking**: eerst tevy LOD1, daarna XOIAL; Kirill1991 als fallback.
2. Maak dezelfde close-up van Niek en Floor van achteren, driekwart achter en lopend; vergelijk silhouet en textuur met de huidige rugzak en het introscherm.
3. Pas exacte schaal, rugvorm, pivot en helling aan op beide Rocketbox-lichamen; volg de bestaande `fit.back`-bepaling.
4. Behoud de `Spine2`-binding en toolposities. Verplaats eventuele gereedschapspunten naar nieuwe tasankers, niet naar het wereldcoördinaatstelsel.
5. De **bestaande** rugzak heeft voor Floor een anders geplaatste slaaprol (lager) dan voor Niek (hoger). Kies bewust een vergelijkbare persoonlijke look of een heldere kleurvariant voor beiden, zonder genderstereotypen.
6. Voorkom dubbele slaaprollen, riemen of schouderbanden wanneer het model zelf die onderdelen al bevat. Verberg alleen de oorspronkelijke tasbody en tas-eigen onderdelen; sjaal, riem, kompas en verdiende tools blijven.
7. Controleer in lopen, sprinten, springen, zweven, binnenlopen en laag camerastandpunt op clipping met schouders, nek en armen.
8. Mik op **max. 3.000 triangles per rugzak** en 512–1024px textures, behalve als een expliciete screenshotvergelijking een uitzondering onderbouwt.
9. Meet extra draw calls en frametime. Houd originele modelbestanden met CC0/CC BY-licentie volgens herdistributieregels; bij CC BY de maker/bron vermelden in credits.
10. Werk op een nieuwe integratiebranch afgeleid van de actuele Claude-code; niet parallel `src/scenery.js` aanpassen vanuit ChatGPT. Geen automatische merge/deploy.

## Aanbevolen besluit
**Nu:** Claude bekijkt tevy LOD1 (CC0, direct downloadbaar) en XOIAL (Sketchfab, CC0 te bevestigen). Hij importeert hoogstens twee modellen voor A/B-vergelijking. Geen blind vervangen van de bestaande gear-setup. De drie eerder gedownloade haard/poort/raam-assets staan hier los van en worden niet nogmaals opgevraagd.
