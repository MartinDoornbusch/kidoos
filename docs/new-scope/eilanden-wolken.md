# Nieuwe scope — zwevende eilanden en atmosfeer

**Alleen terrein-/luchtgeometrie.** Niet overlappend met PR #8 (water), PR #9 (gebouwen), PR #10 (paden/bomen), PR #11 (vuurtoren).

## Huidige stand
- `src/world.js` genereert zwevende eilanden met `island()` en cliff-geometry. Er is een bestaande HDR-panorama `art/alpen.jpg` en mist, maar de wolkenlaag bevat ca. **100 afzonderlijke transparante planes** en ca. **90 wolkenvloer-instances** (`world.js:1015–1022`).
- Doel: overtuigend **volume** en diepte, zonder overweldigende vlakke witte billboards, plastic rotsbodems of zichtbare tiling.

## Opdracht voor Claude
1. Screenshots vanaf brug, zijaanzicht van eilanden en zeppelin/zweefvlucht, op verschillende afstanden en belichting.
2. Verbeter alleen eilandklif/bodem-silhouetten, steenlaagvariatie en atmosferische mist/laaghangende wolken; eilandlocaties en vaste speelterreinen mogen niet verschuiven.
3. Geef wolken diepte door lichte gelaagde oplossingen (parallax, zachte rand, fog/zachte blending), zonder zware volumetric/cloud ray marching op mobiel.
4. Behoud `islands`-centers, lift, brugverankering, collision/hoogteberekening, LOD en de zichtbaarheid van de sterrentoren.
5. A/B + desktop/mobiel frametime, transparantie-overdraw en speelroutes; geen willekeurige extra eilanden plaatsen.

**Niet in scope:** waterstroombanen, rivieren, rotsprops, bomen, grondpaden of structuur van de gebouwen.