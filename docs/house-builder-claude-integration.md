# StudyQuest — Bouwkavels, huizen ontwerpen en inrichten
**Implementatiecontract voor Claude · 22 november 2026**  
**Status:** losstaande modules op branch `feature/construction-projects-chatgpt`. Nog **niet in de spelwereld ingebouwd**.

## Veilig samen ontwikkelen

Claude is eigenaar van `game.js`, `world.js`, `collision.js`, grafische assets, `index.html`, UI-styling en Vercel. ChatGPT werkt alleen aan losstaande bouwlogica en regressietests. Houd wijzigingen gescheiden totdat de actuele Claude-ontwikkelbranch klaar is voor integratie. **Deze draft-PR mag niet blind naar `main` worden gemerged.** De GitHub-branches `assets-extern` en `visuals-1.7` zijn intussen afgedwaald van `main`.

De bouwmodule is geen vervanging van het bestaande vrije bouwen (`s.builds`). Ze voegt een nieuw, expliciet bouwproject toe.

## Aanwezig op deze branch

| Onderdeel | Bestand | Verantwoordelijkheid |
|---|---|---|
| Bouwfases/materialen | `src/construction-projects.js` | 5 fasen voor vakwerkhuis en ruïne |
| Restauratieverhaal | `src/construction-story.js` | NPC, verhaal, assetrollen, beloningen |
| Opgave- en saveflow | `src/construction-campaign.js` | Correcte leerantwoorden, mijlpalen en save |
| Ontwerp en 3D-bouwplan | `src/house-designer.js` | Gevel, ramen, deur, dak, footprint, meubels |
| Save-/inventariskoppeling | `src/house-planner.js` | Bouwproject starten, reviseren, meubels kopen/bewaren |
| Tests | `src/checks/construction-projects.test.js`, `construction-campaign.test.js`, `house-planner.test.js` | Regels en regressies |

In Node: `node src/checks/house-planner.test.js`. De afzonderlijke ontwerp- en orchestratieregels zijn met smoke tests gecontroleerd; voer de volledige Node-regressiesuite opnieuw uit bij integratie.

## Speelervaring: van leeg perceel tot ingericht huis

### A. Bouwkavel kiezen
- De speler kiest in het bestaande **Bouwboek** de optie **Mijn huis**.
- Toon alleen geschikte, vooraf goedgekeurde kavels op een eiland. **Kies geen coördinaten zonder in-game controle**.
- Plaats een transparant 3D-ontwerp (geen blijvende placeholder) met zichtbare footprint en entree.
- 90-gradenrotaties mogelijk; elke rotatie kan de geschiktheid van de kavel veranderen.
- Gebruik `HouseDesigner.checkSite(design, {plot, obstacles, worldCheck})`. Die controleert planvorm, oriëntatie, afstand tot obstakels én vereist expliciete wereldcontrole. Zonder `worldCheck` mag geen plaatsing worden bevestigd.
- Het bestaande `world.blocked` en de paden/NPC-routes/bruggen moeten worden meegenomen in `worldCheck`. De zuivere module kent hun geometrie niet.

### B. Huis samenstellen
Eerste prototype: buitenmaat **8 × 6 meter**. Verdere groottevariaties later, zodat de bestaande materiaalrecepten consistent blijven.

| Optie | Waarden |
|---|---|
| Gevel | `plaster` / `brick` / `stone` |
| Houtwerk | `oak` / `dark_oak` / `weathered` |
| Dakvorm | `gable` / `hip` |
| Dakmateriaal | `clay_red` / `clay_brown` / `slate` |
| Binnenvloer | `oak_planks` / `stone_tiles` |
| Entree | Midden aan voorkant of achterkant |
| Ramen | 12 mogelijke gevelslots; maximaal 8 ramen; nooit op dezelfde plek als de deur |

Gebruik de bestaande hoogwaardige assets en PBR-materialen voor deze varianten. **Een dakmateriaal mag niet onbedoeld als woonkamervloer worden gebruikt.** Voor extra dak-/gevelmaterialen eerst licentie en style match beoordelen.

### C. Bouwen in vijf fasen
Gebruik de bestaande bouwprojecten-flow:
1. Fundering.
2. Houten draagconstructie.
3. Gevelpanelen met echte raam- en deuropeningen.
4. Dak.
5. Vloer en toegankelijk interieur.

Gebruik `ConstructionCampaign.complete` nadat de speler materialen heeft verzameld en echte leeropdrachten heeft afgerond. Het bestaande vraagbanksysteem geeft de correct-beoordeelde events door aan `ConstructionCampaign.answer`. Geen vragen direct in het ontwerppaneel verzinnen.

**Visueel contract:** `HouseDesigner.visualPlan(design, completedStages)` levert `visible` en `preview`. Claude koppelt de rollen `foundation`, `frame`, `wall_panel`, `door_opening`, `window_opening`, `roof`, `interior_floor`, `furniture` aan realistische mesh-bouwstenen. Toon voor een voltooide fase alleen de bijbehorende onderdelen. Geometry/texture-instanties hergebruiken; geen losse tien- of honderdduizenden blokjes.

### D. Aanpassen tot het onderdeel daadwerkelijk gebouwd is
- Voor fundering: kavel/positie/rotatie aanpassen.
- Voor muren klaar zijn: gevel, houtwerk, deur en ramen aanpassen.
- Voor dak klaar is: dakvorm en materiaal wijzigen.
- Voor interieur klaar is: vloermateriaal wijzigen.
- Na voltooiing: inrichting aanpassen.

`HouseDesigner.edit(design, patch, completedStages)` blokkeert wijzigingen na de bijbehorende mijlpaal. Verplaatsing, draaiing en deurverandering vereisen nieuwe `worldCheck` via `HousePlanner.change`.

### E. Inrichten
Na bouwfase 5:
- Tafel, stoel, bank, bed, kist en boekenkast beschikbaar.
- Plaatsen met 0,5-meter-raster, om overlap te voorkomen.
- Houd de looproute voor de deur vrij.
- Een nieuw meubel kost hout en/of planken.
- Verplaatsen is gratis.
- Wegnemen zet het meubel in `houseFurnitureStorage`; opnieuw plaatsen kost geen extra materiaal.
- De modules wijzigen het bestaande `s.items` of `s.builds` niet.

Dit is een eerste functioneel meubelassortiment. Assetmodellen kunnen later worden toegewezen op basis van beschikbaarheid/licentie en prestatiebudget.

## JavaScript-integratie

Voeg in de browser na de huidige spelscripts en **vóór** `game.js` deze modules in volgorde toe wanneer de UI en wereldadapter klaar zijn:

```html
<script src="construction-projects.js"></script>
<script src="construction-story.js"></script>
<script src="construction-campaign.js"></script>
<script src="house-designer.js"></script>
<script src="house-planner.js"></script>
```

### Plan, controle en begin nieuw huis

```js
const design = HouseDesigner.create({
  projectId: "house-001", plotId: approvedPlot.id, x: approvedPlot.x, z: approvedPlot.z
});
const result = HousePlanner.begin(s, design, {
  plot: approvedPlot,
  obstacles: approvedWorldObstacles,
  worldCheck: ({footprint, door, design}) => {
    // Claude: daadwerkelijke controle tegen bestaande world / paths / NPC.
    return validateWorldFootprintAndEntrance(footprint, door, design);
  }
});
if (result.ok) {
  s = result.save;
  world.sync(s);
  persist();
}
```

### Ontwerpwijziging vóór de bouwfase vergrendeld is

```js
const r = HousePlanner.change(s,"house-001",{roof:"hip",roofMaterial:"clay_brown"});
if (r.ok) { s = r.save; persist(); renderHousePlan(r.design); }
```

### Meubel kopen en plaatsen

```js
const r = HousePlanner.placeFurniture(s,"house-001",{
  id:"dining-table-01", type:"table", x:0, z:0, rotation:0
});
if (r.ok) { s = r.save; persist(); renderHousePlan(HousePlanner.get(s,"house-001").design); }
```

De hierboven genoemde `validateWorldFootprintAndEntrance`, `renderHousePlan` en gekoppelde wereld-/UI-functies zijn integratiepunten, **niet reeds aanwezige functies**.

## Save-model: additieve migratie

```js
s.constructionProjects ??= [];       // van ConstructionCampaign
s.constructionStudy ??= {};          // correcte vraagcredits per huidige fase
s.constructionUnlocks ??= [];        // onder meer wachttorenbeloning
s.constructionDesigns ??= {};        // projectId -> volledig huisontwerp
s.houseFurnitureStorage ??= [];      // weggenomen meubels, opnieuw plaatsbaar
```

Bestaande saves zonder nieuwe keys blijven werken. Houd de bestaande spelersprofielen, `s.builds`, materialen, munten, voortgang en toetsresultaten intact. Omdat de lokale game single-threaded is, moeten updates van project en inventaris als één nieuwe save worden overgenomen. Integratie met meerdere apparaten moet extra synchronisatie-/conflictregels krijgen; die zijn nu niet gebouwd.

## Minimale acceptatiecriteria

- Nieuw huis past uitsluitend op een werkelijk gecontroleerde bouwkavel.
- Draaien en deurzijde veranderen kunnen de plaatsing ongeldig maken.
- Ramen zitten nooit op de deurpositie.
- De speler loopt niet door gesloten gevels en kan door de deur het huis betreden.
- Uitgebouwde fasen en afgeschreven grondstoffen komen exact overeen.
- Ingezette materialen worden niet dubbel afgeschreven.
- Bestaande vrije bouwwerken blijven behouden.
- Inrichting wordt na herladen op dezelfde plek getoond.
- Meubels overlappen niet, staan niet buiten de muren en blokkeren de deur niet.
- Meubels opnieuw uit opslag plaatsen kost geen tweede keer materialen.
- Niek en Floor krijgen alleen daadwerkelijk beschikbare leeropgaven op hun eigen niveau.
- De renderer gebruikt realistische assets, gedeelde materialen, gepaste LOD/instancing en blijft responsief op desktop en mobiel.
- Geen automatische merge of Vercel-productiedeploy.

**Nog niet klaar:** 3D-UI, daadwerkelijke kavels en collision, toegankelijke interiors, buildercamera, echte modelrendering en productieintegratie. Dit document definieert hoe de huidige gescheiden code veilig kan worden ingebouwd zonder conflict met Claude.
